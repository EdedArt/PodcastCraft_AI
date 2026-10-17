const express = require('express');
const crypto = require('crypto');
const util = require('util');
const { readAuth, writeAuth, mutateAuth } = require('../storage');

const scryptAsync = util.promisify(crypto.scrypt);
const router = express.Router();

/**
 * Limitador de concurrencia para crypto.scrypt asíncrono.
 * Máximo 2 cálculos en paralelo; hasta 20 solicitudes en espera.
 * Si la cola está llena, rechaza inmediatamente con 503 ("Servidor ocupado, intenta de nuevo").
 */
class ScryptLimiter {
  constructor(maxConcurrent = 2, maxQueue = 20) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueue = maxQueue;
    this.active = 0;
    this.maxActiveSeen = 0;
    this.queue = [];
  }

  acquire() {
    if (this.active < this.maxConcurrent) {
      this.active++;
      if (this.active > this.maxActiveSeen) {
        this.maxActiveSeen = this.active;
      }
      return Promise.resolve();
    }
    if (this.queue.length >= this.maxQueue) {
      const err = new Error('Servidor ocupado, intenta de nuevo');
      err.statusCode = 503;
      return Promise.reject(err);
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.active--;
    }
  }

  async hash(password, salt, keylen = 64) {
    await this.acquire();
    try {
      const derivedKey = await scryptAsync(password, salt, keylen);
      return derivedKey.toString('hex');
    } finally {
      this.release();
    }
  }
}

/**
 * Freno a fuerza bruta en memoria acotada.
 * - Por usuario: tras 5 fallos consecutivos en login, resume o recover -> bloqueo de 30 s con 429.
 * - Global: máximo 5 creaciones de cuenta por minuto.
 * - Tamaño máximo de 1000 entradas para evitar crecimiento desmedido de memoria.
 */
class BoundedRateLimiter {
  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
    this.userFailures = new Map(); // usernameKey -> { count, blockedUntil, lastUpdate }
    this.globalCreations = []; // timestamps
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.userFailures.entries()) {
      if (record.blockedUntil <= now && (now - record.lastUpdate) > 300000) {
        this.userFailures.delete(key);
      }
    }
  }

  checkUserBruteForce(usernameKey) {
    this.cleanup();
    const record = this.userFailures.get(usernameKey);
    if (!record) return { blocked: false };
    const now = Date.now();
    if (record.blockedUntil > now) {
      const secondsRemaining = Math.ceil((record.blockedUntil - now) / 1000);
      return { blocked: true, retryAfter: Math.max(1, secondsRemaining) };
    }
    return { blocked: false };
  }

  recordFailure(usernameKey) {
    this.cleanup();
    const now = Date.now();
    let record = this.userFailures.get(usernameKey);
    if (!record) {
      if (this.userFailures.size >= this.maxEntries) {
        // Desalojar la clave más antigua para no superar maxEntries
        const firstKey = this.userFailures.keys().next().value;
        this.userFailures.delete(firstKey);
      }
      record = { count: 0, blockedUntil: 0, lastUpdate: now };
      this.userFailures.set(usernameKey, record);
    }
    record.count++;
    record.lastUpdate = now;
    if (record.count >= 5) {
      record.blockedUntil = now + 30000; // Bloqueo de 30 segundos
      record.count = 0;
      return { blocked: true, retryAfter: 30 };
    }
    return { blocked: false, count: record.count };
  }

  recordSuccess(usernameKey) {
    this.userFailures.delete(usernameKey);
  }

  checkGlobalAccountCreation() {
    const now = Date.now();
    this.globalCreations = this.globalCreations.filter(t => now - t < 60000);
    if (this.globalCreations.length >= 5) {
      const oldest = this.globalCreations[0];
      const retryAfter = Math.ceil((60000 - (now - oldest)) / 1000);
      return { allowed: false, retryAfter: Math.max(1, retryAfter) };
    }
    return { allowed: true };
  }

  recordAccountCreation() {
    this.globalCreations.push(Date.now());
  }

  reset() {
    this.userFailures.clear();
    this.globalCreations = [];
  }
}

const scryptLimiter = new ScryptLimiter(2, 20);
const rateLimiter = new BoundedRateLimiter(1000);

// Alfabeto sin caracteres ambiguos (sin 0, O, 1, I, L)
const RECOVERY_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function generateRememberToken() {
  return crypto.randomBytes(32).toString('hex'); // 64 caracteres hex
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

function generateRecoveryCode() {
  let chars = '';
  for (let i = 0; i < 12; i++) {
    const idx = crypto.randomInt(0, RECOVERY_ALPHABET.length);
    chars += RECOVERY_ALPHABET[idx];
  }
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

function normalizeRecoveryCode(raw) {
  if (typeof raw !== 'string') return null;
  if (raw.length > 20) return null;
  const cleaned = raw.toUpperCase().replace(/[\s-]/g, '');
  if (cleaned.length !== 12) return null;
  return cleaned;
}

function safeCompare(aHex, bHex) {
  if (typeof aHex !== 'string' || typeof bHex !== 'string') return false;
  const bufA = Buffer.from(aHex, 'hex');
  const bufB = Buffer.from(bHex, 'hex');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const USERNAME_REGEX = /^[\p{L}\p{N}._-]+$/u;

/**
 * Valida los tipos y límites de usuario.
 * @param {string} username
 * @returns {{ valid: boolean, error?: string, trimmed?: string }}
 */
function validateUsername(username) {
  if (typeof username !== 'string') {
    return { valid: false, error: 'El nombre de usuario debe ser una cadena de texto.' };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 32) {
    return { valid: false, error: 'El nombre de usuario debe tener entre 3 y 32 caracteres.' };
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return { valid: false, error: 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos.' };
  }
  return { valid: true, trimmed };
}

/**
 * Valida los tipos y límites de contraseña.
 * @param {string} password
 * @param {string} fieldName
 * @returns {{ valid: boolean, error?: string }}
 */
function validatePassword(password, fieldName = 'contraseña') {
  if (typeof password !== 'string') {
    return { valid: false, error: `La ${fieldName} debe ser una cadena de texto.` };
  }
  if (password.length < 6 || password.length > 128) {
    return { valid: false, error: `La ${fieldName} debe tener entre 6 y 128 caracteres.` };
  }
  if (Buffer.byteLength(password, 'utf8') > 256) {
    return { valid: false, error: `La ${fieldName} excede el límite máximo de 256 bytes UTF-8.` };
  }
  return { valid: true };
}

/**
 * GET /api/auth/status
 * Devuelve si ya existe al menos una cuenta configurada.
 */
router.get('/status', async (req, res, next) => {
  try {
    const auth = await readAuth();
    const hasUsers = Array.isArray(auth.users) && auth.users.length > 0;
    res.json({ configured: hasUsers });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/setup
 * Permite crear una nueva cuenta (funciona siempre hasta el tope de 10 cuentas).
 * Devuelve { success, username, recoveryCode }.
 */
router.post('/setup', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Cuerpo de la petición inválido.' });
    }

    const { username, password } = req.body;

    const userValidation = validateUsername(username);
    if (!userValidation.valid) {
      return res.status(400).json({ error: userValidation.error });
    }
    const trimmedUser = userValidation.trimmed;

    const passValidation = validatePassword(password);
    if (!passValidation.valid) {
      return res.status(400).json({ error: passValidation.error });
    }

    // Freno global: máximo 5 creaciones de cuenta por minuto
    const globalRate = rateLimiter.checkGlobalAccountCreation();
    if (!globalRate.allowed) {
      res.setHeader('Retry-After', globalRate.retryAfter);
      return res.status(429).json({
        error: `Demasiadas cuentas creadas recientemente. Intenta de nuevo en ${globalRate.retryAfter} segundos.`,
        retryAfter: globalRate.retryAfter
      });
    }

    const usernameKey = trimmedUser.toLowerCase();
    let recoveryCodeToReturn = null;

    await mutateAuth(async (auth) => {
      if (!Array.isArray(auth.users)) {
        auth.users = [];
      }

      if (auth.users.length >= 10) {
        const err = new Error('Se ha alcanzado el límite máximo de 10 cuentas en el sistema.');
        err.statusCode = 403;
        throw err;
      }

      if (auth.users.some(u => u.usernameKey === usernameKey)) {
        const err = new Error('Ese usuario ya existe.');
        err.statusCode = 400;
        throw err;
      }

      const passSalt = generateSalt();
      const passHash = await scryptLimiter.hash(password, passSalt);

      const rawRecoveryCode = generateRecoveryCode();
      recoveryCodeToReturn = rawRecoveryCode;
      const normalizedRecovery = normalizeRecoveryCode(rawRecoveryCode);
      const recSalt = generateSalt();
      const recHash = await scryptLimiter.hash(normalizedRecovery, recSalt);

      auth.users.push({
        username: trimmedUser,
        usernameKey,
        passwordHash: passHash,
        salt: passSalt,
        recoveryHash: recHash,
        recoverySalt: recSalt,
        rememberTokens: []
      });

      return auth;
    });

    rateLimiter.recordAccountCreation();

    return res.status(201).json({
      success: true,
      username: trimmedUser,
      recoveryCode: recoveryCodeToReturn,
      message: 'Cuenta creada con éxito.'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Inicia sesión con usuario y contraseña. Opcionalmente genera token "Recordarme".
 */
router.post('/login', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Cuerpo de la petición inválido.' });
    }

    const { username, password, remember } = req.body;

    const userValidation = validateUsername(username);
    if (!userValidation.valid) {
      return res.status(400).json({ error: userValidation.error });
    }
    const trimmedUser = userValidation.trimmed;

    const passValidation = validatePassword(password);
    if (!passValidation.valid) {
      return res.status(400).json({ error: passValidation.error });
    }

    if (remember !== undefined && typeof remember !== 'boolean') {
      return res.status(400).json({ error: 'El campo "remember" debe ser un booleano (true o false).' });
    }

    const usernameKey = trimmedUser.toLowerCase();

    // Verificación de bloqueo por fuerza bruta para este usuario
    const bruteForce = rateLimiter.checkUserBruteForce(usernameKey);
    if (bruteForce.blocked) {
      res.setHeader('Retry-After', bruteForce.retryAfter);
      return res.status(429).json({
        error: `Demasiados intentos fallidos. Intenta de nuevo en ${bruteForce.retryAfter} segundos.`,
        retryAfter: bruteForce.retryAfter
      });
    }

    const auth = await readAuth();
    const user = Array.isArray(auth.users) ? auth.users.find(u => u.usernameKey === usernameKey) : null;

    if (!user) {
      rateLimiter.recordFailure(usernameKey);
      return res.status(401).json({
        error: 'Usuario o contraseña incorrectos.'
      });
    }

    const computedHash = await scryptLimiter.hash(password, user.salt);
    const isValid = safeCompare(computedHash, user.passwordHash);

    if (!isValid) {
      rateLimiter.recordFailure(usernameKey);
      return res.status(401).json({
        error: 'Usuario o contraseña incorrectos.'
      });
    }

    // Éxito: limpiar contador de fallos
    rateLimiter.recordSuccess(usernameKey);

    let rememberToken = null;
    let generatedRecoveryCode = null;

    await mutateAuth(async (latestAuth) => {
      const targetUser = latestAuth.users.find(u => u.usernameKey === usernameKey);
      if (!targetUser) return latestAuth;

      // Migración: si la cuenta no tenía recoveryHash, se genera en este primer login exitoso
      if (!targetUser.recoveryHash) {
        generatedRecoveryCode = generateRecoveryCode();
        const norm = normalizeRecoveryCode(generatedRecoveryCode);
        targetUser.recoverySalt = generateSalt();
        targetUser.recoveryHash = await scryptLimiter.hash(norm, targetUser.recoverySalt);
      }

      if (!Array.isArray(targetUser.rememberTokens)) {
        targetUser.rememberTokens = [];
      }

      // Limpiar tokens expirados
      const now = Date.now();
      targetUser.rememberTokens = targetUser.rememberTokens.filter(t => t && t.expiresAt > now);

      if (remember === true) {
        rememberToken = generateRememberToken();
        const tokenHash = hashToken(rememberToken);
        const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 días

        targetUser.rememberTokens.push({ hash: tokenHash, expiresAt });

        // Máximo 5 tokens vigentes por cuenta (se descartan los más antiguos)
        if (targetUser.rememberTokens.length > 5) {
          targetUser.rememberTokens = targetUser.rememberTokens.slice(-5);
        }
      }

      return latestAuth;
    });

    const response = {
      success: true,
      username: user.username
    };

    if (rememberToken) {
      response.token = rememberToken;
    }
    if (generatedRecoveryCode) {
      response.recoveryCode = generatedRecoveryCode;
    }

    return res.json(response);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/auth/resume
 * Valida un token "Recordarme" persistido localmente.
 * Un token válido no se rota.
 */
router.post('/resume', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Cuerpo de la petición inválido.' });
    }

    const { username, token } = req.body;

    const userValidation = validateUsername(username);
    if (!userValidation.valid) {
      return res.status(400).json({ error: userValidation.error });
    }
    const trimmedUser = userValidation.trimmed;

    if (typeof token !== 'string') {
      return res.status(400).json({ error: 'El token debe ser una cadena de texto.' });
    }
    if (!/^[0-9a-fA-F]{64}$/.test(token)) {
      return res.status(400).json({ error: 'El token debe tener exactamente 64 caracteres hexadecimales.' });
    }

    const usernameKey = trimmedUser.toLowerCase();

    // Verificación de bloqueo por fuerza bruta para este usuario
    const bruteForce = rateLimiter.checkUserBruteForce(usernameKey);
    if (bruteForce.blocked) {
      res.setHeader('Retry-After', bruteForce.retryAfter);
      return res.status(429).json({
        error: `Demasiados intentos fallidos. Intenta de nuevo en ${bruteForce.retryAfter} segundos.`,
        retryAfter: bruteForce.retryAfter
      });
    }

    const auth = await readAuth();
    const user = Array.isArray(auth.users) ? auth.users.find(u => u.usernameKey === usernameKey) : null;

    if (!user) {
      rateLimiter.recordFailure(usernameKey);
      return res.status(401).json({ error: 'Sesión inválida o expirada.' });
    }

    const tokenHash = hashToken(token);
    const now = Date.now();

    const matchingToken = Array.isArray(user.rememberTokens)
      ? user.rememberTokens.find(t => t && t.expiresAt > now && safeCompare(t.hash, tokenHash))
      : null;

    if (!matchingToken) {
      rateLimiter.recordFailure(usernameKey);
      return res.status(401).json({ error: 'Sesión inválida o expirada.' });
    }

    rateLimiter.recordSuccess(usernameKey);
    return res.json({
      success: true,
      username: user.username
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/auth/recover
 * Restablece la contraseña usando el código de recuperación de 12 caracteres.
 * Rota el código (devuelve el nuevo) e invalida todos los tokens "Recordarme".
 */
router.post('/recover', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Cuerpo de la petición inválido.' });
    }

    const { username, recoveryCode, newPassword } = req.body;

    const userValidation = validateUsername(username);
    if (!userValidation.valid) {
      return res.status(400).json({ error: userValidation.error });
    }
    const trimmedUser = userValidation.trimmed;

    if (typeof recoveryCode !== 'string') {
      return res.status(400).json({ error: 'El código de recuperación debe ser una cadena de texto.' });
    }
    if (recoveryCode.length > 20) {
      return res.status(400).json({ error: 'El código de recuperación excede el tamaño máximo permitido.' });
    }
    const normalizedCode = normalizeRecoveryCode(recoveryCode);
    if (!normalizedCode) {
      return res.status(400).json({ error: 'El código de recuperación debe tener exactamente 12 caracteres.' });
    }

    const passValidation = validatePassword(newPassword, 'nueva contraseña');
    if (!passValidation.valid) {
      return res.status(400).json({ error: passValidation.error });
    }

    const usernameKey = trimmedUser.toLowerCase();

    // Verificación de bloqueo por fuerza bruta para este usuario
    const bruteForce = rateLimiter.checkUserBruteForce(usernameKey);
    if (bruteForce.blocked) {
      res.setHeader('Retry-After', bruteForce.retryAfter);
      return res.status(429).json({
        error: `Demasiados intentos fallidos. Intenta de nuevo en ${bruteForce.retryAfter} segundos.`,
        retryAfter: bruteForce.retryAfter
      });
    }

    const auth = await readAuth();
    const user = Array.isArray(auth.users) ? auth.users.find(u => u.usernameKey === usernameKey) : null;

    if (!user || !user.recoveryHash || !user.recoverySalt) {
      rateLimiter.recordFailure(usernameKey);
      return res.status(401).json({ error: 'Datos de recuperación inválidos.' });
    }

    const computedRecHash = await scryptLimiter.hash(normalizedCode, user.recoverySalt);
    const isValid = safeCompare(computedRecHash, user.recoveryHash);

    if (!isValid) {
      rateLimiter.recordFailure(usernameKey);
      return res.status(401).json({ error: 'Datos de recuperación inválidos.' });
    }

    // Código válido: reiniciar contador de fallos
    rateLimiter.recordSuccess(usernameKey);

    const newSalt = generateSalt();
    const newPassHash = await scryptLimiter.hash(newPassword, newSalt);

    const newRawCode = generateRecoveryCode();
    const newNormalized = normalizeRecoveryCode(newRawCode);
    const newRecSalt = generateSalt();
    const newRecHash = await scryptLimiter.hash(newNormalized, newRecSalt);

    await mutateAuth(async (latestAuth) => {
      const targetUser = latestAuth.users.find(u => u.usernameKey === usernameKey);
      if (!targetUser) return latestAuth;

      targetUser.salt = newSalt;
      targetUser.passwordHash = newPassHash;
      targetUser.recoverySalt = newRecSalt;
      targetUser.recoveryHash = newRecHash;
      // Invalida todos los tokens "Recordarme" de esa cuenta
      targetUser.rememberTokens = [];

      return latestAuth;
    });

    return res.json({
      success: true,
      username: user.username,
      recoveryCode: newRawCode,
      message: 'Contraseña restablecida con éxito.'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Elimina el token "Recordarme" de la cuenta especificada. Tolera que no exista.
 */
router.post('/logout', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Cuerpo de la petición inválido.' });
    }

    const { username, token } = req.body;

    if (typeof username === 'string' && typeof token === 'string' && /^[0-9a-fA-F]{64}$/.test(token)) {
      const usernameKey = username.trim().toLowerCase();
      const tokenHash = hashToken(token);

      await mutateAuth(async (auth) => {
        if (!Array.isArray(auth.users)) return auth;
        const user = auth.users.find(u => u.usernameKey === usernameKey);
        if (user && Array.isArray(user.rememberTokens)) {
          user.rememberTokens = user.rememberTokens.filter(t => t && !safeCompare(t.hash, tokenHash));
        }
        return auth;
      });
    }

    return res.json({ success: true, message: 'Sesión cerrada con éxito.' });
  } catch (error) {
    next(error);
  }
});

// Endpoints auxiliares para pruebas automatizadas (activos ÚNICAMENTE durante pruebas con PODCASTCRAFT_STORAGE_DIR temporal)
if (process.env.PODCASTCRAFT_STORAGE_DIR) {
  router.post('/test-reset-rate-limit', (req, res) => {
    rateLimiter.reset();
    res.json({ success: true });
  });

  router.post('/test-simulate-failures', (req, res) => {
    const count = Number(req.body && req.body.count) || 5000;
    for (let i = 0; i < count; i++) {
      rateLimiter.recordFailure(`synthetic_usr_${i}`);
    }
    res.json({ size: rateLimiter.userFailures.size });
  });

  router.get('/test-scrypt-stats', (req, res) => {
    res.json({
      active: scryptLimiter.active,
      maxActiveSeen: scryptLimiter.maxActiveSeen,
      queueLength: scryptLimiter.queue.length
    });
  });
}

module.exports = router;
module.exports.scryptLimiter = scryptLimiter;
module.exports.rateLimiter = rateLimiter;
module.exports.normalizeRecoveryCode = normalizeRecoveryCode;
