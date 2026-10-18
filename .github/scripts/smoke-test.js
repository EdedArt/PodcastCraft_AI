const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    appPath: '',
    resourcesPath: '',
    ffmpegPath: '',
    envPath: '',
    noSandbox: false,
    timeoutMs: 35000,
    target: ''
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--app-path' && i + 1 < args.length) {
      options.appPath = args[++i];
    } else if (arg === '--resources-path' && i + 1 < args.length) {
      options.resourcesPath = args[++i];
    } else if (arg === '--ffmpeg-path' && i + 1 < args.length) {
      options.ffmpegPath = args[++i];
    } else if (arg === '--env-path' && i + 1 < args.length) {
      options.envPath = args[++i];
    } else if (arg === '--no-sandbox') {
      options.noSandbox = true;
    } else if (arg === '--timeout' && i + 1 < args.length) {
      options.timeoutMs = parseInt(args[++i], 10);
    } else if (arg === '--target' && i + 1 < args.length) {
      options.target = args[++i];
    }
  }

  if (!options.target) {
    if (process.platform === 'darwin') {
      options.target = process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
    } else if (process.platform === 'linux') {
      options.target = (options.appPath && options.appPath.endsWith('.deb')) ? 'deb' : 'appimage';
    } else {
      options.target = 'win';
    }
  }

  return options;
}

function sendRequest(method, endpoint, body = null, headers = {}, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, 'http://127.0.0.1:3001');
    const reqHeaders = { 'Accept': 'application/json', ...headers };
    let payload = null;

    if (body !== null) {
      if (Buffer.isBuffer(body)) {
        payload = body;
      } else if (typeof body === 'object') {
        payload = JSON.stringify(body);
        reqHeaders['Content-Type'] = 'application/json';
      } else {
        payload = String(body);
      }
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, { method, headers: reqHeaders, timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (_) {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout HTTP (${timeoutMs}ms) ${method} ${endpoint}`));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function sendMultipartAudio(filename, buffer, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const boundary = '----PodcastCraftSmokeBoundary' + Date.now();
    const CRLF = '\r\n';

    const header = Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}` +
      `Content-Type: audio/mpeg${CRLF}${CRLF}`
    );
    const footer = Buffer.from(`${CRLF}--${boundary}--${CRLF}`);
    const payload = Buffer.concat([header, buffer, footer]);

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/audio',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length,
        'Accept': 'application/json'
      },
      timeout: timeoutMs
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (_) {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout (${timeoutMs}ms) subiendo audio multipart`));
    });

    req.write(payload);
    req.end();
  });
}

function generateSineWaveMp3(ffmpegExe, frequencyHz, durationSec, outputPath) {
  const cmd = `"${ffmpegExe}" -y -f lavfi -i "sine=frequency=${frequencyHz}:duration=${durationSec}" -c:a libmp3lame -b:a 192k -ar 44100 -ac 2 "${outputPath}"`;
  execSync(cmd, { stdio: 'pipe' });
  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
    throw new Error(`Fallo generando tono senoidal de ${frequencyHz}Hz con ffmpeg`);
  }
}

async function cleanupProcesses(child, opts) {
  const isWindows = process.platform === 'win32';
  const pid = child ? child.pid : null;

  if (pid) {
    console.log(`[Cleanup] Terminando proceso de la aplicación (PID: ${pid})...`);

    // 1. Destruir y desreferenciar streams stdio para liberar el event loop de Node
    try {
      if (child.stdout && typeof child.stdout.destroy === 'function') {
        child.stdout.destroy();
      }
    } catch (_) {}
    try {
      if (child.stderr && typeof child.stderr.destroy === 'function') {
        child.stderr.destroy();
      }
    } catch (_) {}
    try {
      if (typeof child.unref === 'function') {
        child.unref();
      }
    } catch (_) {}

    // 2. Enviar SIGTERM al grupo (POSIX) o árbol (Windows)
    if (isWindows) {
      try {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
      } catch (_) {}
    } else {
      try {
        // Enviar SIGTERM a todo el grupo de procesos (-pid)
        process.kill(-pid, 'SIGTERM');
      } catch (e1) {
        try {
          process.kill(pid, 'SIGTERM');
        } catch (_) {}
      }

      // 3. Esperar hasta 10 segundos a que el proceso y grupo terminen
      const deadline = Date.now() + 10000;
      let alive = true;
      while (Date.now() < deadline) {
        try {
          process.kill(pid, 0); // Comprueba existencia de proceso
          await new Promise(r => setTimeout(r, 400));
        } catch (err) {
          // ESRCH: el proceso ya no existe
          alive = false;
          break;
        }
      }

      // 4. Si sigue vivo tras 10 segundos, forzar SIGKILL al grupo de procesos
      if (alive) {
        console.log(`[Cleanup] Proceso ${pid} sigue activo tras 10s. Forzando SIGKILL al grupo de procesos...`);
        try {
          process.kill(-pid, 'SIGKILL');
        } catch (e2) {
          try {
            process.kill(pid, 'SIGKILL');
          } catch (_) {}
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  // 5. Barrido específico para macOS: matar procesos cuyo ejecutable esté dentro del .app de la prueba
  if (process.platform === 'darwin') {
    try {
      let appBundle = '';
      if (opts && opts.appPath && opts.appPath.includes('.app')) {
        appBundle = opts.appPath.substring(0, opts.appPath.indexOf('.app') + 4);
      }
      if (appBundle) {
        console.log(`[Cleanup macOS] Terminando procesos residuales en bundle: "${appBundle}"...`);
        execSync(`pkill -9 -f "${appBundle}" || true`, { stdio: 'ignore' });
      }
      execSync('pkill -9 -f "PodcastCraft AI" || true', { stdio: 'ignore' });
      execSync('lsof -ti :3001 | xargs kill -9 2>/dev/null || true', { stdio: 'ignore' });
    } catch (_) {}
  }

  // 6. Barrido para Linux: matar procesos de la app y liberar puerto 3001
  if (process.platform === 'linux') {
    try {
      execSync('pkill -9 -f "podcastcraft-ai" || true', { stdio: 'ignore' });
      execSync('pkill -9 -f "PodcastCraft AI" || true', { stdio: 'ignore' });
      execSync('fuser -k 3001/tcp || true', { stdio: 'ignore' });
    } catch (_) {}
  }

  console.log('[Cleanup] Limpieza de procesos completada.');
}

async function main() {
  const opts = parseArgs();
  console.log('=== PodcastCraft AI — Prueba de Humo de Producción (Smoke Test) ===');
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log(`Plataforma: ${process.platform} (${process.arch})`);
  console.log(`Target: ${opts.target}`);
  console.log(`Ruta ejecutable: ${opts.appPath}`);

  if (!opts.appPath || !fs.existsSync(opts.appPath)) {
    throw new Error(`Ruta de aplicación no especificada o archivo inexistente: "${opts.appPath}"`);
  }

  // 1. Directorios temporales aislados
  const tempBase = path.join(os.tmpdir(), `pc_smoke_${Date.now()}`);
  const tempStorage = path.join(tempBase, 'storage');
  const tempUserData = path.join(tempBase, 'userData');
  const tempExport = path.join(tempBase, 'export');

  fs.mkdirSync(tempStorage, { recursive: true });
  fs.mkdirSync(tempUserData, { recursive: true });
  fs.mkdirSync(tempExport, { recursive: true });

  console.log(`[Temp] Almacenamiento: ${tempStorage}`);
  console.log(`[Temp] UserData: ${tempUserData}`);
  console.log(`[Temp] Exportación: ${tempExport}`);

  let child = null;
  const results = {
    healthOk: false,
    healthElapsedMs: 0,
    accountCreated: false,
    recoveryCodeLength: 0,
    audioUploaded: false,
    exportOk: false,
    exportBytes: 0,
    exportDurationSec: 0,
    exportBitrateKbps: 0,
    exportDecodeErrors: null,
    envExists: false,
    envKeyDefined: false,
    testsDirectoryAbsent: false,
    success: false
  };

  try {
    // 2. Resolver rutas de recursos empaquetados
    let resourcesDir = opts.resourcesPath;
    if (!resourcesDir) {
      if (process.platform === 'darwin') {
        const appBundle = opts.appPath.includes('.app')
          ? opts.appPath.substring(0, opts.appPath.indexOf('.app') + 4)
          : opts.appPath;
        resourcesDir = path.join(appBundle, 'Contents', 'Resources');
      } else {
        let realAppPath = opts.appPath;
        try {
          realAppPath = fs.realpathSync(opts.appPath);
        } catch (_) {}
        const execDir = path.dirname(realAppPath);
        if (fs.existsSync(path.join(execDir, 'resources'))) {
          resourcesDir = path.join(execDir, 'resources');
        } else if (fs.existsSync(path.join(execDir, '..', 'resources'))) {
          resourcesDir = path.join(execDir, '..', 'resources');
        }
      }
    }

    let ffmpegExe = opts.ffmpegPath;
    if (!ffmpegExe && resourcesDir) {
      const candidate = path.join(
        resourcesDir,
        'backend',
        'node_modules',
        'ffmpeg-static',
        process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
      );
      if (fs.existsSync(candidate)) {
        ffmpegExe = candidate;
      }
    }

    let envFile = opts.envPath;
    if (!envFile && resourcesDir) {
      const candidate = path.join(resourcesDir, 'backend', '.env');
      if (fs.existsSync(candidate)) {
        envFile = candidate;
      }
    }

    console.log(`[Config] Directorio de recursos: ${resourcesDir || 'No detectado automáticamente'}`);
    console.log(`[Config] Binario FFmpeg empaquetado: ${ffmpegExe || 'No detectado'}`);
    console.log(`[Config] Archivo backend/.env empaquetado: ${envFile || 'No detectado'}`);

    if (ffmpegExe && fs.existsSync(ffmpegExe)) {
      try {
        fs.chmodSync(ffmpegExe, 0o755);
      } catch (_) {}
    }

    try {
      fs.chmodSync(opts.appPath, 0o755);
    } catch (_) {}

    // 3. Paso 1: Lanzar la app empaquetada en su propio grupo de procesos y esperar /health
    console.log('[Paso 1/5] Lanzando aplicación empaquetada en grupo de procesos dedicado...');
    const launchArgs = [
      `--user-data-dir=${tempUserData}`
    ];
    if (opts.noSandbox || process.platform === 'linux') {
      launchArgs.push('--no-sandbox');
      launchArgs.push('--disable-gpu');
      launchArgs.push('--disable-dev-shm-usage');
    }

    const launchEnv = {
      ...process.env,
      PODCASTCRAFT_STORAGE_DIR: tempStorage,
      PORT: '3001',
      APPIMAGE_EXTRACT_AND_RUN: '1',
      ELECTRON_ENABLE_LOGGING: '1'
    };

    const isWindows = process.platform === 'win32';
    const startTime = Date.now();
    child = spawn(opts.appPath, launchArgs, {
      env: launchEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: !isWindows // En POSIX, se crea un grupo de procesos independiente (PGID === child.pid)
    });

    child.stdout.on('data', (d) => {
      const lines = d.toString().split('\n').filter(Boolean);
      lines.forEach(l => console.log(`  [App Out] ${l}`));
    });

    child.stderr.on('data', (d) => {
      const lines = d.toString().split('\n').filter(Boolean);
      lines.forEach(l => console.log(`  [App Err] ${l}`));
    });

    child.on('exit', (code, signal) => {
      console.log(`  [App Exit] Proceso finalizó con código ${code}, señal ${signal}`);
    });

    console.log('[Paso 1/5] Esperando backend en http://127.0.0.1:3001/health...');
    const healthDeadline = Date.now() + opts.timeoutMs;
    while (Date.now() < healthDeadline) {
      try {
        const res = await sendRequest('GET', '/health', null, {}, 5000);
        if (res.status === 200 && res.body && res.body.status === 'ok') {
          results.healthOk = true;
          results.healthElapsedMs = Date.now() - startTime;
          console.log(`  [Paso 1/5] OK! /health respondió en ${results.healthElapsedMs} ms`);
          break;
        }
      } catch (_) {
        // Reintentar en 300ms
      }
      await new Promise(r => setTimeout(r, 300));
    }

    if (!results.healthOk) {
      throw new Error(`Timeout esperando /health en backend embebido (${opts.timeoutMs} ms)`);
    }

    // 4. Paso 2: Crear cuenta de prueba por la API real
    console.log('[Paso 2/5] Creando cuenta de prueba en /api/auth/setup...');
    const setupRes = await sendRequest('POST', '/api/auth/setup', {
      username: 'smoke_user_phase28',
      password: 'SmokePassword2026!'
    }, {}, 10000);

    if (setupRes.status !== 201 || !setupRes.body || !setupRes.body.success) {
      throw new Error(`Fallo en creación de cuenta: HTTP ${setupRes.status} — ${JSON.stringify(setupRes.body)}`);
    }

    const recCode = setupRes.body.recoveryCode || '';
    const cleanRecCode = recCode.replace(/[^A-Za-z0-9]/g, '');
    results.accountCreated = true;
    results.recoveryCodeLength = cleanRecCode.length;
    console.log(`  [Paso 2/5] Cuenta creada exitosamente. Código de recuperación: ${cleanRecCode.length} caracteres`);

    if (cleanRecCode.length !== 12) {
      throw new Error(`El código de recuperación debe contener 12 caracteres (obtenidos: ${cleanRecCode.length})`);
    }

    // 5. Paso 3: Generar tonos senoidales con FFmpeg empaquetado, subirlos y exportar mezcla
    console.log('[Paso 3/5] Generando tonos senoidales con FFmpeg empaquetado...');
    if (!ffmpegExe || !fs.existsSync(ffmpegExe)) {
      throw new Error(`Binario FFmpeg empaquetado no encontrado en: "${ffmpegExe}"`);
    }

    const tone1Path = path.join(tempExport, 'tone_440.mp3');
    const tone2Path = path.join(tempExport, 'tone_880.mp3');
    generateSineWaveMp3(ffmpegExe, 440, 3, tone1Path);
    generateSineWaveMp3(ffmpegExe, 880, 4, tone2Path);

    console.log('[Paso 3/5] Subiendo tonos a POST /api/audio...');
    const up1 = await sendMultipartAudio('tone_440.mp3', fs.readFileSync(tone1Path), 15000);
    const up2 = await sendMultipartAudio('tone_880.mp3', fs.readFileSync(tone2Path), 15000);

    if (up1.status !== 201 || !up1.body || !up1.body.id) {
      throw new Error(`Fallo subiendo tono 1: status ${up1.status}`);
    }
    if (up2.status !== 201 || !up2.body || !up2.body.id) {
      throw new Error(`Fallo subiendo tono 2: status ${up2.status}`);
    }
    results.audioUploaded = true;
    console.log(`  [Paso 3/5] Audios cargados con éxito: ${up1.body.id}, ${up2.body.id}`);

    const destinationMp3 = path.join(tempExport, 'smoke_mixed_output.mp3');
    const exportPayload = {
      title: 'Smoke_Export_Mix',
      destinationPath: destinationMp3,
      tracks: [
        {
          id: 'track-lead',
          volume: 0.8,
          clips: [{ id: 'clip-1', libraryId: up1.body.id, start: 0, duration: 3 }]
        },
        {
          id: 'track-bgm',
          volume: 0.5,
          clips: [{ id: 'clip-2', libraryId: up2.body.id, start: 1.5, duration: 4 }]
        }
      ]
    };

    console.log('[Paso 3/5] Solicitando mezcla multipista a POST /api/export...');
    const exportStart = Date.now();
    const exportRes = await sendRequest('POST', '/api/export', exportPayload, {}, 35000);
    const exportDurationMs = Date.now() - exportStart;

    if (exportRes.status !== 200 || !fs.existsSync(destinationMp3)) {
      throw new Error(`Fallo en exportación: status ${exportRes.status}`);
    }

    const exportStat = fs.statSync(destinationMp3);
    results.exportOk = true;
    results.exportBytes = exportStat.size;
    console.log(`  [Paso 3/5] Mezcla generada: ${exportStat.size} bytes en ${exportDurationMs} ms`);

    // 6. Paso 4: Inspeccionar duración, bitrate y decodificación sin errores
    console.log('[Paso 4/5] Inspeccionando calidad e integridad del MP3 exportado...');
    let probeOutput = '';
    try {
      probeOutput = execSync(`"${ffmpegExe}" -i "${destinationMp3}" 2>&1`, { encoding: 'utf8' });
    } catch (err) {
      probeOutput = (err.stdout || '') + (err.stderr || '') + (err.output ? err.output.join('') : '');
    }

    const durationMatch = probeOutput.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    let durationSec = null;
    if (durationMatch) {
      durationSec = parseInt(durationMatch[1], 10) * 3600 + parseInt(durationMatch[2], 10) * 60 + parseFloat(durationMatch[3]);
      results.exportDurationSec = Number(durationSec.toFixed(2));
    }

    const bitrateMatch = probeOutput.match(/bitrate:\s*(\d+)\s*kb\/s/);
    if (bitrateMatch) {
      results.exportBitrateKbps = parseInt(bitrateMatch[1], 10);
    }

    try {
      execSync(`"${ffmpegExe}" -v error -i "${destinationMp3}" -f null -`, { stdio: 'pipe' });
      results.exportDecodeErrors = 0;
    } catch (err) {
      results.exportDecodeErrors = 1;
    }

    console.log(`  [Paso 4/5] Duración: ${results.exportDurationSec} s (esperada ~5.5 s), Bitrate: ${results.exportBitrateKbps} kbps, Errores decodificación: ${results.exportDecodeErrors}`);

    if (results.exportDecodeErrors !== 0) {
      throw new Error('La prueba de decodificación completa del MP3 con FFmpeg arrojó errores');
    }
    if (results.exportBytes < 50000) {
      throw new Error(`El archivo MP3 exportado es sospechosamente pequeño (${results.exportBytes} bytes)`);
    }

    // 7. Paso 5: Comprobar backend/.env presente y tests/ ausente
    console.log('[Paso 5/5] Verificando empaquetado seguro (.env presente, tests/ ausente)...');
    if (envFile && fs.existsSync(envFile)) {
      results.envExists = true;
      const envContent = fs.readFileSync(envFile, 'utf8');
      results.envKeyDefined = /^\s*GEMINI_API_KEY=.+$/m.test(envContent);
    }

    let testsFound = false;
    if (resourcesDir) {
      const candidateTests1 = path.join(resourcesDir, 'tests');
      const candidateTests2 = path.join(resourcesDir, 'backend', 'tests');
      const candidateTests3 = path.join(resourcesDir, 'app.asar.unpacked', 'tests');
      if (fs.existsSync(candidateTests1) || fs.existsSync(candidateTests2) || fs.existsSync(candidateTests3)) {
        testsFound = true;
      }
    }
    results.testsDirectoryAbsent = !testsFound;

    console.log(`  [Paso 5/5] backend/.env existe: ${results.envExists}, GEMINI_API_KEY definida: ${results.envKeyDefined}`);
    console.log(`  [Paso 5/5] Carpeta tests/ ausente del paquete: ${results.testsDirectoryAbsent}`);

    if (!results.envExists || !results.envKeyDefined) {
      throw new Error('El archivo backend/.env no existe en el paquete o no define GEMINI_API_KEY');
    }
    if (!results.testsDirectoryAbsent) {
      throw new Error('La carpeta tests/ fue indebidamente incluida en el paquete de producción');
    }

    results.success = (
      results.healthOk &&
      results.accountCreated &&
      results.recoveryCodeLength === 12 &&
      results.audioUploaded &&
      results.exportOk &&
      results.exportDecodeErrors === 0 &&
      results.envExists &&
      results.envKeyDefined &&
      results.testsDirectoryAbsent
    );

    console.log('\n======================================================');
    console.log('RESULTADO PRUEBA DE HUMO (SMOKE TEST): EXITOSA');
    console.log(`Target: ${opts.target}`);
    console.log(`Tiempo arranque /health: ${results.healthElapsedMs} ms`);
    console.log(`Código de recuperación: ${results.recoveryCodeLength} caracteres`);
    console.log(`MP3 exportado: ${results.exportBytes} bytes, ${results.exportDurationSec} s, ${results.exportBitrateKbps} kbps`);
    console.log(`Errores decodificación: ${results.exportDecodeErrors}`);
    console.log(`backend/.env con GEMINI_API_KEY: ${results.envKeyDefined}`);
    console.log(`tests/ ausente: ${results.testsDirectoryAbsent}`);
    console.log('======================================================\n');
  } finally {
    // 8. Cierre robusto de procesos y limpieza
    await cleanupProcesses(child, opts);

    try {
      fs.rmSync(tempBase, { recursive: true, force: true });
    } catch (_) {}
  }

  const target = opts.target || 'unknown';
  if (results.success) {
    console.log(`SMOKE_RESULT=PASS target=${target}`);
    process.exit(0);
  } else {
    console.log(`SMOKE_RESULT=FAIL target=${target}`);
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error('\n[FATAL] Error en prueba de humo:', err.message);
  let target = 'unknown';
  try {
    const opts = parseArgs();
    target = opts.target || 'unknown';
  } catch (_) {}
  console.log(`SMOKE_RESULT=FAIL target=${target}`);
  process.exit(1);
});
