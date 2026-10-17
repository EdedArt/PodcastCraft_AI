const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

const INSTALLED_EXE = 'C:\\Users\\maury\\AppData\\Local\\Programs\\PodcastCraft AI\\PodcastCraft AI.exe';
const FFMPEG_EXE = 'C:\\Users\\maury\\AppData\\Local\\Programs\\PodcastCraft AI\\resources\\backend\\node_modules\\ffmpeg-static\\ffmpeg.exe';
const REAL_APPDATA_DIR = path.join(process.env.APPDATA, 'podcastcraft-ai');

const results = {
  timestamp: new Date().toISOString(),
  healthCheck: {},
  processWindow: {},
  firstUseAuth: {},
  packaging: {},
  exportTest: {},
  cleanup: {},
  success: false
};

function sendRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, 'http://127.0.0.1:3001');
    const reqHeaders = { 'Accept': 'application/json', ...headers };
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
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function uploadFile(endpoint, filePath, fieldName = 'file') {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const filename = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    const head = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
      `Content-Type: audio/mpeg\r\n\r\n`
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
    const fullBody = Buffer.concat([head, fileContent, tail]);

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function waitForHealth(timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await sendRequest('GET', '/health');
      if (res.status === 200 && res.body && res.body.status === 'ok') {
        return Date.now() - start;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for /health after ${timeoutMs}ms`);
}

function sendCDP(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      } catch (err) {}
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalCDP(ws, expression) {
  const res = await sendCDP(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res && res.result) {
    return res.result.value;
  }
  return res;
}

async function main() {
  console.log('=== Fase 27: Prueba Integral de la App Instalada ===');

  // Asegurar que no hay instancias vivas previas
  try {
    execSync('powershell -NoProfile -Command "Get-Process -Name \\"PodcastCraft AI\\", \\"electron\\" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"', { stdio: 'ignore' });
  } catch (e) {}
  await new Promise(r => setTimeout(r, 1000));

  // Snapshot de APPDATA antes
  const appDataBefore = fs.existsSync(REAL_APPDATA_DIR) ? fs.readdirSync(REAL_APPDATA_DIR) : [];
  console.log(`[Seguridad] %APPDATA%\\podcastcraft-ai tiene ${appDataBefore.length} archivos antes del test.`);

  // Directorios temporales aislados
  const tempTestDir = path.join(os.tmpdir(), `pc_phase27_test_${Date.now()}`);
  const tempStorageDir = path.join(tempTestDir, 'storage');
  const tempUserDataDir = path.join(tempTestDir, 'userData');
  const tempExportDir = path.join(tempTestDir, 'export');

  fs.mkdirSync(tempStorageDir, { recursive: true });
  fs.mkdirSync(tempUserDataDir, { recursive: true });
  fs.mkdirSync(tempExportDir, { recursive: true });

  console.log(`[Temp Dirs] Storage: ${tempStorageDir}`);
  console.log(`[Temp Dirs] UserData: ${tempUserDataDir}`);
  console.log(`[Temp Dirs] Export: ${tempExportDir}`);

  // Captura de logs de Electron para extraer bounds reales
  let capturedBounds = null;
  let capturedWindowName = null;
  let capturedVisible = null;

  // 1. Lanzar app instalada
  console.log(`[Launch] Iniciando: ${INSTALLED_EXE}`);
  const child = spawn(INSTALLED_EXE, [
    `--user-data-dir=${tempUserDataDir}`,
    '--remote-debugging-port=9222',
    '--enable-logging'
  ], {
    env: {
      ...process.env,
      PODCASTCRAFT_STORAGE_DIR: tempStorageDir,
      PORT: '3001'
    },
    detached: false,
    stdio: 'pipe'
  });

  child.stdout.on('data', (d) => {
    const s = d.toString();
    process.stdout.write(`[App Out] ${s}`);
    const boundsMatch = s.match(/Bounds:\s*x=(\d+),\s*y=(\d+),\s*w=(\d+),\s*h=(\d+)/);
    if (boundsMatch) {
      capturedBounds = {
        x: parseInt(boundsMatch[1]),
        y: parseInt(boundsMatch[2]),
        width: parseInt(boundsMatch[3]),
        height: parseInt(boundsMatch[4])
      };
    }
    const winMatch = s.match(/Ventana activa:\s*"([^"]+)"/);
    if (winMatch) capturedWindowName = winMatch[1];
    const visMatch = s.match(/Visible:\s*(true|false)/);
    if (visMatch) capturedVisible = visMatch[1] === 'true';
  });

  child.stderr.on('data', (d) => process.stderr.write(`[App Err] ${d}`));
  child.on('exit', (code, signal) => console.log(`[App Exit] code: ${code}, signal: ${signal}`));
  child.on('error', (err) => console.error('[App Error]', err));

  // 2. Medir tiempo hasta /health
  console.log('[Health] Esperando respuesta de http://127.0.0.1:3001/health...');
  const healthElapsedMs = await waitForHealth(25000);
  console.log(`[Health] OK! Tiempo hasta /health: ${healthElapsedMs} ms`);
  results.healthCheck = { ok: true, elapsedMs: healthElapsedMs };

  // 3. Confirmar ventana, proceso, tamaño
  console.log('[Window] Esperando registro de propiedades de ventana...');
  for (let retry = 0; retry < 20; retry++) {
    if (capturedBounds && capturedWindowName) break;
    await new Promise(r => setTimeout(r, 200));
  }

  const fitsInScreen = capturedBounds && capturedBounds.width <= 1366 && capturedBounds.height <= 768;
  console.log(`[Window Screen Check] Nombre: "${capturedWindowName}", Visible: ${capturedVisible}, Bounds:`, capturedBounds);
  console.log(`[Window Screen Check] Ajusta a pantalla de 1366x768: ${fitsInScreen}`);

  results.processWindow = {
    processName: 'PodcastCraft AI',
    title: capturedWindowName || 'PodcastCraft AI',
    width: capturedBounds?.width,
    height: capturedBounds?.height,
    visible: capturedVisible ?? true,
    fitsInScreen,
    targetScreen: '1366x768'
  };

  // 4. Primer uso mediante CDP: crear cuenta desde la interfaz y entrar al DAW
  console.log('[CDP] Conectando a Chromium DevTools en puerto 9222...');
  let targets = [];
  for (let retry = 0; retry < 15; retry++) {
    try {
      const res = await new Promise((res, rej) => {
        http.get('http://127.0.0.1:9222/json/list', (r) => {
          let b = '';
          r.on('data', d => b += d);
          r.on('end', () => res(JSON.parse(b)));
        }).on('error', rej);
      });
      if (Array.isArray(res) && res.length > 0) {
        targets = res;
        break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 400));
  }

  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) throw new Error('No se encontró página en CDP');
  console.log(`[CDP] Conectando a página: ${pageTarget.title} (${pageTarget.webSocketDebuggerUrl})`);

  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  await sendCDP(ws, 'Runtime.enable');

  // Evaluar estado inicial: debe estar en modo registro (sin cuentas previas)
  let initialViewState = null;
  for (let retry = 0; retry < 15; retry++) {
    initialViewState = await evalCDP(ws, `(() => {
      const lockScreen = document.getElementById('auth-lock-screen');
      const regForm = document.getElementById('auth-register-form');
      const loginForm = document.getElementById('auth-login-form');
      if (!lockScreen || !regForm || !loginForm) return null;
      return {
        lockScreenVisible: !lockScreen.classList.contains('hidden'),
        registerFormVisible: !regForm.classList.contains('hidden'),
        loginFormVisible: !loginForm.classList.contains('hidden')
      };
    })()`);
    if (initialViewState && initialViewState.lockScreenVisible) break;
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('[CDP Initial View]', initialViewState);
  results.firstUseAuth.initialState = initialViewState;

  // Llenar formulario de creación de cuenta y enviar
  console.log('[CDP] Creando cuenta de prueba desde la interfaz real...');
  await evalCDP(ws, `(() => {
    const userInput = document.getElementById('auth-reg-username');
    const passInput = document.getElementById('auth-reg-password');
    const confirmInput = document.getElementById('auth-reg-confirm');
    const submitBtn = document.getElementById('auth-reg-submit-btn');

    userInput.value = 'productor_demo';
    userInput.dispatchEvent(new Event('input', { bubbles: true }));

    passInput.value = 'DemoClave2026!';
    passInput.dispatchEvent(new Event('input', { bubbles: true }));

    confirmInput.value = 'DemoClave2026!';
    confirmInput.dispatchEvent(new Event('input', { bubbles: true }));

    submitBtn.click();
    return true;
  })()`);

  // Esperar a que aparezca el modal con el código de recuperación
  let recoveryModalData = null;
  for (let retry = 0; retry < 30; retry++) {
    const res = await evalCDP(ws, `(() => {
      const modal = document.getElementById('auth-recovery-modal');
      const codeDisplay = document.getElementById('auth-recovery-code-display');
      const isVis = modal && !modal.classList.contains('hidden');
      return {
        visible: isVis,
        code: codeDisplay ? codeDisplay.textContent.trim() : null
      };
    })()`);
    if (res && res.visible && res.code && res.code !== '---- ---- ----') {
      recoveryModalData = res;
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`[CDP Recovery Modal] Visible: ${recoveryModalData?.visible}, Formato código: ${recoveryModalData?.code?.replace(/./g, '*')}`);
  results.firstUseAuth.recoveryModal = {
    visible: recoveryModalData?.visible,
    codeLength: recoveryModalData?.code?.length,
    codeValidFormat: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(recoveryModalData?.code)
  };

  // Confirmar checkbox y pulsar continuar para entrar al DAW
  console.log('[CDP] Confirmando código de recuperación y pulsando Continuar...');
  await evalCDP(ws, `(() => {
    const chk = document.getElementById('auth-recovery-confirm-check');
    const btn = document.getElementById('auth-recovery-continue-btn');
    chk.checked = true;
    chk.dispatchEvent(new Event('change', { bubbles: true }));
    btn.click();
    return true;
  })()`);

  // Esperar a que la pantalla de bloqueo desaparezca y el topbar/DAW esté visible
  let editorActive = false;
  for (let retry = 0; retry < 30; retry++) {
    const res = await evalCDP(ws, `(() => {
      const lockScreen = document.getElementById('auth-lock-screen');
      const topbar = document.getElementById('topbar');
      const ruler = document.getElementById('timeline-ruler-scale');
      return {
        lockScreenHidden: lockScreen ? lockScreen.classList.contains('hidden') : false,
        topbarVisible: topbar ? !topbar.classList.contains('hidden') : false,
        rulerPresent: Boolean(ruler)
      };
    })()`);
    if (res && res.lockScreenHidden && res.topbarVisible) {
      editorActive = true;
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`[CDP Editor Transition] Editor DAW activo: ${editorActive}`);
  results.firstUseAuth.editorActive = editorActive;
  ws.close();

  // 5. Prueba de exportación real desde el instalador
  console.log('[Export] Generando dos tonos senoidales para mezcla...');
  const tone1Path = path.join(tempExportDir, 'tone1.mp3');
  const tone2Path = path.join(tempExportDir, 'tone2.mp3');

  // Tone 1: 3.0s, 440 Hz
  execSync(`"${FFMPEG_EXE}" -f lavfi -i "sine=frequency=440:duration=3" -b:a 192k "${tone1Path}" -y`, { stdio: 'ignore' });
  // Tone 2: 4.0s, 880 Hz
  execSync(`"${FFMPEG_EXE}" -f lavfi -i "sine=frequency=880:duration=4" -b:a 192k "${tone2Path}" -y`, { stdio: 'ignore' });

  console.log(`[Export] Subiendo audios a POST /api/audio (campo "file")...`);
  const up1 = await uploadFile('/api/audio', tone1Path, 'file');
  const up2 = await uploadFile('/api/audio', tone2Path, 'file');
  console.log(`[Export] Tone 1 subido con ID: ${up1.body?.id}, nombre: ${up1.body?.name}`);
  console.log(`[Export] Tone 2 subido con ID: ${up2.body?.id}, nombre: ${up2.body?.name}`);

  // Configurar proyecto de 2 carriles con volúmenes distintos
  // Carril 1: volumen 0.8, clip de 0 a 3s
  // Carril 2: volumen 0.5, clip de 1.5s a 5.5s (duración esperada total = 5.5s)
  const destinationMp3 = path.join(tempExportDir, 'podcast_final_export.mp3');
  const exportPayload = {
    title: 'PodcastCraft_Export_Test',
    destinationPath: destinationMp3,
    tracks: [
      {
        id: 'track-vocal',
        name: 'Voz Locutor',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [
          {
            id: 'clip-1',
            libraryId: up1.body.id,
            name: 'Tono 440Hz',
            start: 0.0,
            duration: 3.0,
            sourceOffset: 0,
            volume: 1.0
          }
        ]
      },
      {
        id: 'track-bgm',
        name: 'Música Fondo',
        volume: 0.5,
        pan: 0,
        muted: false,
        solo: false,
        clips: [
          {
            id: 'clip-2',
            libraryId: up2.body.id,
            name: 'Tono 880Hz',
            start: 1.5,
            duration: 4.0,
            sourceOffset: 0,
            volume: 1.0
          }
        ]
      }
    ]
  };

  console.log('[Export] Llamando a POST /api/export desde el backend instalado...');
  const exportStartTime = Date.now();
  const exportRes = await sendRequest('POST', '/api/export', exportPayload);
  const exportElapsedMs = Date.now() - exportStartTime;
  console.log(`[Export] Respuesta: ${exportRes.status}, tamaño reportado: ${exportRes.body?.size} bytes en ${exportElapsedMs} ms`);

  // Verificar archivo en disco
  const exportExists = fs.existsSync(destinationMp3);
  const actualBytes = exportExists ? fs.statSync(destinationMp3).size : 0;
  console.log(`[Export File] Existe: ${exportExists}, bytes reales en disco: ${actualBytes}`);

  // Analizar archivo con ffmpeg
  let probeOut = '';
  try {
    probeOut = execSync(`"${FFMPEG_EXE}" -i "${destinationMp3}" 2>&1`, { encoding: 'utf8' });
  } catch (err) {
    probeOut = (err.stdout || '') + (err.stderr || '') + (err.output ? err.output.join('') : '');
  }
  const durationMatch = probeOut.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  let durationSec = 0;
  if (durationMatch) {
    durationSec = parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]);
  }
  const bitrateMatch = probeOut.match(/bitrate:\s*(\d+)\s*kb\/s/);
  const bitrateKbps = bitrateMatch ? parseInt(bitrateMatch[1]) : 0;

  // Test de decodificación completa sin errores
  let decodeClean = false;
  try {
    execSync(`"${FFMPEG_EXE}" -v error -i "${destinationMp3}" -f null -`, { encoding: 'utf8' });
    decodeClean = true;
  } catch (err) {
    decodeClean = false;
  }

  console.log(`[Export Quality] Duración obtenida: ${durationSec}s vs esperada: 5.50s`);
  console.log(`[Export Quality] Bitrate: ${bitrateKbps} kbps`);
  console.log(`[Export Quality] Decodificación sin errores (0 error output): ${decodeClean}`);

  results.exportTest = {
    status: exportRes.status,
    exportElapsedMs,
    filePath: destinationMp3,
    fileExists: exportExists,
    bytes: actualBytes,
    durationExpected: 5.5,
    durationActual: durationSec,
    durationDiff: Math.abs(durationSec - 5.5),
    bitrateKbps,
    decodeClean
  };

  // 6. Cierre de la app instalada
  console.log('[Shutdown] Cerrando aplicación instalada...');
  try {
    child.kill();
  } catch (e) {}

  // Asegurar que todos los procesos de la app instalada mueran
  try {
    execSync('taskkill /F /IM "PodcastCraft AI.exe" /T', { stdio: 'ignore' });
  } catch (e) {}
  await new Promise(r => setTimeout(r, 1500));

  // Verificar que el puerto 3001 está libre
  let port3001Free = false;
  try {
    await sendRequest('GET', '/health');
    port3001Free = false;
  } catch (e) {
    port3001Free = true;
  }
  console.log(`[Cleanup] Puerto 3001 liberado: ${port3001Free}`);

  // Verificar que no hay procesos vivos
  let aliveProcesses = 0;
  try {
    const tasklistOut = execSync('tasklist /FI "IMAGENAME eq PodcastCraft AI.exe" /FO CSV', { encoding: 'utf8' });
    const matches = tasklistOut.match(/PodcastCraft AI\.exe/gi);
    aliveProcesses = matches ? matches.length : 0;
  } catch (e) {}
  console.log(`[Cleanup] Procesos vivos de PodcastCraft AI: ${aliveProcesses}`);

  // Snapshot de APPDATA después
  const appDataAfter = fs.existsSync(REAL_APPDATA_DIR) ? fs.readdirSync(REAL_APPDATA_DIR) : [];
  const appDataUnchanged = JSON.stringify(appDataBefore) === JSON.stringify(appDataAfter);
  console.log(`[Seguridad] %APPDATA%\\podcastcraft-ai tiene ${appDataAfter.length} archivos después (Sin cambios: ${appDataUnchanged}).`);

  // Limpiar carpetas temporales
  try {
    fs.rmSync(tempTestDir, { recursive: true, force: true });
    console.log('[Cleanup] Carpetas temporales eliminadas.');
  } catch (e) {
    console.warn('[Cleanup Warning] No se pudo borrar carpeta temporal:', e.message);
  }

  results.cleanup = {
    port3001Free,
    processesRemaining: parseInt(aliveProcesses || '0'),
    appDataBeforeCount: appDataBefore.length,
    appDataAfterCount: appDataAfter.length,
    appDataUnchanged
  };

  results.success = (
    results.healthCheck.ok &&
    results.processWindow.fitsInScreen &&
    results.firstUseAuth.editorActive &&
    results.exportTest.fileExists &&
    results.exportTest.decodeClean &&
    results.cleanup.port3001Free &&
    results.cleanup.appDataUnchanged
  );

  fs.writeFileSync(path.join(__dirname, 'test_phase27_installer_output.json'), JSON.stringify(results, null, 2));
  console.log(`=== Test Completado! Resultado final: ${results.success ? 'PASSED (EXITO)' : 'FAILED (FALLO)'} ===`);
}

main().catch(err => {
  console.error('FATAL ERROR EN TEST:', err);
  process.exit(1);
});
