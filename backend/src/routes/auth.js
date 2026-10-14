const express = require('express');
const crypto = require('crypto');
const { readAuth, writeAuth } = require('../storage');

const router = express.Router();

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function isAuthConfigured(auth) {
  return Boolean(auth && auth.username && auth.passwordHash && auth.salt);
}

/**
 * GET /api/auth/status
 * Devuelve si ya existe un usuario configurado o si es el primer arranque.
 */
router.get('/status', async (req, res, next) => {
  try {
    const auth = await readAuth();
    res.json({ configured: isAuthConfigured(auth) });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/setup
 * Permite configurar el usuario inicial. Solo permitido si configured === false.
 */
router.post('/setup', async (req, res, next) => {
  try {
    const auth = await readAuth();
    if (isAuthConfigured(auth)) {
      return res.status(400).json({
        error: 'El sistema ya tiene un usuario configurado. Inicia sesión directamente.'
      });
    }

    const { username, password } = req.body || {};
    const trimmedUser = typeof username === 'string' ? username.trim() : '';

    if (!trimmedUser) {
      return res.status(400).json({
        error: 'El nombre de usuario es requerido.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres.'
      });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const newAuth = {
      username: trimmedUser,
      passwordHash,
      salt
    };

    await writeAuth(newAuth);

    return res.status(201).json({
      success: true,
      username: trimmedUser,
      message: 'Usuario configurado con éxito.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Valida credenciales contra las almacenadas localmente en auth.json.
 */
router.post('/login', async (req, res, next) => {
  try {
    const auth = await readAuth();
    if (!isAuthConfigured(auth)) {
      return res.status(400).json({
        error: 'El sistema aún no ha sido configurado. Por favor, crea un usuario primero.'
      });
    }

    const { username, password } = req.body || {};
    const trimmedUser = typeof username === 'string' ? username.trim() : '';

    if (!trimmedUser || typeof password !== 'string' || !password) {
      return res.status(400).json({
        error: 'Debes ingresar el nombre de usuario y la contraseña.'
      });
    }

    // Comparar usuario
    if (trimmedUser !== auth.username) {
      return res.status(401).json({
        error: 'Credenciales incorrectas. Verifica tu usuario y contraseña.'
      });
    }

    // Comparar hash con scryptSync y timingSafeEqual
    const computedHash = hashPassword(password, auth.salt);
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(auth.passwordHash, 'hex');

    const isValid =
      computedBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(computedBuffer, storedBuffer);

    if (!isValid) {
      return res.status(401).json({
        error: 'Credenciales incorrectas. Verifica tu usuario y contraseña.'
      });
    }

    return res.json({
      success: true,
      username: auth.username
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
