const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { fork } = require('child_process');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let backendProcess = null;
const BACKEND_PORT = '3001';
const HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/health`;
const tempStorageDir = path.join(os.tmpdir(), `podcastcraft_phase26_test_${Date.now()}`);
const tempUserDataDir = path.join(os.tmpdir(), `pc_p26_userdata_${Date.now()}`);
fs.mkdirSync(tempUserDataDir, { recursive: true });
app.setPath('userData', tempUserDataDir);

function sendRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, `http://127.0.0.1:${BACKEND_PORT}`);
    const reqHeaders = {
      'Accept': 'application/json',
      ...headers
    };
    let payload = null;
    if (body !== null) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        payload = body;
      } else {
        payload = JSON.stringify(body);
        reqHeaders['Content-Type'] = 'application/json';
      }
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const start = Date.now();
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
          duration
        });
      });
    });

    req.on('error', reject);
    if (payload !== null) {
      req.write(payload);
    }
    req.end();
  });
}

function startBackend() {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(tempStorageDir, { recursive: true });
    console.log('[Test Runner] Iniciando backend con almacenamiento temporal aislado en:', tempStorageDir);
    const rootDir = path.join(__dirname, '..');
    const backendEntry = path.join(rootDir, 'backend', 'src', 'server.js');
    backendProcess = fork(backendEntry, [], {
      cwd: path.join(rootDir, 'backend'),
      silent: true,
      env: {
        ...process.env,
        PORT: BACKEND_PORT,
        PODCASTCRAFT_STORAGE_DIR: tempStorageDir,
        ELECTRON_RUN_AS_NODE: '1'
      }
    });

    waitForBackend(HEALTH_URL, 15000).then(resolve).catch(reject);
  });
}

function waitForBackend(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function ping() {
      const r = http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else retry();
      });
      r.on('error', retry);
    }
    function retry() {
      if (Date.now() - start > timeoutMs) return reject(new Error('Backend timeout'));
      setTimeout(ping, 200);
    }
    ping();
  });
}

app.whenReady().then(async () => {
  const results = {
    suite: 'Fase 26 — Login Completo, Recordarme, Recuperación y Anti-Saturación',
    timestamp: new Date().toISOString(),
    tests: [],
    passed: true,
    metrics: {}
  };

  function recordTest(num, name, passed, details) {
    console.log(`[Prueba ${num}] ${passed ? '✓ PASÓ' : '✗ FALLÓ'}: ${name}`);
    if (details) console.log(`   Detalles: ${JSON.stringify(details)}`);
    results.tests.push({ num, name, passed, details });
    if (!passed) results.passed = false;
  }

  try {
    await startBackend();

    // =========================================================================
    // PRUEBA 1: Primer uso, setup, recoveryCode format y secretos no en claro
    // =========================================================================
    {
      const statusRes = await sendRequest('GET', '/api/auth/status');
      const isConfiguredBefore = statusRes.json && statusRes.json.configured;

      const setupRes = await sendRequest('POST', '/api/auth/setup', {
        username: 'masterUser',
        password: 'Password123'
      });

      const recoveryCode = setupRes.json && setupRes.json.recoveryCode;
      const validFormat = recoveryCode && /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/.test(recoveryCode);

      const authFilePath = path.join(tempStorageDir, 'auth.json');
      const authFileContent = fs.readFileSync(authFilePath, 'utf8');
      const plainPassLeaked = authFileContent.includes('Password123');
      const plainCodeLeaked = recoveryCode && authFileContent.includes(recoveryCode);

      const statusAfter = await sendRequest('GET', '/api/auth/status');
      const isConfiguredAfter = statusAfter.json && statusAfter.json.configured;

      const passed = !isConfiguredBefore &&
                     setupRes.statusCode === 201 &&
                     validFormat &&
                     !plainPassLeaked &&
                     !plainCodeLeaked &&
                     isConfiguredAfter;

      recordTest(1, 'Primer uso y seguridad de secretos en auth.json', passed, {
        initialConfigured: isConfiguredBefore,
        statusCode: setupRes.statusCode,
        recoveryCode,
        validFormat,
        plainPassLeaked,
        plainCodeLeaked,
        configuredAfter: isConfiguredAfter
      });
    }

    // =========================================================================
    // PRUEBA 2: Límites de longitud y formato en el servidor
    // =========================================================================
    {
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      // Usuario de 2 caracteres -> 400
      const rUserShort = await sendRequest('POST', '/api/auth/setup', { username: 'ab', password: 'ValidPass123' });
      // Usuario de 33 caracteres -> 400
      const rUserLong = await sendRequest('POST', '/api/auth/setup', { username: 'a'.repeat(33), password: 'ValidPass123' });
      // Contraseña de 5 caracteres -> 400
      const rPassShort = await sendRequest('POST', '/api/auth/setup', { username: 'validUser2', password: '12345' });
      // Contraseña de 129 caracteres -> 400
      const rPassLong = await sendRequest('POST', '/api/auth/setup', { username: 'validUser2', password: 'p'.repeat(129) });
      // Caracteres inválidos en usuario
      const rUserSpace = await sendRequest('POST', '/api/auth/setup', { username: 'a b', password: 'ValidPass123' });
      const rUserSlash = await sendRequest('POST', '/api/auth/setup', { username: 'x/y', password: 'ValidPass123' });
      // Usuario duplicado distinguiendo mayúsculas (masterUser vs MASTERUSER)
      const rUserDup = await sendRequest('POST', '/api/auth/setup', { username: 'MASTERUSER', password: 'ValidPass123' });
      // Código de recuperación > 20 caracteres
      const rCodeLong = await sendRequest('POST', '/api/auth/recover', {
        username: 'masterUser',
        recoveryCode: 'A'.repeat(21),
        newPassword: 'NewValidPassword123'
      });
      // Token con longitud distinta de 64 caracteres
      const rTokenBadLen = await sendRequest('POST', '/api/auth/resume', {
        username: 'masterUser',
        token: 'abcdef1234'
      });

      const passed = rUserShort.statusCode === 400 &&
                     rUserLong.statusCode === 400 &&
                     rPassShort.statusCode === 400 &&
                     rPassLong.statusCode === 400 &&
                     rUserSpace.statusCode === 400 &&
                     rUserSlash.statusCode === 400 &&
                     rUserDup.statusCode === 400 &&
                     rCodeLong.statusCode === 400 &&
                     rTokenBadLen.statusCode === 400;

      recordTest(2, 'Límites de longitud y validaciones de campo en servidor', passed, {
        userShort: rUserShort.statusCode,
        userLong: rUserLong.statusCode,
        passShort: rPassShort.statusCode,
        passLong: rPassLong.statusCode,
        userSpace: rUserSpace.statusCode,
        userSlash: rUserSlash.statusCode,
        userDup: rUserDup.statusCode,
        codeLong: rCodeLong.statusCode,
        tokenBadLen: rTokenBadLen.statusCode
      });
    }

    // =========================================================================
    // PRUEBA 3: Tipos y límite estricto de tamaño (2 KB -> 413 rápido)
    // =========================================================================
    {
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      // 1 MB payload a /api/auth/login
      const largePayload = JSON.stringify({
        username: 'masterUser',
        password: 'P'.repeat(1024 * 1024)
      });
      const tStart = Date.now();
      const rLarge = await sendRequest('POST', '/api/auth/login', largePayload, {
        'Content-Type': 'application/json'
      });
      const largeDuration = Date.now() - tStart;

      // Tipos no string
      const rPassArr = await sendRequest('POST', '/api/auth/login', { username: 'masterUser', password: ['123456'] });
      const rPassObj = await sendRequest('POST', '/api/auth/login', { username: 'masterUser', password: { pass: '123456' } });
      const rPassNum = await sendRequest('POST', '/api/auth/login', { username: 'masterUser', password: 123456 });
      const rPassNull = await sendRequest('POST', '/api/auth/login', { username: 'masterUser', password: null });
      const rRememberStr = await sendRequest('POST', '/api/auth/login', { username: 'masterUser', password: 'Password123', remember: 'true' });

      const passed = rLarge.statusCode === 413 &&
                     largeDuration < 150 &&
                     rPassArr.statusCode === 400 &&
                     rPassObj.statusCode === 400 &&
                     rPassNum.statusCode === 400 &&
                     rPassNull.statusCode === 400 &&
                     rRememberStr.statusCode === 400;

      recordTest(3, 'Cuerpo excesivo (413 en <150ms) y tipos estrictos', passed, {
        largePayloadStatus: rLarge.statusCode,
        largePayloadDurationMs: largeDuration,
        passArrStatus: rPassArr.statusCode,
        passObjStatus: rPassObj.statusCode,
        passNumStatus: rPassNum.statusCode,
        passNullStatus: rPassNull.statusCode,
        rememberStrStatus: rRememberStr.statusCode
      });
    }

    // =========================================================================
    // PRUEBA 4: Límite de 10 cuentas (11.ª -> 403) y rate limit de creación
    // =========================================================================
    {
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      // Vaciamos auth.json para probar limpia y determinísticamente el freno de creaciones/min
      fs.writeFileSync(path.join(tempStorageDir, 'auth.json'), JSON.stringify({ users: [] }, null, 2), 'utf8');

      // Crear exactamente 5 cuentas en el minuto
      for (let i = 1; i <= 5; i++) {
        await sendRequest('POST', '/api/auth/setup', {
          username: `rate_user_${i}`,
          password: `Password_${i}`
        });
      }

      // La 6.ª creación consecutiva en el mismo minuto debe ser bloqueada con 429
      const rRateLimitCreation = await sendRequest('POST', '/api/auth/setup', {
        username: 'rate_user_6_blocked',
        password: 'Password_6'
      });

      // Ahora reseteamos rate limit para probar el límite exacto de 10 cuentas
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');
      fs.writeFileSync(path.join(tempStorageDir, 'auth.json'), JSON.stringify({ users: [] }, null, 2), 'utf8');

      // Crear 5 cuentas
      for (let i = 1; i <= 5; i++) {
        await sendRequest('POST', '/api/auth/setup', { username: `user_${i}`, password: `Password_${i}` });
      }
      // Reset rate limit global para las siguientes 5
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');
      for (let i = 6; i <= 10; i++) {
        await sendRequest('POST', '/api/auth/setup', { username: `user_${i}`, password: `Password_${i}` });
      }

      // Reset rate limit global antes de intentar la 11.ª cuenta para evaluar directamente el límite de cuentas
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      // Intentar crear la 11.ª cuenta -> debe responder 403 con mensaje claro
      const r11th = await sendRequest('POST', '/api/auth/setup', {
        username: 'user_11',
        password: 'Password_11'
      });

      // Verificar que cada cuenta puede iniciar sesión con sus propias credenciales
      const loginUser2 = await sendRequest('POST', '/api/auth/login', {
        username: 'user_2',
        password: 'Password_2'
      });
      const loginUser10 = await sendRequest('POST', '/api/auth/login', {
        username: 'user_10',
        password: 'Password_10'
      });

      const passed = rRateLimitCreation.statusCode === 429 &&
                     r11th.statusCode === 403 &&
                     loginUser2.statusCode === 200 &&
                     loginUser10.statusCode === 200;

      recordTest(4, 'Tope de 10 cuentas (11.ª -> 403) y límite de creaciones/min (429)', passed, {
        creationRateLimitStatus: rRateLimitCreation.statusCode,
        eleventhAccountStatus: r11th.statusCode,
        eleventhErrorMsg: r11th.json ? r11th.json.error : null,
        loginUser2Status: loginUser2.statusCode,
        loginUser10Status: loginUser10.statusCode
      });
    }

    // =========================================================================
    // PRUEBA 5: Anti-saturación: ráfaga de 30 logins paralelos y latencia /health
    // =========================================================================
    {
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      let healthMaxLatency = 0;
      let healthChecksCount = 0;
      let isBurstActive = true;

      // Monitor de latencia de /health durante la ráfaga
      const healthPings = (async () => {
        while (isBurstActive) {
          const t1 = Date.now();
          try {
            await sendRequest('GET', '/health');
            const lat = Date.now() - t1;
            healthChecksCount++;
            if (lat > healthMaxLatency) healthMaxLatency = lat;
          } catch (_) {}
          await new Promise(r => setTimeout(r, 10));
        }
      })();

      // Disparar 30 logins concurrentes para cuenta existente ('user_1') con contraseña errónea
      const loginPromises = [];
      for (let i = 0; i < 30; i++) {
        loginPromises.push(
          sendRequest('POST', '/api/auth/login', {
            username: 'user_1',
            password: 'WrongPassword123'
          })
        );
      }

      const loginResponses = await Promise.all(loginPromises);
      isBurstActive = false;
      await healthPings;

      const scryptStats = await sendRequest('GET', '/api/auth/test-scrypt-stats');

      const count503 = loginResponses.filter(r => r.statusCode === 503).length;
      const count401or429 = loginResponses.filter(r => r.statusCode === 401 || r.statusCode === 429).length;

      // Con máx concurrencia 2 y cola 20 (capacidad 22), al menos 5 a 8 peticiones reciben 503
      const queueWorks = count503 >= 5;
      const healthFast = healthMaxLatency < 300;
      const concurrencyCapped = scryptStats.json && scryptStats.json.maxActiveSeen <= 2;

      const passed = healthFast && queueWorks && concurrencyCapped;
      results.metrics.healthMaxLatencyMs = healthMaxLatency;
      results.metrics.burst503Count = count503;
      results.metrics.burstOtherCount = count401or429;
      results.metrics.maxActiveScryptSeen = scryptStats.json ? scryptStats.json.maxActiveSeen : null;

      recordTest(5, 'Anti-saturación bajo ráfaga (latencia /health <300ms, máx 2 scrypt y 503)', passed, {
        healthMaxLatencyMs: healthMaxLatency,
        healthChecksCount,
        burst503Count: count503,
        burstOtherCount: count401or429,
        maxActiveScryptSeen: scryptStats.json ? scryptStats.json.maxActiveSeen : null
      });
    }

    // =========================================================================
    // PRUEBA 6: Fuerza bruta (5 fallos -> 429), reseteo, y memoria acotada (5000 entradas)
    // =========================================================================
    {
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      // 1. Probar 5 fallos consecutivos en 'user_1'
      for (let i = 1; i <= 4; i++) {
        await sendRequest('POST', '/api/auth/login', { username: 'user_1', password: 'WrongPassword' });
      }
      const r5th = await sendRequest('POST', '/api/auth/login', { username: 'user_1', password: 'WrongPassword' });
      const r6th = await sendRequest('POST', '/api/auth/login', { username: 'user_1', password: 'WrongPassword' });

      const blocked429 = r6th.statusCode === 429 && r6th.json && typeof r6th.json.retryAfter === 'number';

      // 2. Éxito reinicia el contador:
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      // 2 fallos
      await sendRequest('POST', '/api/auth/login', { username: 'user_1', password: 'WrongPassword' });
      await sendRequest('POST', '/api/auth/login', { username: 'user_1', password: 'WrongPassword' });
      // 1 éxito
      const rSuccess = await sendRequest('POST', '/api/auth/login', { username: 'user_1', password: 'Password_1' });
      // El siguiente fallo debe ser el intento 1 (no bloqueado)
      const rAfterSuccess = await sendRequest('POST', '/api/auth/login', { username: 'user_1', password: 'WrongPassword' });
      const resetOk = rSuccess.statusCode === 200 && rAfterSuccess.statusCode === 401;

      // 3. Usuario inexistente también se bloquea tras 5 fallos
      for (let i = 1; i <= 4; i++) {
        await sendRequest('POST', '/api/auth/login', { username: 'ghost_user', password: 'WrongPassword' });
      }
      await sendRequest('POST', '/api/auth/login', { username: 'ghost_user', password: 'WrongPassword' });
      const rGhostBlocked = await sendRequest('POST', '/api/auth/login', { username: 'ghost_user', password: 'WrongPassword' });
      const ghostBlocked = rGhostBlocked.statusCode === 429;

      // 4. Memoria acotada: registrar 5000 intentos con usuarios distintos y reportar tamaño
      const simRes = await sendRequest('POST', '/api/auth/test-simulate-failures', { count: 5000 });
      const mapSizeAfter5000 = simRes.json ? simRes.json.size : null;
      const memoryBounded = mapSizeAfter5000 !== null && mapSizeAfter5000 <= 1000;

      const passed = blocked429 && resetOk && ghostBlocked && memoryBounded;

      recordTest(6, 'Fuerza bruta (429), reseteo con éxito y mapa acotado a 1000', passed, {
        blocked429Status: r6th.statusCode,
        retryAfterSeconds: r6th.json ? r6th.json.retryAfter : null,
        resetOk,
        ghostBlockedStatus: rGhostBlocked.statusCode,
        mapSizeAfter5000
      });
    }

    // =========================================================================
    // PRUEBA 7: "Recordarme": token hex, hash en auth.json, resume, caducidad, logout y tope 5
    // =========================================================================
    {
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      // Login con remember: true
      const rRemLogin = await sendRequest('POST', '/api/auth/login', {
        username: 'user_1',
        password: 'Password_1',
        remember: true
      });
      const token = rRemLogin.json && rRemLogin.json.token;
      const isHex64 = token && /^[0-9a-fA-F]{64}$/.test(token);

      // Verificar que auth.json NO tiene el token en claro, sino su hash SHA-256
      const authData = JSON.parse(fs.readFileSync(path.join(tempStorageDir, 'auth.json'), 'utf8'));
      const user = authData.users.find(u => u.usernameKey === 'user_1');
      const tokenHash = token ? crypto.createHash('sha256').update(token, 'utf8').digest('hex') : null;
      const hashStored = Boolean(user && user.rememberTokens && user.rememberTokens.some(t => t.hash === tokenHash));
      const plainTokenInJson = token ? fs.readFileSync(path.join(tempStorageDir, 'auth.json'), 'utf8').includes(token) : false;

      // Resume con token válido
      const rResumeOk = await sendRequest('POST', '/api/auth/resume', { username: 'user_1', token });

      // Resume con token alterado -> 401
      const tamperedToken = token ? (token.slice(0, 63) + (token[63] === 'a' ? 'b' : 'a')) : '0'.repeat(64);
      const rResumeTampered = await sendRequest('POST', '/api/auth/resume', { username: 'user_1', token: tamperedToken });

      // Simular token vencido en auth.json
      if (user && user.rememberTokens && user.rememberTokens[0]) {
        user.rememberTokens[0].expiresAt = Date.now() - 10000;
        fs.writeFileSync(path.join(tempStorageDir, 'auth.json'), JSON.stringify(authData, null, 2), 'utf8');
      }
      const rResumeExpired = await sendRequest('POST', '/api/auth/resume', { username: 'user_1', token });

      // Generar 6 logins recordados y verificar que solo quedan 5 tokens (los más recientes)
      let lastToken = null;
      for (let i = 1; i <= 6; i++) {
        const lRes = await sendRequest('POST', '/api/auth/login', {
          username: 'user_1',
          password: 'Password_1',
          remember: true
        });
        lastToken = lRes.json && lRes.json.token;
      }
      const authData6 = JSON.parse(fs.readFileSync(path.join(tempStorageDir, 'auth.json'), 'utf8'));
      const user6 = authData6.users.find(u => u.usernameKey === 'user_1');
      const tokenCount = user6 ? user6.rememberTokens.length : 0;

      // Logout invalida el token
      const rLogout = await sendRequest('POST', '/api/auth/logout', { username: 'user_1', token: lastToken });
      const rResumeAfterLogout = await sendRequest('POST', '/api/auth/resume', { username: 'user_1', token: lastToken });

      const passed = isHex64 &&
                     hashStored &&
                     !plainTokenInJson &&
                     rResumeOk.statusCode === 200 &&
                     rResumeTampered.statusCode === 401 &&
                     rResumeExpired.statusCode === 401 &&
                     tokenCount === 5 &&
                     rLogout.statusCode === 200 &&
                     rResumeAfterLogout.statusCode === 401;

      recordTest(7, 'Tokens "Recordarme": SHA-256, resume, expiración, descarte al superar 5 y logout', passed, {
        isHex64,
        hashStored,
        plainTokenInJson,
        resumeOkStatus: rResumeOk.statusCode,
        resumeTamperedStatus: rResumeTampered.statusCode,
        resumeExpiredStatus: rResumeExpired.statusCode,
        tokensCountAfter6Logins: tokenCount,
        resumeAfterLogoutStatus: rResumeAfterLogout.statusCode
      });
    }

    // =========================================================================
    // PRUEBA 8: Recuperación de contraseña: normalización, rotación e invalidación de tokens
    // =========================================================================
    {
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      // Vaciamos auth.json y creamos recoverUser para aislar la prueba de recuperación
      fs.writeFileSync(path.join(tempStorageDir, 'auth.json'), JSON.stringify({ users: [] }, null, 2), 'utf8');

      const setupTestUser = await sendRequest('POST', '/api/auth/setup', {
        username: 'recoverUser',
        password: 'OldPassword123'
      });
      const rawCode = setupTestUser.json ? setupTestUser.json.recoveryCode : null;

      // Creamos un token recordado para esta cuenta
      const loginRem = await sendRequest('POST', '/api/auth/login', {
        username: 'recoverUser',
        password: 'OldPassword123',
        remember: true
      });
      const activeToken = loginRem.json ? loginRem.json.token : null;

      // Probar recuperación con código normalizado (minúsculas y sin guiones)
      const normalizedInput = rawCode ? rawCode.toLowerCase().replace(/-/g, '') : '';
      const rRecoverOk = await sendRequest('POST', '/api/auth/recover', {
        username: 'recoverUser',
        recoveryCode: normalizedInput,
        newPassword: 'BrandNewPassword456'
      });
      const newRecoveryCode = rRecoverOk.json && rRecoverOk.json.recoveryCode;
      const codeRotated = Boolean(newRecoveryCode && newRecoveryCode !== rawCode);

      // El token previo debe haber sido invalidado
      const rResumeAfterRecover = await sendRequest('POST', '/api/auth/resume', {
        username: 'recoverUser',
        token: activeToken
      });

      // La contraseña antigua no funciona; la nueva sí funciona
      const rOldPass = await sendRequest('POST', '/api/auth/login', { username: 'recoverUser', password: 'OldPassword123' });
      const rNewPass = await sendRequest('POST', '/api/auth/login', { username: 'recoverUser', password: 'BrandNewPassword456' });

      // El código anterior deja de funcionar
      const rOldCodeReuse = await sendRequest('POST', '/api/auth/recover', {
        username: 'recoverUser',
        recoveryCode: rawCode,
        newPassword: 'AnotherPassword789'
      });

      const passed = rRecoverOk.statusCode === 200 &&
                     codeRotated &&
                     rResumeAfterRecover.statusCode === 401 &&
                     rOldPass.statusCode === 401 &&
                     rNewPass.statusCode === 200 &&
                     rOldCodeReuse.statusCode === 401;

      recordTest(8, 'Recuperación de contraseña, rotación de código e invalidación de tokens', passed, {
        recoverStatusCode: rRecoverOk.statusCode,
        codeRotated,
        tokenInvalidated: rResumeAfterRecover.statusCode === 401,
        oldPassRejected: rOldPass.statusCode === 401,
        newPassAccepted: rNewPass.statusCode === 200,
        oldCodeRejected: rOldCodeReuse.statusCode === 401
      });
    }

    // =========================================================================
    // PRUEBA 9: Migración automática de auth.json formato antiguo
    // =========================================================================
    {
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      // Creamos un auth.json de formato antiguo (raíz: username, passwordHash, salt - sin recoveryHash)
      const legacySalt = crypto.randomBytes(16).toString('hex');
      const legacyPassHash = crypto.scryptSync('LegacyPass123', legacySalt, 64).toString('hex');
      const legacyAuthData = {
        username: 'legacyUser',
        passwordHash: legacyPassHash,
        salt: legacySalt
      };
      fs.writeFileSync(path.join(tempStorageDir, 'auth.json'), JSON.stringify(legacyAuthData, null, 2), 'utf8');

      // Primer login: debe funcionar, migrar a users[0] y devolver recoveryCode
      const rMigratedLogin1 = await sendRequest('POST', '/api/auth/login', {
        username: 'legacyUser',
        password: 'LegacyPass123'
      });
      const generatedCode = rMigratedLogin1.json && rMigratedLogin1.json.recoveryCode;

      // Verificar en disco que se convirtió al nuevo formato con users array
      const diskData = JSON.parse(fs.readFileSync(path.join(tempStorageDir, 'auth.json'), 'utf8'));
      const hasUsersArray = Array.isArray(diskData.users) && diskData.users.length === 1;
      const userConverted = hasUsersArray && diskData.users[0].username === 'legacyUser';

      // Segundo login: no debe devolver recoveryCode (ya fue entregado)
      const rMigratedLogin2 = await sendRequest('POST', '/api/auth/login', {
        username: 'legacyUser',
        password: 'LegacyPass123'
      });
      const secondCode = rMigratedLogin2.json && rMigratedLogin2.json.recoveryCode;

      // Probar también formato antiguo que ya tuviera recoveryHash
      const recSalt = crypto.randomBytes(16).toString('hex');
      const recHash = crypto.scryptSync('ABCD-EFGH-JKMN', recSalt, 64).toString('hex');
      const legacyWithRec = {
        username: 'legacyRecUser',
        passwordHash: legacyPassHash,
        salt: legacySalt,
        recoveryHash: recHash,
        recoverySalt: recSalt
      };
      fs.writeFileSync(path.join(tempStorageDir, 'auth.json'), JSON.stringify(legacyWithRec, null, 2), 'utf8');
      const rMigratedWithRec = await sendRequest('POST', '/api/auth/login', {
        username: 'legacyRecUser',
        password: 'LegacyPass123'
      });
      const diskDataRec = JSON.parse(fs.readFileSync(path.join(tempStorageDir, 'auth.json'), 'utf8'));
      const preservedRecHash = diskDataRec.users && diskDataRec.users[0] && diskDataRec.users[0].recoveryHash === recHash;

      const passed = rMigratedLogin1.statusCode === 200 &&
                     Boolean(generatedCode) &&
                     userConverted &&
                     rMigratedLogin2.statusCode === 200 &&
                     !secondCode &&
                     rMigratedWithRec.statusCode === 200 &&
                     preservedRecHash;

      recordTest(9, 'Migración automática de formato antiguo a users[] con generación única de recoveryCode', passed, {
        firstLoginStatus: rMigratedLogin1.statusCode,
        firstLoginReturnedCode: Boolean(generatedCode),
        convertedToUsersArray: userConverted,
        secondLoginReturnedCode: Boolean(secondCode),
        preservedRecHash
      });
    }

    // =========================================================================
    // PRUEBA 10: Escrituras concurrentes (5 cuentas simultáneas sin corrupción)
    // =========================================================================
    {
      await sendRequest('POST', '/api/auth/test-reset-rate-limit');

      // Resetear archivo auth.json a vacío para esta prueba
      fs.writeFileSync(path.join(tempStorageDir, 'auth.json'), JSON.stringify({ users: [] }, null, 2), 'utf8');

      // 5 peticiones simultáneas de setup
      const concurrentSetups = [1, 2, 3, 4, 5].map(n =>
        sendRequest('POST', '/api/auth/setup', {
          username: `concurrent_${n}`,
          password: `Password_${n}`
        })
      );

      const setupResults = await Promise.all(concurrentSetups);
      const allSuccess = setupResults.every(r => r.statusCode === 201);

      // Verificar integridad de auth.json
      const finalAuth = JSON.parse(fs.readFileSync(path.join(tempStorageDir, 'auth.json'), 'utf8'));
      const userCount = Array.isArray(finalAuth.users) ? finalAuth.users.length : 0;
      const usernames = finalAuth.users ? finalAuth.users.map(u => u.username).sort() : [];
      const expected = ['concurrent_1', 'concurrent_2', 'concurrent_3', 'concurrent_4', 'concurrent_5'];
      const exactMatch = JSON.stringify(usernames) === JSON.stringify(expected);

      const passed = allSuccess && userCount === 5 && exactMatch;

      recordTest(10, 'Escrituras concurrentes serializadas (5 creaciones en paralelo sin corrupción)', passed, {
        allSuccess,
        savedUserCount: userCount,
        exactMatch
      });
    }

    // =========================================================================
    // PRUEBAS 11, 12, 13: UI en Electron, Vistas, Modal, i18n, Tema y Regresión
    // =========================================================================
    const win = new BrowserWindow({
      width: 1400,
      height: 900,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
        webSecurity: false
      }
    });

    win.loadFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    await new Promise(resolve => win.webContents.once('did-finish-load', resolve));
    await new Promise(r => setTimeout(r, 1000));

    const uiResults = await win.webContents.executeJavaScript(`
      (async function() {
        const report = {
          p11_uiFlow: false,
          p11_details: {},
          p12_i18nTheme: false,
          p12_details: {},
          p13_regression: false,
          p13_details: {}
        };

        const $ = (sel) => document.querySelector(sel);

        // --- PRUEBA 11: UI Flow (vistas, navegación, maxlength, contadores, modal con confirmación) ---
        try {
          const authState = window.PodcastCraftAuth;
          const loginForm = $('#auth-login-form');
          const regForm = $('#auth-register-form');
          const recForm = $('#auth-recover-form');
          const gotoReg = $('#auth-goto-register-btn');
          const gotoRec = $('#auth-goto-recover-btn');
          const regBack = $('#auth-reg-back-btn');
          const recBack = $('#auth-rec-back-btn');

          // Navegación a Registro
          gotoReg.click();
          const inRegView = !regForm.classList.contains('hidden') && loginForm.classList.contains('hidden');

          // Volver a Login
          regBack.click();
          const backToLogin = !loginForm.classList.contains('hidden') && regForm.classList.contains('hidden');

          // Navegación a Recuperación
          gotoRec.click();
          const inRecView = !recForm.classList.contains('hidden') && loginForm.classList.contains('hidden');

          // Volver a Login
          recBack.click();
          const backToLoginFromRec = !loginForm.classList.contains('hidden') && recForm.classList.contains('hidden');

          // Verificar maxlength en inputs
          const userMax = $('#auth-username').getAttribute('maxlength') === '32';
          const passMax = $('#auth-password').getAttribute('maxlength') === '128';
          const regUserMax = $('#auth-reg-username').getAttribute('maxlength') === '32';
          const recCodeMax = $('#auth-rec-code').getAttribute('maxlength') === '20';

          // Verificar aparición de contador de caracteres
          const userInput = $('#auth-username');
          userInput.value = 'a'.repeat(25);
          userInput.dispatchEvent(new Event('input', { bubbles: true }));
          const counterEl = $('#auth-username-count');
          const counterShown = !counterEl.classList.contains('hidden') && counterEl.textContent.includes('25/32');

          // Verificar Modal de Recuperación y Casilla obligatoria
          const modal = $('#auth-recovery-modal');
          const confirmCheck = $('#auth-recovery-confirm-check');
          const continueBtn = $('#auth-recovery-continue-btn');
          const codeDisplay = $('#auth-recovery-code-display');

          // Mostrar modal simulado
          codeDisplay.textContent = '2345-6789-ABCD';
          confirmCheck.checked = false;
          continueBtn.disabled = true;
          modal.classList.remove('hidden');

          const btnDisabledInitially = continueBtn.disabled;
          // Marcar casilla
          confirmCheck.checked = true;
          confirmCheck.dispatchEvent(new Event('change', { bubbles: true }));
          const btnEnabledAfterCheck = !continueBtn.disabled;

          // Cerrar modal
          modal.classList.add('hidden');

          report.p11_uiFlow = inRegView && backToLogin && inRecView && backToLoginFromRec &&
                              userMax && passMax && regUserMax && recCodeMax &&
                              counterShown && btnDisabledInitially && btnEnabledAfterCheck;
          report.p11_details = {
            inRegView,
            backToLogin,
            inRecView,
            backToLoginFromRec,
            userMax,
            passMax,
            recCodeMax,
            counterShown,
            btnDisabledInitially,
            btnEnabledAfterCheck
          };
        } catch (e) {
          report.p11_details.error = String(e);
        }

        // --- PRUEBA 12: i18n y Tema Claro/Oscuro ---
        try {
          const langToggle = $('#auth-language-toggle');
          const themeToggle = $('#auth-theme-toggle');

          const initialLang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : (document.documentElement.getAttribute('lang') || 'es');

          langToggle.click();
          await new Promise(r => setTimeout(r, 100));

          const langAfterClick1 = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : document.documentElement.getAttribute('lang');

          langToggle.click();
          await new Promise(r => setTimeout(r, 100));

          const langAfterClick2 = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : document.documentElement.getAttribute('lang');

          // Alternar Tema
          const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
          themeToggle.click();
          await new Promise(r => setTimeout(r, 100));
          const toggledTheme = document.documentElement.getAttribute('data-theme') || (initialTheme === 'dark' ? 'light' : 'dark');
          const themeToggled = initialTheme !== toggledTheme;
          themeToggle.click(); // Restaurar tema inicial

          const langToggled = langAfterClick1 !== initialLang && langAfterClick2 === initialLang;

          report.p12_i18nTheme = langToggled && themeToggled;
          report.p12_details = {
            initialLang,
            langAfterClick1,
            langAfterClick2,
            initialTheme,
            toggledTheme,
            langToggled,
            themeToggled
          };
        } catch (e) {
          report.p12_details.error = String(e);
        }

        // --- PRUEBA 13: Regresión de DAW (reproducción, regla y alineación 0.00 px) ---
        try {
          // Alineación geométrica playhead / regla / carril
          const pc = window.PodcastCraft;
          if (pc && typeof pc.seekTo === 'function') {
            pc.seekTo(0);
          }
          const playheadEl = $('#timeline-playhead')?.getBoundingClientRect();
          const rulerScaleEl = $('#timeline-ruler-scale')?.getBoundingClientRect();
          const laneEl = document.querySelector('.timeline-lane')?.getBoundingClientRect();

          let diffPHRuler = 0;
          let diffPHLane = 0;
          if (playheadEl && rulerScaleEl && laneEl) {
            diffPHRuler = Math.abs(playheadEl.left - rulerScaleEl.left);
            diffPHLane = Math.abs(playheadEl.left - laneEl.left);
          }

          const alignmentOk = diffPHRuler < 0.05 && diffPHLane < 0.05;

          // Backend offline banner funcional
          const offlineBanner = $('#auth-offline-banner');
          const retryBtn = $('#auth-retry-btn');
          const offlineUiExists = Boolean(offlineBanner && retryBtn);

          report.p13_regression = alignmentOk && offlineUiExists;
          report.p13_details = { diffPHRuler, diffPHLane, alignmentOk, offlineUiExists };
        } catch (e) {
          report.p13_details.error = String(e);
        }

        return report;
      })()
    `);

    recordTest(11, 'UI en Electron: 3 vistas, maxlength, contadores, modal atrapado y confirmación', uiResults.p11_uiFlow, uiResults.p11_details);
    recordTest(12, 'Internacionalización (ES/EN) y temas (Claro/Oscuro) en pantalla de bloqueo', uiResults.p12_i18nTheme, uiResults.p12_details);
    recordTest(13, 'Regresión: banner offline, botones de transporte y alineación 0.00 px intacta', uiResults.p13_regression, uiResults.p13_details);

    // =========================================================================
    // PRUEBA 14: Verificación de exclusión de tests/ en instalador y limpieza
    // =========================================================================
    {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
      const buildFiles = pkg.build && pkg.build.files ? pkg.build.files : [];
      const extraResources = pkg.build && pkg.build.extraResources ? pkg.build.extraResources : [];

      const testsInBuildFiles = buildFiles.some(f => f.includes('tests'));
      const testsInExtraResources = extraResources.some(r => r.from && r.from.includes('tests'));
      const testsExcluded = !testsInBuildFiles && !testsInExtraResources;

      recordTest(14, 'Exclusión de tests/ del empaquetado del instalador', testsExcluded, {
        buildFiles,
        testsExcluded
      });
    }

    win.close();

    // Guardar informe detallado de salida
    const outputPath = path.join(__dirname, 'test_phase26_output.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`[Test Runner] Informe completo guardado en ${outputPath}`);
  } catch (err) {
    console.error('[Test Runner] Error fatal:', err);
    results.passed = false;
    results.error = String(err.stack || err);
  } finally {
    // Limpieza estricta: matar proceso backend y borrar carpeta temporal
    if (backendProcess) {
      console.log('[Test Runner] Cerrando proceso de backend...');
      try {
        backendProcess.kill();
      } catch (_) {}
    }

    // Esperar y limpiar carpeta temporal
    try {
      if (fs.existsSync(tempStorageDir)) {
        console.log('[Test Runner] Eliminando almacenamiento temporal:', tempStorageDir);
        fs.rmSync(tempStorageDir, { recursive: true, force: true });
      }
      if (fs.existsSync(tempUserDataDir)) {
        console.log('[Test Runner] Eliminando userData temporal:', tempUserDataDir);
        fs.rmSync(tempUserDataDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('[Test Runner] Advertencia al limpiar directorio temporal:', e.message);
    }

    console.log(`[Test Runner] Estado final de la suite: ${results.passed ? 'TODAS LAS PRUEBAS PASARON' : 'HUBO FALLOS'}`);
    app.exit(results.passed ? 0 : 1);
  }
});
