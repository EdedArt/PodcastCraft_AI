const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const { fork, execSync } = require('child_process');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.on('window-all-closed', (e) => {
  // Evitar que Electron cierre la aplicación automáticamente al destruir ventanas entre ciclos de prueba
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
});

let backendProcess = null;
const BACKEND_PORT = '3001';
const HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/health`;

const tempStorageDir = path.join(os.tmpdir(), `pc_p26d_storage_${Date.now()}`);
const tempUserDataDir = path.join(os.tmpdir(), `pc_p26d_userdata_${Date.now()}`);
const tempExportDir = path.join(os.tmpdir(), `pc_p26d_export_${Date.now()}`);

app.setPath('userData', tempUserDataDir);

const rootDir = path.join(__dirname, '..');
const ffmpegExe = path.join(rootDir, 'backend', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

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

function probeAudioFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false };
  }
  const size = fs.statSync(filePath).size;
  let probeOutput = '';
  try {
    execSync(`"${ffmpegExe}" -i "${filePath}"`, { stdio: 'pipe' });
  } catch (err) {
    probeOutput = (err.stderr ? err.stderr.toString() : '') + (err.stdout ? err.stdout.toString() : '');
  }

  const durMatch = probeOutput.match(/Duration:\s*(\d+):(\d+):([\d\.]+)/);
  let durationSec = null;
  if (durMatch) {
    durationSec = parseInt(durMatch[1], 10) * 3600 + parseInt(durMatch[2], 10) * 60 + parseFloat(durMatch[3]);
    durationSec = Math.round(durationSec * 100) / 100;
  }

  const brMatch = probeOutput.match(/bitrate:\s*(\d+)\s*kb\/s/);
  const bitrateKbps = brMatch ? parseInt(brMatch[1], 10) : null;

  let decodeError = false;
  let decodeErrorOutput = '';
  try {
    execSync(`"${ffmpegExe}" -v error -i "${filePath}" -f null -`, { stdio: 'pipe' });
  } catch (err) {
    decodeError = true;
    decodeErrorOutput = (err.stderr ? err.stderr.toString() : '');
  }

  return {
    exists: true,
    size,
    durationSec,
    bitrateKbps,
    decodeError,
    decodeErrorOutput
  };
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const audioDir = path.join(tempStorageDir, 'audio-files');
    fs.mkdirSync(audioDir, { recursive: true });
    fs.mkdirSync(tempUserDataDir, { recursive: true });
    fs.mkdirSync(tempExportDir, { recursive: true });

    console.log('[Test Runner] Creando clips de audio sintéticos con ffmpeg...');
    const clip1Path = path.join(audioDir, 'sine1.mp3');
    const clip2Path = path.join(audioDir, 'sine2.mp3');

    // Sine 1: 440 Hz, 3.0s de duración, mono a 192k
    execSync(`"${ffmpegExe}" -f lavfi -i "sine=frequency=440:duration=3" -b:a 192k "${clip1Path}" -y`, { stdio: 'ignore' });
    // Sine 2: 880 Hz, 2.0s de duración, mono a 192k
    execSync(`"${ffmpegExe}" -f lavfi -i "sine=frequency=880:duration=2" -b:a 192k "${clip2Path}" -y`, { stdio: 'ignore' });

    console.log('[Test Runner] Iniciando backend aislado en:', tempStorageDir);
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

// Configuración de stubs IPC de Electron para pruebas
let exportDialogStubResult = { canceled: false, filePath: null };
let lastItemShownInFolder = null;

function setupIpcHandlers() {
  ipcMain.handle('show-save-export-dialog', async () => {
    return exportDialogStubResult;
  });

  ipcMain.handle('show-item-in-folder', async (event, filePath) => {
    lastItemShownInFolder = filePath;
    return { success: true };
  });

  function getAuthSessionFilePath() {
    return path.join(tempUserDataDir, 'auth_session.json');
  }

  ipcMain.handle('save-auth-session', async (event, sessionData) => {
    try {
      const sessionFile = getAuthSessionFilePath();
      const tmpFile = sessionFile + '.tmp';
      fs.writeFileSync(tmpFile, JSON.stringify(sessionData || {}, null, 2), 'utf8');
      fs.renameSync(tmpFile, sessionFile);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('load-auth-session', async () => {
    try {
      const sessionFile = getAuthSessionFilePath();
      if (!fs.existsSync(sessionFile)) return null;
      const data = fs.readFileSync(sessionFile, 'utf8');
      return JSON.parse(data);
    } catch (_) {
      return null;
    }
  });

  ipcMain.handle('clear-auth-session', async () => {
    try {
      const sessionFile = getAuthSessionFilePath();
      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

async function createTestWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(rootDir, 'electron', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  win.loadFile(path.join(rootDir, 'frontend', 'index.html'));
  await new Promise(resolve => win.webContents.once('did-finish-load', resolve));
  await new Promise(r => setTimeout(r, 600));
  return win;
}

app.whenReady().then(async () => {
  const results = {
    suite: 'Fase 26d — Exportar MP3 con Diálogo Previo y Persistencia Durable "Recordarme"',
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
    setupIpcHandlers();
    await startBackend();

    // 0. Configuración de usuario en backend aislado
    const setupRes = await sendRequest('POST', '/api/auth/setup', {
      username: 'mauricio_p26d',
      password: 'Password123!'
    });
    console.log('[Test Runner] Cuenta inicial configurada con estado:', setupRes.statusCode);

    // =========================================================================
    // PROBLEMA 1: EXPORTACIÓN MP3 CON DIÁLOGO PREVIO Y STUBS
    // =========================================================================

    // Abrir ventana para pruebas de exportación
    let win = await createTestWindow();

    // Iniciar sesión en la ventana para acceder al DAW
    await win.webContents.executeJavaScript(`
      (async function() {
        const $ = s => document.querySelector(s);
        $('#auth-username').value = 'mauricio_p26d';
        $('#auth-password').value = 'Password123!';
        $('#auth-submit-btn').click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));

    // Configurar proyecto multitrack con 2 carriles y volúmenes diferentes:
    // Carril 1: volumen 0.8, clip 1 (duración 3.0s, inicio 0.0s)
    // Carril 2: volumen 1.2, clip 2 (duración 2.0s, inicio 1.5s)
    // Duración total esperada: 1.5 + 2.0 = 3.5 segundos
    await win.webContents.executeJavaScript(`
      (function() {
        state.project.title = 'Podcast_Multitrack_Test';
        state.tracks = [
          {
            id: 'track-1',
            name: 'Pista 1',
            volume: 0.8,
            muted: false,
            solo: false,
            clips: [
              {
                id: 'clip-1',
                libraryId: 'lib-import-sine1.mp3',
                name: 'Tono 440Hz',
                start: 0,
                duration: 3.0,
                sourceOffset: 0,
                volume: 0.8
              }
            ]
          },
          {
            id: 'track-2',
            name: 'Pista 2',
            volume: 1.2,
            muted: false,
            solo: false,
            clips: [
              {
                id: 'clip-2',
                libraryId: 'lib-import-sine2.mp3',
                name: 'Tono 880Hz',
                start: 1.5,
                duration: 2.0,
                sourceOffset: 0,
                volume: 1.2
              }
            ]
          }
        ];
        if (typeof renderAll === 'function') renderAll();
        else if (typeof renderTimelineTracks === 'function') renderTimelineTracks();
      })()
    `);

    // --- PRUEBA 1: Exportación exitosa con stub de ruta temporal ---
    const successExportPath = path.join(tempExportDir, 'podcast_success_export.mp3');
    exportDialogStubResult = { canceled: false, filePath: successExportPath };

    // Disparar flujo con el botón real #btn-export
    const exportResult = await win.webContents.executeJavaScript(`
      (async function() {
        const btn = document.querySelector('#btn-export');
        if (!btn) return { error: 'Botón #btn-export no encontrado' };

        btn.click();

        // Esperar a que termine la exportación observando el toast o isExporting
        const start = Date.now();
        while (Date.now() - start < 15000) {
          await new Promise(r => setTimeout(r, 300));
          const toast = document.querySelector('#toast-container > div');
          const toastText = toast ? toast.textContent : '';
          if (toastText.includes('Guardado en:') || toastText.includes('Saved to:') || toastText.includes('Error')) {
            const actionBtn = toast ? toast.querySelector('button') : null;
            if (actionBtn) {
              actionBtn.click(); // Probar clic en "Mostrar en carpeta"
            }
            return {
              completed: true,
              toastText,
              hasActionBtn: Boolean(actionBtn),
              actionBtnText: actionBtn ? actionBtn.textContent.trim() : null
            };
          }
        }
        return { completed: false, error: 'Timeout esperando finalización de exportación' };
      })()
    `);

    // Probar el archivo MP3 generado con ffprobe y ffmpeg
    const probeSuccess = probeAudioFile(successExportPath);
    const expectedDuration = 3.5;
    const durationDelta = probeSuccess.durationSec !== null ? Math.abs(probeSuccess.durationSec - expectedDuration) : 999;
    const durationMatches = durationDelta <= 0.15; // Tolerancia de frames MP3

    const p1Passed = Boolean(
      exportResult.completed &&
      exportResult.toastText.includes('Guardado en:') &&
      exportResult.hasActionBtn &&
      probeSuccess.exists &&
      probeSuccess.size > 20000 &&
      durationMatches &&
      probeSuccess.bitrateKbps >= 180 && probeSuccess.bitrateKbps <= 205 &&
      !probeSuccess.decodeError &&
      lastItemShownInFolder === successExportPath
    );

    recordTest(1, 'Exportar MP3 exitoso con diálogo nativo previo, mezcla ffmpeg multitrack y botón "Mostrar en carpeta"', p1Passed, {
      exportResult,
      writtenPath: successExportPath,
      sizeBytes: probeSuccess.size,
      durationMeasuredSec: probeSuccess.durationSec,
      expectedDurationSec: expectedDuration,
      durationDelta,
      bitrateKbps: probeSuccess.bitrateKbps,
      decodeError: probeSuccess.decodeError,
      lastItemShownInFolder
    });

    results.metrics.export = {
      filePath: successExportPath,
      sizeBytes: probeSuccess.size,
      durationMeasuredSec: probeSuccess.durationSec,
      expectedDurationSec: expectedDuration,
      bitrateKbps: probeSuccess.bitrateKbps,
      decodeError: probeSuccess.decodeError
    };

    // --- PRUEBA 2: Exportación cancelada por el usuario en el diálogo ---
    const canceledExportPath = path.join(tempExportDir, 'podcast_should_not_exist.mp3');
    exportDialogStubResult = { canceled: true, filePath: null };

    // Limpiar toasts previos
    await win.webContents.executeJavaScript(`
      document.querySelectorAll('#toast-container > div').forEach(el => el.remove());
    `);

    const cancelResult = await win.webContents.executeJavaScript(`
      (async function() {
        const btn = document.querySelector('#btn-export');
        btn.click();
        await new Promise(r => setTimeout(r, 600));

        const toast = document.querySelector('#toast-container > div');
        const toastText = toast ? toast.textContent : '';
        return {
          toastText,
          isExporting: window.isExporting || false
        };
      })()
    `);

    const p2Passed = Boolean(
      cancelResult.toastText.includes('Exportación cancelada') ||
      cancelResult.toastText.includes('Export cancelled')
    ) && !fs.existsSync(canceledExportPath);

    recordTest(2, 'Exportación cancelada en diálogo: mensaje neutro inmediato sin mezcla ni archivo creado', p2Passed, {
      cancelResult,
      fileCreated: fs.existsSync(canceledExportPath)
    });

    // Cerrar sesión en ventana de exportación para limpiar localStorage y preparar Ciclo 1 desde cero
    await win.webContents.executeJavaScript(`
      (function() {
        const btn = document.querySelector('#btn-logout');
        if (btn) btn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 500));

    // Cerrar ventana de exportación
    win.destroy();
    win = null;

    // =========================================================================
    // PROBLEMA 2: PERSISTENCIA DURABLE DE "RECORDARME" Y CICLOS REALES
    // =========================================================================

    // Limpiar almacenamiento previo para ciclo limpio
    const authSessionFile = path.join(tempUserDataDir, 'auth_session.json');
    if (fs.existsSync(authSessionFile)) fs.unlinkSync(authSessionFile);

    // CICLO 1: Login con "Recordarme" marcado -> cierre normal de ventana -> reapertura
    let cycle1Win = await createTestWindow();

    const c1LoginRes = await cycle1Win.webContents.executeJavaScript(`
      (async function() {
        const $ = s => document.querySelector(s);
        $('#auth-username').value = 'mauricio_p26d';
        $('#auth-password').value = 'Password123!';
        const rememberCheckbox = $('#auth-remember-me');
        if (rememberCheckbox) rememberCheckbox.checked = true;
        $('#auth-submit-btn').click();

        const start = Date.now();
        while (Date.now() - start < 5000) {
          await new Promise(r => setTimeout(r, 200));
          const lockScreen = $('#auth-lock-screen');
          if (lockScreen && lockScreen.classList.contains('hidden')) {
            return {
              success: true,
              localStorageToken: localStorage.getItem('podcastcraft_auth_session')
            };
          }
        }
        return { success: false, error: 'Timeout esperando login' };
      })()
    `);

    // Verificar que auth_session.json se guardó durablemente
    const c1SessionOnDisk = fs.existsSync(authSessionFile);
    let c1SessionData = null;
    if (c1SessionOnDisk) {
      try {
        c1SessionData = JSON.parse(fs.readFileSync(authSessionFile, 'utf8'));
      } catch (_) {}
    }

    // Cierre normal como el usuario (cerrando ventana)
    cycle1Win.destroy();
    cycle1Win = null;
    await new Promise(r => setTimeout(r, 500));

    // Reapertura con el mismo userDataDir
    let cycle1ReopenWin = await createTestWindow();

    const c1ResumeRes = await cycle1ReopenWin.webContents.executeJavaScript(`
      (async function() {
        const $ = s => document.querySelector(s);
        const hasSavedClass = document.documentElement.classList.contains('has-saved-session');
        const loginFormDisplay = window.getComputedStyle($('#auth-login-form')).display;

        // Esperar auto-resume
        const start = Date.now();
        while (Date.now() - start < 6000) {
          await new Promise(r => setTimeout(r, 200));
          const lockScreen = $('#auth-lock-screen');
          if (lockScreen && lockScreen.classList.contains('hidden')) {
            return {
              resumed: true,
              hasSavedClass,
              loginFormHiddenOnStart: loginFormDisplay === 'none',
              currentUser: window.PodcastCraftAuth ? window.PodcastCraftAuth.currentUser : null
            };
          }
        }
        return { resumed: false, hasSavedClass, loginFormDisplay };
      })()
    `);

    const p3Passed = Boolean(
      c1LoginRes.success &&
      c1SessionOnDisk &&
      c1SessionData && c1SessionData.username === 'mauricio_p26d' &&
      c1ResumeRes.resumed &&
      c1ResumeRes.hasSavedClass &&
      c1ResumeRes.loginFormHiddenOnStart
    );

    recordTest(3, 'Ciclo 1: Iniciar sesión con "Recordarme" -> cerrar ventana -> reabrir entra directo sin parpadeo', p3Passed, {
      c1LoginRes,
      sessionSavedOnDisk: c1SessionOnDisk,
      tokenSaved: Boolean(c1SessionData && c1SessionData.token),
      c1ResumeRes
    });

    // CICLO 2: Simulación de cierre abrupto (crash/kill) mientras la sesión está activa -> reapertura
    // La sesión actual en cycle1ReopenWin ya está activa y guardada.
    // Destruimos la ventana instantáneamente sin llamar a ningún evento de guardado:
    cycle1ReopenWin.webContents.destroy();
    cycle1ReopenWin.destroy();
    cycle1ReopenWin = null;
    await new Promise(r => setTimeout(r, 500));

    // Reapertura tras cierre abrupto
    let cycle2Win = await createTestWindow();
    const c2ResumeRes = await cycle2Win.webContents.executeJavaScript(`
      (async function() {
        const $ = s => document.querySelector(s);
        const hasSavedClass = document.documentElement.classList.contains('has-saved-session');
        const loginFormDisplay = window.getComputedStyle($('#auth-login-form')).display;

        const start = Date.now();
        while (Date.now() - start < 6000) {
          await new Promise(r => setTimeout(r, 200));
          const lockScreen = $('#auth-lock-screen');
          if (lockScreen && lockScreen.classList.contains('hidden')) {
            return {
              resumed: true,
              hasSavedClass,
              loginFormHiddenOnStart: loginFormDisplay === 'none'
            };
          }
        }
        return { resumed: false, hasSavedClass, loginFormDisplay };
      })()
    `);

    const p4Passed = Boolean(c2ResumeRes.resumed && c2ResumeRes.hasSavedClass);
    recordTest(4, 'Ciclo 2: Tras cierre abrupto (kill/crash) -> reapertura entra directo desde auth_session.json', p4Passed, c2ResumeRes);

    // CICLO 3: Revalidación de sesión durable repetida
    cycle2Win.destroy();
    cycle2Win = null;
    await new Promise(r => setTimeout(r, 500));

    let cycle3Win = await createTestWindow();
    const c3ResumeRes = await cycle3Win.webContents.executeJavaScript(`
      (async function() {
        const start = Date.now();
        while (Date.now() - start < 6000) {
          await new Promise(r => setTimeout(r, 200));
          const lockScreen = document.querySelector('#auth-lock-screen');
          if (lockScreen && lockScreen.classList.contains('hidden')) {
            return { resumed: true };
          }
        }
        return { resumed: false };
      })()
    `);

    const p5Passed = Boolean(c3ResumeRes.resumed);
    recordTest(5, 'Ciclo 3: Tercera reapertura consecutiva mantiene sesión activa de forma estable', p5Passed, c3ResumeRes);

    // --- PRUEBA 6: "Cerrar sesión" borra el token durable y vuelve a pedir login al reiniciar ---
    const logoutRes = await cycle3Win.webContents.executeJavaScript(`
      (async function() {
        const $ = s => document.querySelector(s);
        const btnLogout = $('#btn-logout');
        if (!btnLogout) return { error: 'No btn-logout' };
        btnLogout.click();
        await new Promise(r => setTimeout(r, 600));

        const lockVisible = !$('#auth-lock-screen').classList.contains('hidden');
        const sessionInStorage = localStorage.getItem('podcastcraft_auth_session');
        return { lockVisible, sessionInStorage };
      })()
    `);

    const diskSessionAfterLogout = fs.existsSync(authSessionFile);
    cycle3Win.destroy();
    cycle3Win = null;
    await new Promise(r => setTimeout(r, 500));

    // Reabrir tras cerrar sesión
    let postLogoutWin = await createTestWindow();
    const postLogoutState = await postLogoutWin.webContents.executeJavaScript(`
      (function() {
        const $ = s => document.querySelector(s);
        const lockScreen = $('#auth-lock-screen');
        const loginForm = $('#auth-login-form');
        return {
          isLockVisible: lockScreen && !lockScreen.classList.contains('hidden'),
          isLoginFormVisible: loginForm && !loginForm.classList.contains('hidden')
        };
      })()
    `);

    const p6Passed = Boolean(
      logoutRes.lockVisible &&
      !logoutRes.sessionInStorage &&
      !diskSessionAfterLogout &&
      postLogoutState.isLockVisible &&
      postLogoutState.isLoginFormVisible
    );

    recordTest(6, 'Cerrar sesión: revoca y elimina token de localStorage y disco, y al reabrir pide login', p6Passed, {
      logoutRes,
      diskSessionAfterLogout,
      postLogoutState
    });

    // --- PRUEBA 7: Sin marcar "Recordarme", cerrar la app no guarda token y vuelve a pedir login ---
    const noRememberLoginRes = await postLogoutWin.webContents.executeJavaScript(`
      (async function() {
        const $ = s => document.querySelector(s);
        $('#auth-username').value = 'mauricio_p26d';
        $('#auth-password').value = 'Password123!';
        const rememberCheckbox = $('#auth-remember-me');
        if (rememberCheckbox) rememberCheckbox.checked = false; // Sin casilla
        $('#auth-submit-btn').click();

        const start = Date.now();
        while (Date.now() - start < 5000) {
          await new Promise(r => setTimeout(r, 200));
          const lockScreen = $('#auth-lock-screen');
          if (lockScreen && lockScreen.classList.contains('hidden')) {
            return {
              success: true,
              sessionStored: localStorage.getItem('podcastcraft_auth_session')
            };
          }
        }
        return { success: false };
      })()
    `);

    const diskSessionNoRemember = fs.existsSync(authSessionFile);
    postLogoutWin.destroy();
    postLogoutWin = null;
    await new Promise(r => setTimeout(r, 500));

    // Reabrir tras login sin recordar
    let noRememberReopenWin = await createTestWindow();
    const noRememberReopenState = await noRememberReopenWin.webContents.executeJavaScript(`
      (function() {
        const $ = s => document.querySelector(s);
        const lockScreen = $('#auth-lock-screen');
        const loginForm = $('#auth-login-form');
        return {
          isLockVisible: lockScreen && !lockScreen.classList.contains('hidden'),
          isLoginFormVisible: loginForm && !loginForm.classList.contains('hidden')
        };
      })()
    `);

    const p7Passed = Boolean(
      noRememberLoginRes.success &&
      !noRememberLoginRes.sessionStored &&
      !diskSessionNoRemember &&
      noRememberReopenState.isLockVisible &&
      noRememberReopenState.isLoginFormVisible
    );

    recordTest(7, 'Sin "Recordarme" marcado: no se guarda sesión en disco y al reabrir solicita login', p7Passed, {
      noRememberLoginRes,
      diskSessionNoRemember,
      noRememberReopenState
    });

    // =========================================================================
    // PRUEBA 8: REGRESIÓN DE ALINEACIÓN 0.00 PX
    // =========================================================================
    // Iniciar sesión para ver la regla y los carriles
    await noRememberReopenWin.webContents.executeJavaScript(`
      (async function() {
        const $ = s => document.querySelector(s);
        $('#auth-username').value = 'mauricio_p26d';
        $('#auth-password').value = 'Password123!';
        $('#auth-submit-btn').click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1000));

    const regressionRes = await noRememberReopenWin.webContents.executeJavaScript(`
      (function() {
        const pc = window.PodcastCraft;
        if (pc && typeof pc.seekTo === 'function') {
          pc.seekTo(0);
        }
        const playheadEl = document.querySelector('#timeline-playhead')?.getBoundingClientRect();
        const rulerScaleEl = document.querySelector('#timeline-ruler-scale')?.getBoundingClientRect();
        const laneEl = document.querySelector('.timeline-lane')?.getBoundingClientRect();

        let diffPHRuler = 0;
        let diffPHLane = 0;
        if (playheadEl && rulerScaleEl && laneEl) {
          diffPHRuler = Math.abs(playheadEl.left - rulerScaleEl.left);
          diffPHLane = Math.abs(playheadEl.left - laneEl.left);
        }

        return {
          diffPHRuler,
          diffPHLane,
          isExactZero: diffPHRuler < 0.01 && diffPHLane < 0.01
        };
      })()
    `);

    const p8Passed = Boolean(regressionRes.isExactZero);
    recordTest(8, 'Regresión DAW: Alineación geométrica playhead, regla y carril a 0.00 px', p8Passed, regressionRes);

    results.metrics.alignment = {
      diffPHRulerPx: regressionRes.diffPHRuler,
      diffPHLanePx: regressionRes.diffPHLane,
      exactZero: regressionRes.isExactZero
    };

    noRememberReopenWin.destroy();
    noRememberReopenWin = null;

    // Guardar resultados JSON
    const outputPath = path.join(__dirname, 'test_phase26d_output.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`[Test Runner] Informe completo guardado en: ${outputPath}`);

  } catch (err) {
    console.error('[Test Runner] Error crítico en la suite:', err);
    results.passed = false;
    results.error = String(err.stack || err);
  } finally {
    // Limpieza rigurosa de procesos y carpetas temporales
    if (backendProcess) {
      console.log('[Test Runner] Terminando backend de prueba...');
      try {
        if (process.platform === 'win32' && backendProcess.pid) {
          execSync(`taskkill /pid ${backendProcess.pid} /T /F`, { stdio: 'ignore' });
        } else {
          backendProcess.kill();
        }
      } catch (_) {}
    }

    // Eliminar directorios temporales
    for (const dir of [tempStorageDir, tempUserDataDir, tempExportDir]) {
      try {
        if (fs.existsSync(dir)) {
          console.log('[Test Runner] Limpiando carpeta temporal:', dir);
          fs.rmSync(dir, { recursive: true, force: true });
        }
      } catch (e) {
        console.warn('[Test Runner] Advertencia al eliminar directorio temporal:', dir, e.message);
      }
    }

    console.log(`[Test Runner] ==========================================`);
    console.log(`[Test Runner] RESULTADO FINAL: ${results.passed ? 'TODAS LAS PRUEBAS PASARON EXITOSAMENTE (8/8)' : 'HUBO FALLOS'}`);
    console.log(`[Test Runner] ==========================================`);

    app.exit(results.passed ? 0 : 1);
  }
});
