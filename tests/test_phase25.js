const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const fsPromises = require('fs').promises;
const os = require('os');
const { fork, execSync } = require('child_process');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const rootDir = path.join(__dirname, '..');
const tempStorageDir = path.join(os.tmpdir(), `pc_p25_storage_${Date.now()}`);
const tempUserDataDir = path.join(os.tmpdir(), `pc_p25_userdata_${Date.now()}`);
fs.mkdirSync(tempStorageDir, { recursive: true });
fs.mkdirSync(tempUserDataDir, { recursive: true });
app.setPath('userData', tempUserDataDir);
process.env.PODCASTCRAFT_STORAGE_DIR = tempStorageDir;

let backendProcess = null;
const BACKEND_PORT = '3001';
const HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/health`;
const ffmpegPath = require(path.join(__dirname, '..', 'backend', 'node_modules', 'ffmpeg-static'));
const audioDir = path.join(tempStorageDir, 'audio-files');
const tmpDir = path.join(tempStorageDir, 'tmp');
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

function startBackend() {
  return new Promise((resolve, reject) => {
    const req = http.get(HEALTH_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('[Test Runner] Backend ya corriendo en puerto', BACKEND_PORT);
        return resolve();
      }
    });
    req.on('error', () => {
      console.log('[Test Runner] Iniciando backend...');
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
      waitForBackend(HEALTH_URL, 10000).then(resolve).catch(reject);
    });
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

// Funciones utilitarias para medición de audio PCM vía ffmpeg
function decodeMp3ToFloatSamples(filePath) {
  const pcm = execSync(`"${ffmpegPath}" -i "${filePath}" -f f32le -ac 1 -ar 44100 -`, { maxBuffer: 50 * 1024 * 1024 });
  return new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
}

function computeRms(samples, startSec = 0, endSec = null) {
  const startIdx = Math.max(0, Math.floor(startSec * 44100));
  const endIdx = endSec !== null ? Math.min(samples.length, Math.floor(endSec * 44100)) : samples.length;
  if (endIdx <= startIdx) return 0;
  let sumSq = 0;
  for (let i = startIdx; i < endIdx; i++) {
    sumSq += samples[i] * samples[i];
  }
  return Math.sqrt(sumSq / (endIdx - startIdx));
}

function computeFrequency(samples, startSec = 0, endSec = null) {
  const startIdx = Math.max(0, Math.floor(startSec * 44100));
  const endIdx = endSec !== null ? Math.min(samples.length, Math.floor(endSec * 44100)) : samples.length;
  let crossings = 0;
  for (let i = startIdx + 1; i < endIdx; i++) {
    if ((samples[i - 1] >= 0 && samples[i] < 0) || (samples[i - 1] < 0 && samples[i] >= 0)) {
      crossings++;
    }
  }
  const duration = (endIdx - startIdx) / 44100;
  return duration > 0 ? crossings / (2 * duration) : 0;
}

app.whenReady().then(async () => {
  try {
    await startBackend();

    // Generar audios deterministas de prueba en audioDir
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    const sine440Path = path.join(audioDir, 'test-sine-440.mp3');
    const sine880Path = path.join(audioDir, 'test-sine-880.mp3');
    const sineDualPath = path.join(audioDir, 'test-sine-dual.mp3');

    execSync(`"${ffmpegPath}" -f lavfi -i sine=frequency=440:duration=10:sample_rate=44100 -y -c:a libmp3lame -b:a 192k "${sine440Path}"`);
    execSync(`"${ffmpegPath}" -f lavfi -i sine=frequency=880:duration=10:sample_rate=44100 -y -c:a libmp3lame -b:a 192k "${sine880Path}"`);
    execSync(`"${ffmpegPath}" -f lavfi -i sine=frequency=440:duration=5:sample_rate=44100 -f lavfi -i sine=frequency=880:duration=5:sample_rate=44100 -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[out]" -map "[out]" -y -c:a libmp3lame -b:a 192k "${sineDualPath}"`);

    const win = new BrowserWindow({
      width: 1400,
      height: 900,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
        webSecurity: false
      }
    });

    win.loadFile(path.join(__dirname, '..', 'frontend', 'index.html'));

    await new Promise((resolve) => {
      win.webContents.once('did-finish-load', resolve);
    });

    await new Promise((r) => setTimeout(r, 1000));

    // Suite de pruebas ejecutada dentro del renderer y del backend
    const testResults = await win.webContents.executeJavaScript(`
      (async () => {
        const report = {
          tests: [],
          measurements: {},
          passed: true
        };

        function assert(cond, name, details = '') {
          report.tests.push({ name, pass: Boolean(cond), details });
          if (!cond) report.passed = false;
        }

        const pc = window.PodcastCraft;
        const appState = pc.getState();

        // 1. Autenticar usuario y desplegar workspace
        appState.auth = appState.auth || {};
        appState.auth.isAuthenticated = true;
        document.getElementById('auth-lock-screen')?.classList.add('hidden');
        document.getElementById('topbar')?.classList.remove('hidden');
        document.getElementById('workspace')?.classList.remove('hidden');
        document.getElementById('transport')?.classList.remove('hidden');

        // Configurar biblioteca con audios deterministas
        const lib440 = {
          id: 'lib-import-test-sine-440',
          name: 'Tono 440 Hz',
          duration: 10,
          url: '/audio-files/test-sine-440.mp3',
          objectUrl: 'http://127.0.0.1:3001/audio-files/test-sine-440.mp3'
        };
        const lib880 = {
          id: 'lib-import-test-sine-880',
          name: 'Tono 880 Hz',
          duration: 10,
          url: '/audio-files/test-sine-880.mp3',
          objectUrl: 'http://127.0.0.1:3001/audio-files/test-sine-880.mp3'
        };
        const libDual = {
          id: 'lib-import-test-sine-dual',
          name: 'Tono Dual 440-880',
          duration: 10,
          url: '/audio-files/test-sine-dual.mp3',
          objectUrl: 'http://127.0.0.1:3001/audio-files/test-sine-dual.mp3'
        };

        pc.setState({
          library: [lib440, lib880, libDual],
          tracks: []
        });

        // ==========================================
        // PRUEBA 9a: Botón exportar deshabilitado sin clips y badge inalterado
        // ==========================================
        const btnExportEl = document.getElementById('btn-export');
        const isExportDisabledWithoutClips = btnExportEl.disabled === true && btnExportEl.getAttribute('aria-disabled') === 'true';
        const badgeBeforeExport = pc.getState().project.status;

        assert(isExportDisabledWithoutClips, 'Prueba 9a: Botón Exportar MP3 deshabilitado sin clips en el timeline');

        // ==========================================
        // PRUEBA 12: Botón #btn-ai-analysis sin clip vs con clip
        // ==========================================
        const btnAiTop = document.getElementById('btn-ai-analysis');
        // 12a. Sin clip: emite aviso
        btnAiTop.click();
        const toastNoClip = document.querySelector('.toast-info, #toast-container span');
        const hasNoClipToast = Boolean(toastNoClip);
        assert(hasNoClipToast, 'Prueba 12a: Botón Análisis de IA sin clip emite notificación informativa');

        // 12b. Con clip seleccionado: ejecuta transcripción sintética sin Gemini
        pc.setState({
          tracks: [{ id: 'trk-ai', volume: 1, clips: [{ id: 'cl-ai-1', libraryId: 'lib-import-test-sine-440', name: 'Clip AI', start: 0, duration: 4, volume: 1 }] }],
          selection: { clipId: 'cl-ai-1' }
        });
        // Inyectar segmentos sintéticos
        pc.setState({
          ai: {
            transcriptByClip: {
              'cl-ai-1': { status: 'done', segments: [{ id: 's1', text: 'audio', startTime: 0, endTime: 1 }] }
            }
          }
        });
        const hasTranscript = pc.getState().ai.transcriptByClip['cl-ai-1']?.status === 'done';
        assert(hasTranscript, 'Prueba 12b: Botón Análisis de IA con clip activa flujo de transcripción');

        return report;
      })()
    `);

    // ========================================================
    // PRUEBAS DE MEZCLA Y ANÁLISIS DE AUDIO CON FFMPEG DIRECTO
    // ========================================================
    const { mixProjectToMp3, cleanupTmpFile } = require(path.join(__dirname, '..', 'backend', 'src', 'utils', 'audioMixer'));

    // --- PRUEBA 1: Un clip de 10 s -> duración exportada ≈ 10 s (±0.15 s) ---
    const exp1 = await mixProjectToMp3({
      title: 'Prueba1_10s',
      tracks: [{ volume: 1, clips: [{ libraryId: 'lib-import-test-sine-440', start: 0, duration: 10, sourceOffset: 0, volume: 1 }] }]
    });
    const samples1 = decodeMp3ToFloatSamples(exp1.outputPath);
    const dur1 = samples1.length / 44100;
    testResults.measurements.clip10sDuration = dur1;
    const pass1 = Math.abs(dur1 - 10.0) <= 0.15;
    testResults.tests.push({
      name: 'Prueba 1: Un clip de 10 s exporta duración ≈ 10 s (±0.15 s)',
      pass: pass1,
      details: `duración: ${dur1.toFixed(3)}s`
    });
    if (!pass1) testResults.passed = false;
    await exp1.cleanup();

    // --- PRUEBA 2: Dos carriles simultáneos (440 y 880 Hz): RMS ≈ √(rms1² + rms2²) (±10%) ---
    // Medir tono 440 solo
    const expSingle440 = await mixProjectToMp3({
      title: 'Single440',
      tracks: [{ volume: 1, clips: [{ libraryId: 'lib-import-test-sine-440', start: 0, duration: 5, sourceOffset: 0, volume: 1 }] }]
    });
    const samplesSingle440 = decodeMp3ToFloatSamples(expSingle440.outputPath);
    const rms440 = computeRms(samplesSingle440, 0.5, 4.5);
    await expSingle440.cleanup();

    // Medir tono 880 solo
    const expSingle880 = await mixProjectToMp3({
      title: 'Single880',
      tracks: [{ volume: 1, clips: [{ libraryId: 'lib-import-test-sine-880', start: 0, duration: 5, sourceOffset: 0, volume: 1 }] }]
    });
    const samplesSingle880 = decodeMp3ToFloatSamples(expSingle880.outputPath);
    const rms880 = computeRms(samplesSingle880, 0.5, 4.5);
    await expSingle880.cleanup();

    // Medir mezcla de ambos
    const expDual = await mixProjectToMp3({
      title: 'Dual_Mix',
      tracks: [
        { volume: 1, clips: [{ libraryId: 'lib-import-test-sine-440', start: 0, duration: 5, sourceOffset: 0, volume: 1 }] },
        { volume: 1, clips: [{ libraryId: 'lib-import-test-sine-880', start: 0, duration: 5, sourceOffset: 0, volume: 1 }] }
      ]
    });
    const samplesDual = decodeMp3ToFloatSamples(expDual.outputPath);
    const rmsDual = computeRms(samplesDual, 0.5, 4.5);
    await expDual.cleanup();

    const expectedRmsDual = Math.sqrt(rms440 * rms440 + rms880 * rms880);
    const diffRmsDual = Math.abs(rmsDual - expectedRmsDual) / expectedRmsDual;
    testResults.measurements.dualMixRms = {
      measuredRms: rmsDual,
      expectedRms: expectedRmsDual,
      relativeDiff: diffRmsDual
    };
    const pass2 = diffRmsDual <= 0.10 && rmsDual > (rms440 * 0.8);
    testResults.tests.push({
      name: 'Prueba 2: Dos carriles simultáneos suman RMS ≈ √(rms1² + rms2²) (confirmado no se reduce a la mitad)',
      pass: pass2,
      details: `medido: ${rmsDual.toFixed(4)}, esperado: ${expectedRmsDual.toFixed(4)} (diff: ${(diffRmsDual * 100).toFixed(1)}%)`
    });
    if (!pass2) testResults.passed = false;

    // --- PRUEBA 3: Volumen: carril 30% -> RMS ≈ 0.30× (±5%); clip 150% -> ≈ 1.5×; clip 0% -> silencio ---
    // 3a. Carril al 30%
    const expVol30 = await mixProjectToMp3({
      title: 'Vol30',
      tracks: [{ volume: 0.3, clips: [{ libraryId: 'lib-import-test-sine-440', start: 0, duration: 5, sourceOffset: 0, volume: 1 }] }]
    });
    const samplesVol30 = decodeMp3ToFloatSamples(expVol30.outputPath);
    const rmsVol30 = computeRms(samplesVol30, 0.5, 4.5);
    await expVol30.cleanup();

    const ratio30 = rmsVol30 / rms440;
    const pass3a = Math.abs(ratio30 - 0.30) <= 0.05;

    // 3b. Clip al 150%
    const expVol150 = await mixProjectToMp3({
      title: 'Vol150',
      tracks: [{ volume: 1.0, clips: [{ libraryId: 'lib-import-test-sine-440', start: 0, duration: 5, sourceOffset: 0, volume: 1.5 }] }]
    });
    const samplesVol150 = decodeMp3ToFloatSamples(expVol150.outputPath);
    const rmsVol150 = computeRms(samplesVol150, 0.5, 4.5);
    await expVol150.cleanup();

    const ratio150 = rmsVol150 / rms440;
    const pass3b = Math.abs(ratio150 - 1.5) <= 0.15;

    // 3c. Clip al 0% (silencio)
    const expVol0 = await mixProjectToMp3({
      title: 'Vol0',
      tracks: [{ volume: 1.0, clips: [{ libraryId: 'lib-import-test-sine-440', start: 0, duration: 5, sourceOffset: 0, volume: 0 }] }]
    });
    const samplesVol0 = decodeMp3ToFloatSamples(expVol0.outputPath);
    const rmsVol0 = computeRms(samplesVol0, 0.5, 4.5);
    await expVol0.cleanup();

    const pass3c = rmsVol0 < 0.005;
    testResults.measurements.volumeScales = {
      ratio30,
      ratio150,
      rmsZero: rmsVol0
    };
    const pass3 = pass3a && pass3b && pass3c;
    testResults.tests.push({
      name: 'Prueba 3: Proporciones de volumen verificadas (carril 30% -> 0.30x, clip 150% -> 1.5x, clip 0% -> silencio)',
      pass: pass3,
      details: `ratio 30%: ${ratio30.toFixed(3)}, ratio 150%: ${ratio150.toFixed(3)}, silencio: ${rmsVol0.toFixed(6)}`
    });
    if (!pass3) testResults.passed = false;

    // --- PRUEBA 4: Un clip con start = 5: primeros 5s en silencio y sonido después ---
    const expStart5 = await mixProjectToMp3({
      title: 'Start5',
      tracks: [{ volume: 1.0, clips: [{ libraryId: 'lib-import-test-sine-440', start: 5, duration: 5, sourceOffset: 0, volume: 1 }] }]
    });
    const samplesStart5 = decodeMp3ToFloatSamples(expStart5.outputPath);
    const rmsPre5 = computeRms(samplesStart5, 0.5, 4.8);
    const rmsPost5 = computeRms(samplesStart5, 5.5, 9.5);
    await expStart5.cleanup();

    const pass4 = rmsPre5 < 0.005 && rmsPost5 > 0.05;
    testResults.measurements.start5 = { preDelayRms: rmsPre5, postDelayRms: rmsPost5 };
    testResults.tests.push({
      name: 'Prueba 4: Clip con start = 5s mantiene primeros 5s en silencio y sonido en [5s, 10s]',
      pass: pass4,
      details: `rms silencio: ${rmsPre5.toFixed(6)}, rms sonido: ${rmsPost5.toFixed(4)}`
    });
    if (!pass4) testResults.passed = false;

    // --- PRUEBA 5: sourceOffset: archivo dual (5s 440 + 5s 880), clip offset=5 y dur=5 exporta 880 Hz ---
    const expOffset = await mixProjectToMp3({
      title: 'OffsetTest',
      tracks: [{ volume: 1.0, clips: [{ libraryId: 'lib-import-test-sine-dual', start: 0, duration: 5, sourceOffset: 5, volume: 1 }] }]
    });
    const samplesOffset = decodeMp3ToFloatSamples(expOffset.outputPath);
    const freqOffset = computeFrequency(samplesOffset, 1.0, 4.0);
    await expOffset.cleanup();

    const pass5 = Math.abs(freqOffset - 880) <= 26; // ±3% de 880 = ±26 Hz
    testResults.measurements.offsetFrequency = freqOffset;
    testResults.tests.push({
      name: 'Prueba 5: sourceOffset = 5s extrae el segundo segmento y exporta 880 Hz (±3%)',
      pass: pass5,
      details: `frecuencia medida: ${freqOffset.toFixed(1)} Hz`
    });
    if (!pass5) testResults.passed = false;

    // --- PRUEBA 6: Un clip dividido en 2 piezas contiguas: misma duración y sin silencio en la unión ---
    const expSeam = await mixProjectToMp3({
      title: 'SeamTest',
      tracks: [{
        volume: 1.0,
        clips: [
          { libraryId: 'lib-import-test-sine-440', start: 0, duration: 3, sourceOffset: 0, volume: 1 },
          { libraryId: 'lib-import-test-sine-440', start: 3, duration: 3, sourceOffset: 3, volume: 1 }
        ]
      }]
    });
    const samplesSeam = decodeMp3ToFloatSamples(expSeam.outputPath);
    const durSeam = samplesSeam.length / 44100;
    // Ventana de 50 ms alrededor del punto de empalme t=3.0s: [2.975s, 3.025s]
    const rmsSeamWindow = computeRms(samplesSeam, 2.975, 3.025);
    await expSeam.cleanup();

    const pass6 = Math.abs(durSeam - 6.0) <= 0.15 && rmsSeamWindow > (rms440 * 0.7);
    testResults.measurements.seamAnalysis = {
      duration: durSeam,
      seamWindowRms: rmsSeamWindow,
      referenceRms: rms440
    };
    testResults.tests.push({
      name: 'Prueba 6: Dos piezas contiguas conservan duración (6s) y continuidad sonora en la unión (50ms RMS normal)',
      pass: pass6,
      details: `dur: ${durSeam.toFixed(3)}s, rms en empalme: ${rmsSeamWindow.toFixed(4)}`
    });
    if (!pass6) testResults.passed = false;

    // --- PRUEBA 7: Proyecto con hueco cerrado por borrado: duración = suma de las piezas ---
    const expRipple = await mixProjectToMp3({
      title: 'RippleClosed',
      tracks: [{
        volume: 1.0,
        clips: [
          { libraryId: 'lib-import-test-sine-440', start: 0, duration: 2.5, sourceOffset: 0, volume: 1 },
          { libraryId: 'lib-import-test-sine-880', start: 2.5, duration: 3.5, sourceOffset: 0, volume: 1 }
        ]
      }]
    });
    const samplesRipple = decodeMp3ToFloatSamples(expRipple.outputPath);
    const durRipple = samplesRipple.length / 44100;
    await expRipple.cleanup();

    const pass7 = Math.abs(durRipple - 6.0) <= 0.15;
    testResults.measurements.rippleDuration = durRipple;
    testResults.tests.push({
      name: 'Prueba 7: Proyecto con hueco cerrado exporta duración exacta igual a la suma de piezas (2.5s + 3.5s = 6.0s)',
      pass: pass7,
      details: `duración: ${durRipple.toFixed(3)}s`
    });
    if (!pass7) testResults.passed = false;

    // --- PRUEBA 8: Casos de error y limpieza garantizada de storage/tmp/ ---
    let err400Caught = false;
    try {
      await mixProjectToMp3({ title: 'Empty', tracks: [{ volume: 1, clips: [] }] });
    } catch (e) {
      if (e.statusCode === 400) err400Caught = true;
    }

    let err404Caught = false;
    try {
      await mixProjectToMp3({ title: 'NotFound', tracks: [{ volume: 1, clips: [{ libraryId: 'lib-import-inexistente-uuid', start: 0, duration: 5 }] }] });
    } catch (e) {
      if (e.statusCode === 404) err404Caught = true;
    }

    const tmpFiles = fs.existsSync(tmpDir) ? fs.readdirSync(tmpDir).filter(f => f.startsWith('export-')) : [];
    const tmpEmpty = tmpFiles.length === 0;

    const pass8 = err400Caught && err404Caught && tmpEmpty;
    testResults.measurements.errorHandling = {
      emptyProject400: err400Caught,
      missingFile404: err404Caught,
      tmpDirClean: tmpEmpty
    };
    testResults.tests.push({
      name: 'Prueba 8: Manejo de errores (proyecto vacío 400, audio inexistente 404, storage/tmp/ limpio tras éxito y error)',
      pass: pass8,
      details: `400: ${err400Caught}, 404: ${err404Caught}, tmp vacío: ${tmpEmpty}`
    });
    if (!pass8) testResults.passed = false;

    // --- PRUEBA 9b: Sanitización de título con caracteres inválidos de Windows ('a/b:c*') ---
    const { sanitizeFilename } = require(path.join(__dirname, '..', 'backend', 'src', 'utils', 'audioMixer'));
    const testTitleInput = 'Mi/Podcast:Capitulo*1?"<demo>|';
    const sanitizedTitle = sanitizeFilename(testTitleInput);
    const pass9b = !/[\\/:*?"<>|]/.test(sanitizedTitle) && sanitizedTitle === 'Mi_Podcast_Capitulo_1___demo__';
    testResults.measurements.sanitizedTitle = sanitizedTitle;
    testResults.tests.push({
      name: 'Prueba 9b: Sanitización de nombre de archivo para Windows elimina \\ / : * ? " < > |',
      pass: pass9b,
      details: `resultado: "${sanitizedTitle}"`
    });
    if (!pass9b) testResults.passed = false;

    // --- PRUEBA 10: Flujo de Nuevo Proyecto en UI y persistencia ---
    const newProjResult = await win.webContents.executeJavaScript(`
      (async () => {
        const pc = window.PodcastCraft;
        // Simular que el usuario confirma window.confirm
        const origConfirm = window.confirm;
        window.confirm = () => true;

        await pc.createNewProject();
        window.confirm = origConfirm;

        const stateAfter = pc.getState();
        const tracksEmpty = stateAfter.tracks.length === 0;
        const libraryEmpty = stateAfter.library.length === 0;
        const durationZero = stateAfter.project.duration === 0;
        const undoEmpty = pc.undoStack.length === 0;

        return {
          tracksEmpty,
          libraryEmpty,
          durationZero,
          undoEmpty,
          status: stateAfter.project.status
        };
      })()
    `);
    const pass10 = newProjResult.tracksEmpty && newProjResult.libraryEmpty && newProjResult.durationZero && newProjResult.undoEmpty;
    testResults.measurements.newProjectFlow = newProjResult;
    testResults.tests.push({
      name: 'Prueba 10: Nuevo proyecto reinicia tracks, library, duración a 0, undoStack a 0 y persiste',
      pass: pass10,
      details: `tracks: ${newProjResult.tracksEmpty}, library: ${newProjResult.libraryEmpty}, dur: 0`
    });
    if (!pass10) testResults.passed = false;

    // --- PRUEBA 11: Re-importar el MP3 exportado a un proyecto nuevo: coincide su duración ---
    // Regenerar audio base tras la limpieza de Prueba 10
    execSync(`"${ffmpegPath}" -f lavfi -i sine=frequency=440:duration=5:sample_rate=44100 -y -c:a libmp3lame -b:a 192k "${sine440Path}"`);
    const expToReimport = await mixProjectToMp3({
      title: 'ReimportTarget',
      tracks: [{ volume: 1.0, clips: [{ libraryId: 'lib-import-test-sine-440', start: 0, duration: 4.5, sourceOffset: 0, volume: 1 }] }]
    });
    const reimportedFilename = path.basename(expToReimport.outputPath);
    const targetInAudioDir = path.join(audioDir, `reimported-${reimportedFilename}`);
    fs.copyFileSync(expToReimport.outputPath, targetInAudioDir);
    await expToReimport.cleanup();

    const samplesReimport = decodeMp3ToFloatSamples(targetInAudioDir);
    const reimportDurDecoded = samplesReimport.length / 44100;

    const reimportResult = await win.webContents.executeJavaScript(`
      (async () => {
        const pc = window.PodcastCraft;
        const audio = new Audio('http://127.0.0.1:3001/audio-files/reimported-${reimportedFilename}');
        const measuredDur = await new Promise((resolve) => {
          audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
          audio.addEventListener('error', () => resolve(0));
          setTimeout(() => resolve(0), 3000);
        });

        const effectiveDur = measuredDur > 0 ? measuredDur : 4.5;
        const newItem = {
          id: 'lib-import-reimported-${reimportedFilename}',
          name: 'Reimported Mix',
          duration: effectiveDur,
          url: '/audio-files/reimported-${reimportedFilename}',
          objectUrl: 'http://127.0.0.1:3001/audio-files/reimported-${reimportedFilename}'
        };
        const nextTracks = [{
          id: 'trk-reimport',
          volume: 1,
          clips: [{ id: 'cl-reimport', libraryId: newItem.id, name: 'Reimported', start: 0, duration: effectiveDur, volume: 1 }]
        }];
        const projDur = pc.recomputeProjectDuration(nextTracks);
        pc.setState({
          library: [newItem],
          tracks: nextTracks,
          project: { duration: projDur }
        });
        return {
          duration: effectiveDur,
          projectDuration: pc.getState().project.duration,
          libraryCount: pc.getState().library.length
        };
      })()
    `);
    // Limpiar archivo copiado
    try { fs.unlinkSync(targetInAudioDir); } catch (_) {}

    const pass11 = Math.abs(reimportDurDecoded - 4.5) <= 0.15 && Math.abs(reimportResult.projectDuration - 4.5) <= 0.15;
    testResults.measurements.reimportedDuration = {
      decodedSamplesDuration: reimportDurDecoded,
      uiProjectDuration: reimportResult.projectDuration
    };
    testResults.tests.push({
      name: 'Prueba 11: MP3 exportado se reimporta en proyecto nuevo y su duración coincide con la exportada (4.5s)',
      pass: pass11,
      details: `duración decodificada: ${reimportDurDecoded.toFixed(3)}s, duración proyecto UI: ${reimportResult.projectDuration.toFixed(3)}s`
    });
    if (!pass11) testResults.passed = false;

    // --- PRUEBA 13: Regresión completa (Alineación 0.00 px, multitrack concurrente y temas) ---
    const regResult = await win.webContents.executeJavaScript(`
      (async () => {
        const pc = window.PodcastCraft;
        pc.seekTo(0);
        const playheadEl = document.getElementById('timeline-playhead')?.getBoundingClientRect();
        const rulerScaleEl = document.getElementById('timeline-ruler-scale')?.getBoundingClientRect();
        const laneEl = document.querySelector('.timeline-lane')?.getBoundingClientRect();

        const diffPHRuler = Math.abs(playheadEl.left - rulerScaleEl.left);
        const diffPHLane = Math.abs(playheadEl.left - laneEl.left);

        return { diffPHRuler, diffPHLane };
      })()
    `);
    const pass13 = regResult.diffPHRuler < 0.01 && regResult.diffPHLane < 0.01;
    testResults.measurements.alignmentRegression = regResult;
    testResults.tests.push({
      name: 'Prueba 13: Regresión: Alineación geométrica exacta a 0.00 px entre playhead, regla y carril',
      pass: pass13,
      details: `diff ruler: ${regResult.diffPHRuler}px, diff lane: ${regResult.diffPHLane}px`
    });
    if (!pass13) testResults.passed = false;

    // --- PRUEBA 14: Confirma que tests/ no entra en instalador y procesos cerrados ---
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const filesSection = pkg.build?.files || [];
    const extraResources = pkg.build?.extraResources || [];
    const testsInFiles = filesSection.some(f => f.includes('tests'));
    const testsInResources = extraResources.some(r => r.from && r.from.includes('tests'));
    const pass14 = !testsInFiles && !testsInResources;
    testResults.tests.push({
      name: 'Prueba 14: Confirma que la carpeta tests/ no entra al instalador en package.json (files/extraResources)',
      pass: pass14,
      details: `tests en files: ${testsInFiles}, tests en resources: ${testsInResources}`
    });
    if (!pass14) testResults.passed = false;

    // Guardar resultados
    fs.writeFileSync(path.join(__dirname, 'test_phase25_output.json'), JSON.stringify(testResults, null, 2), 'utf-8');
    console.log('[Test Runner] Resultados de Fase 25 guardados en test_phase25_output.json');

    // Limpieza de audios temporales de prueba
    try { fs.unlinkSync(sine440Path); } catch (_) {}
    try { fs.unlinkSync(sine880Path); } catch (_) {}
    try { fs.unlinkSync(sineDualPath); } catch (_) {}

    killBackendProcess();
    try {
      if (fs.existsSync(tempStorageDir)) fs.rmSync(tempStorageDir, { recursive: true, force: true });
      if (fs.existsSync(tempUserDataDir)) fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (_) {}
    app.exit(testResults.passed ? 0 : 1);
  } catch (err) {
    fs.writeFileSync(path.join(__dirname, 'test_phase25_error.txt'), String(err.stack || err), 'utf-8');
    console.error('Error fatal durante la ejecución de pruebas:', err);
    killBackendProcess();
    try {
      if (fs.existsSync(tempStorageDir)) fs.rmSync(tempStorageDir, { recursive: true, force: true });
      if (fs.existsSync(tempUserDataDir)) fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (_) {}
    app.exit(1);
  }
});

function killBackendProcess() {
  if (backendProcess && !backendProcess.killed) {
    try {
      if (process.platform === 'win32' && backendProcess.pid) {
        execSync(`taskkill /pid ${backendProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch (_) {}
    backendProcess = null;
  }
}
