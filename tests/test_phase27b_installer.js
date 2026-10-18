const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

const INSTALLED_DIR = 'C:\\Users\\maury\\AppData\\Local\\Programs\\PodcastCraft AI';
const INSTALLED_EXE = path.join(INSTALLED_DIR, 'PodcastCraft AI.exe');
const FFMPEG_EXE = path.join(INSTALLED_DIR, 'resources', 'backend', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const REAL_APPDATA_DIR = path.join(process.env.APPDATA, 'podcastcraft-ai');
const rootDir = path.resolve(__dirname, '..');

const results = {
  timestamp: new Date().toISOString(),
  healthCheck: {},
  processWindow: {},
  installedEyeToggle: {},
  firstUseAuth: {},
  exportTest: {},
  packagingCheck: {},
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
  console.log('=== Fase 27b: Verificación Esencial de la App Instalada ===');

  // Asegurar que no hay procesos vivos
  try {
    execSync('powershell -NoProfile -Command "Get-Process -Name \\"PodcastCraft AI\\", \\"electron\\" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"', { stdio: 'ignore' });
  } catch (e) {}
  await new Promise(r => setTimeout(r, 1000));

  // Directorios temporales aislados
  const tempTestDir = path.join(os.tmpdir(), `pc_phase27b_inst_${Date.now()}`);
  const tempStorageDir = path.join(tempTestDir, 'storage');
  const tempUserDataDir = path.join(tempTestDir, 'userData');
  const tempExportDir = path.join(tempTestDir, 'export');

  fs.mkdirSync(tempStorageDir, { recursive: true });
  fs.mkdirSync(tempUserDataDir, { recursive: true });
  fs.mkdirSync(tempExportDir, { recursive: true });

  console.log(`[Temp Dirs] Storage: ${tempStorageDir}`);
  console.log(`[Temp Dirs] UserData: ${tempUserDataDir}`);

  // Captura de logs de Electron para extraer bounds reales
  let capturedBounds = null;
  let capturedWindowName = null;
  let capturedVisible = null;

  // 1. Lanzar app instalada
  console.log(`[Launch] Iniciando binario instalado: ${INSTALLED_EXE}`);
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
  for (let retry = 0; retry < 25; retry++) {
    if (capturedBounds && capturedWindowName) break;
    await new Promise(r => setTimeout(r, 200));
  }

  const isExpectedSize = capturedBounds && capturedBounds.width === 1297 && capturedBounds.height === 684;
  console.log(`[Window Screen Check] Nombre: "${capturedWindowName}", Visible: ${capturedVisible}, Bounds:`, capturedBounds);
  console.log(`[Window Screen Check] Dimensiones exactas 1297x684: ${isExpectedSize}`);

  results.processWindow = {
    processName: 'PodcastCraft AI',
    title: capturedWindowName || 'PodcastCraft AI',
    width: capturedBounds?.width,
    height: capturedBounds?.height,
    visible: capturedVisible ?? true,
    exact1297x684: isExpectedSize
  };

  // 4. Conectar a Chromium DevTools
  console.log('[CDP] Conectando a Chromium DevTools en puerto 9222...');
  let targets = [];
  for (let retry = 0; retry < 20; retry++) {
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

  // Esperar a que el frontend cambie a la vista de crear cuenta (primer uso)
  for (let i = 0; i < 30; i++) {
    const isReady = await evalCDP(ws, `(() => {
      const regView = document.getElementById('auth-view-register');
      return regView && !regView.classList.contains('hidden');
    })()`);
    if (isReady) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Evaluar presencia y funcionamiento del ojito en la app instalada
  console.log('[Installed Eye Check] Verificando botón ojito en la app instalada...');
  const eyeCheckResult = await evalCDP(ws, `(() => {
    const regPassInp = document.getElementById('auth-reg-password');
    const regPassBtn = document.getElementById('auth-reg-password-toggle');
    const regConfirmInp = document.getElementById('auth-reg-confirm');
    const regConfirmBtn = document.getElementById('auth-reg-confirm-toggle');

    if (!regPassInp || !regPassBtn || !regConfirmInp || !regConfirmBtn) {
      return { found: false };
    }

    const initialType = regPassInp.type;
    regPassInp.value = 'InstalledTest123!';
    regPassInp.dispatchEvent(new Event('input', { bubbles: true }));

    // Click 1: toggle to visible
    regPassBtn.click();
    const typeAfterClick1 = regPassInp.type;
    const pressedAfterClick1 = regPassBtn.getAttribute('aria-pressed');
    const labelAfterClick1 = regPassBtn.getAttribute('aria-label');
    const valuePreserved1 = (regPassInp.value === 'InstalledTest123!');

    // Click 2: toggle to hidden
    regPassBtn.click();
    const typeAfterClick2 = regPassInp.type;
    const pressedAfterClick2 = regPassBtn.getAttribute('aria-pressed');
    const labelAfterClick2 = regPassBtn.getAttribute('aria-label');
    const valuePreserved2 = (regPassInp.value === 'InstalledTest123!');

    const rect = regPassBtn.getBoundingClientRect();

    return {
      found: true,
      buttonType: regPassBtn.type,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      initialType,
      typeAfterClick1,
      pressedAfterClick1,
      labelAfterClick1,
      valuePreserved1,
      typeAfterClick2,
      pressedAfterClick2,
      labelAfterClick2,
      valuePreserved2,
      success: (
        regPassBtn.type === 'button' &&
        rect.width >= 31.9 && rect.height >= 31.9 &&
        initialType === 'password' &&
        typeAfterClick1 === 'text' && pressedAfterClick1 === 'true' &&
        typeAfterClick2 === 'password' && pressedAfterClick2 === 'false' &&
        valuePreserved1 && valuePreserved2
      )
    };
  })()`);

  console.log('[Installed Eye Check Result]', eyeCheckResult);
  results.installedEyeToggle = eyeCheckResult;

  // Llenar formulario de creación de cuenta y enviar
  console.log('[CDP] Creando cuenta de prueba desde la app instalada...');
  await evalCDP(ws, `(() => {
    const userInput = document.getElementById('auth-reg-username');
    const passInput = document.getElementById('auth-reg-password');
    const confirmInput = document.getElementById('auth-reg-confirm');
    const submitBtn = document.getElementById('auth-reg-submit-btn');

    userInput.value = 'productor_instalado';
    userInput.dispatchEvent(new Event('input', { bubbles: true }));

    passInput.value = 'ClaveInstalada2026!';
    passInput.dispatchEvent(new Event('input', { bubbles: true }));

    confirmInput.value = 'ClaveInstalada2026!';
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

  const rawCode = recoveryModalData?.code || '';
  const cleanedCode = rawCode.replace(/[\s-]/g, '');
  console.log(`[CDP Recovery Modal] Visible: ${recoveryModalData?.visible}, Código limpio: ${cleanedCode.length} chars (${rawCode})`);
  results.firstUseAuth = {
    recoveryModalVisible: recoveryModalData?.visible,
    codeLength: cleanedCode.length,
    codeFormatted: rawCode,
    is12Chars: cleanedCode.length === 12
  };

  // Confirmar checkbox y pulsar continuar
  console.log('[CDP] Confirmando código de recuperación y entrando al editor...');
  await evalCDP(ws, `(() => {
    const chk = document.getElementById('auth-recovery-confirm-check');
    const btn = document.getElementById('auth-recovery-continue-btn');
    chk.checked = true;
    chk.dispatchEvent(new Event('change', { bubbles: true }));
    btn.click();
    return true;
  })()`);

  // Esperar a que la pantalla de bloqueo desaparezca y el topbar esté activo
  let editorActive = false;
  for (let retry = 0; retry < 30; retry++) {
    const res = await evalCDP(ws, `(() => {
      const lockScreen = document.getElementById('auth-lock-screen');
      const topbar = document.getElementById('topbar');
      return {
        lockScreenHidden: lockScreen ? lockScreen.classList.contains('hidden') : false,
        topbarVisible: topbar ? !topbar.classList.contains('hidden') : false
      };
    })()`);
    if (res && res.lockScreenHidden && res.topbarVisible) {
      editorActive = true;
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`[CDP Editor Transition] Editor activo: ${editorActive}`);
  results.firstUseAuth.editorActive = editorActive;
  ws.close();

  // 5. Prueba de exportación real desde la app instalada
  console.log('[Export] Generando dos tonos senoidales para mezcla...');
  const tone1Path = path.join(tempExportDir, 'tone1.mp3');
  const tone2Path = path.join(tempExportDir, 'tone2.mp3');

  execSync(`"${FFMPEG_EXE}" -f lavfi -i "sine=frequency=440:duration=3" -b:a 192k "${tone1Path}" -y`, { stdio: 'ignore' });
  execSync(`"${FFMPEG_EXE}" -f lavfi -i "sine=frequency=880:duration=4" -b:a 192k "${tone2Path}" -y`, { stdio: 'ignore' });

  const up1 = await uploadFile('/api/audio', tone1Path, 'file');
  const up2 = await uploadFile('/api/audio', tone2Path, 'file');

  const destinationMp3 = path.join(tempExportDir, 'installed_export_test.mp3');
  const exportPayload = {
    title: 'Installed_Export_Test',
    destinationPath: destinationMp3,
    tracks: [
      {
        id: 'track-vocal',
        volume: 0.8,
        clips: [{ id: 'clip-1', libraryId: up1.body.id, start: 0, duration: 3 }]
      },
      {
        id: 'track-bg',
        volume: 0.5,
        clips: [{ id: 'clip-2', libraryId: up2.body.id, start: 1.5, duration: 4 }]
      }
    ]
  };

  console.log('[Export] Solicitando mezcla a POST /api/export...');
  const exportStart = Date.now();
  const exportRes = await sendRequest('POST', '/api/export', exportPayload);
  const exportDurationMs = Date.now() - exportStart;

  if (exportRes.status !== 200 || !fs.existsSync(destinationMp3)) {
    throw new Error(`Exportación fallida: status ${exportRes.status}`);
  }

  const exportStat = fs.statSync(destinationMp3);
  console.log(`[Export] Mezcla generada: ${exportStat.size} bytes en ${exportDurationMs} ms`);

  // Inspeccionar duración y bitrate con ffmpeg
  let probeOutput = '';
  try {
    probeOutput = execSync(`"${FFMPEG_EXE}" -i "${destinationMp3}" 2>&1`, { encoding: 'utf8' });
  } catch (err) {
    probeOutput = (err.stdout || '') + (err.stderr || '') + (err.output ? err.output.join('') : '');
  }
  const durationMatch = probeOutput.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  let durationSec = null;
  if (durationMatch) {
    durationSec = parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]);
  }
  const bitrateMatch = probeOutput.match(/bitrate:\s*(\d+)\s*kb\/s/);
  const bitrateKbps = bitrateMatch ? parseInt(bitrateMatch[1]) : null;

  // Verificación de integridad: decodificación completa sin errores
  let decodeErrors = null;
  try {
    execSync(`"${FFMPEG_EXE}" -v error -i "${destinationMp3}" -f null -`, { stdio: 'pipe' });
    decodeErrors = 0;
  } catch (err) {
    decodeErrors = err.stderr ? err.stderr.toString() : 1;
  }

  results.exportTest = {
    ok: true,
    bytes: exportStat.size,
    durationSec: Number(durationSec.toFixed(2)),
    expectedDurationSec: 5.5,
    bitrateKbps,
    decodeErrors,
    exportElapsedMs: exportDurationMs
  };

  // 6. Verificación del empaquetado: backend/.env presente con variable definida (sin imprimir) y sin carpeta tests/
  const installedEnvPath = path.join(INSTALLED_DIR, 'resources', 'backend', '.env');
  const envExists = fs.existsSync(installedEnvPath);
  let envHasKey = false;
  if (envExists) {
    const envContent = fs.readFileSync(installedEnvPath, 'utf8');
    envHasKey = /^\s*GEMINI_API_KEY=.+$/m.test(envContent);
  }

  // Verificar ausencia de tests/ en todo el paquete instalado
  const testsPath1 = path.join(INSTALLED_DIR, 'resources', 'tests');
  const testsPath2 = path.join(INSTALLED_DIR, 'resources', 'backend', 'tests');
  const testsPath3 = path.join(INSTALLED_DIR, 'resources', 'app.asar.unpacked', 'tests');
  const testsExist = fs.existsSync(testsPath1) || fs.existsSync(testsPath2) || fs.existsSync(testsPath3);

  console.log(`[Packaging] backend/.env existe: ${envExists}, GEMINI_API_KEY definida: ${envHasKey}`);
  console.log(`[Packaging] Carpeta tests/ ausente: ${!testsExist}`);

  results.packagingCheck = {
    envExists,
    geminiKeyDefined: envHasKey,
    testsDirectoryAbsent: !testsExist
  };

  // 7. Cerrar la app instalada
  console.log('[Cleanup] Cerrando aplicación instalada...');
  try {
    execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
  } catch (e) {}

  await new Promise(r => setTimeout(r, 1500));

  // Verificar procesos y puertos
  const checkProcesses = execSync('powershell -NoProfile -Command "(Get-Process -Name *podcastcraft*, *electron* -ErrorAction SilentlyContinue).Count"').toString().trim();
  const portConnections = execSync('powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).Count"').toString().trim();

  results.cleanup = {
    remainingProcesses: parseInt(checkProcesses) || 0,
    port3001Alive: (parseInt(portConnections) || 0) > 0
  };

  results.success = (
    results.healthCheck.ok &&
    results.processWindow.exact1297x684 &&
    results.installedEyeToggle.success &&
    results.firstUseAuth.editorActive &&
    results.firstUseAuth.is12Chars &&
    results.exportTest.ok &&
    results.exportTest.decodeErrors === 0 &&
    results.packagingCheck.envExists &&
    results.packagingCheck.geminiKeyDefined &&
    results.packagingCheck.testsDirectoryAbsent &&
    results.cleanup.remainingProcesses === 0 &&
    !results.cleanup.port3001Alive
  );

  fs.writeFileSync(path.join(rootDir, 'tests', 'test_phase27b_installer_output.json'), JSON.stringify(results, null, 2));

  console.log('\n======================================================');
  console.log(`VERIFICACIÓN APP INSTALADA: ${results.success ? '100% EXITOSA' : 'FALLÓ AL MENOS UN CRITERIO'}`);
  console.log(`Arranque /health: ${results.healthCheck.elapsedMs} ms`);
  console.log(`Ventana 1297x684: ${results.processWindow.exact1297x684}`);
  console.log(`Ojito en App Instalada: ${results.installedEyeToggle.success}`);
  console.log(`Código recuperación 12 chars: ${results.firstUseAuth.is12Chars} (${results.firstUseAuth.codeLength} chars)`);
  console.log(`Exportación: ${results.exportTest.bytes} bytes, ${results.exportTest.durationSec} s, ${results.exportTest.bitrateKbps} kbps, errores decodificación: ${results.exportTest.decodeErrors}`);
  console.log(`backend/.env presente con variable definida: ${results.packagingCheck.geminiKeyDefined}`);
  console.log(`Carpeta tests/ ausente: ${results.packagingCheck.testsDirectoryAbsent}`);
  console.log(`Procesos residuales: ${results.cleanup.remainingProcesses}`);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('[Fatal Error]', err);
  results.success = false;
  results.error = err.message;
  process.exit(1);
});
