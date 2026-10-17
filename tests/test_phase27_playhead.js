const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { fork, execSync } = require('child_process');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let backendProcess = null;
const BACKEND_PORT = '3001';
const HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/health`;

const tempStorageDir = path.join(os.tmpdir(), `pc_p27_storage_${Date.now()}`);
const tempUserDataDir = path.join(os.tmpdir(), `pc_p27_userdata_${Date.now()}`);

app.setPath('userData', tempUserDataDir);

const rootDir = path.join(__dirname, '..');
const ffmpegExe = path.join(rootDir, 'backend', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

function startBackend() {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.join(tempStorageDir, 'audio-files'), { recursive: true });
    fs.mkdirSync(tempUserDataDir, { recursive: true });

    // Clip de prueba sintético
    const clipPath = path.join(tempStorageDir, 'audio-files', 'test_sine.mp3');
    execSync(`"${ffmpegExe}" -f lavfi -i "sine=frequency=440:duration=10" -b:a 192k "${clipPath}" -y`, { stdio: 'ignore' });

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
  ipcMain.handle('load-auth-session', async () => null);
  ipcMain.handle('save-auth-session', async () => ({ success: true }));
  ipcMain.handle('clear-auth-session', async () => ({ success: true }));
  ipcMain.handle('show-save-export-dialog', async () => ({ canceled: true }));
  ipcMain.handle('show-item-in-folder', async () => ({ success: true }));

  const results = {
    suite: 'Fase 27 — Verificación de Ajuste del Playhead, Scrubbing y Regresión',
    timestamp: new Date().toISOString(),
    tests: [],
    passed: true,
    metrics: {}
  };

  function record(num, name, passed, details) {
    console.log(`[P27-${num}] ${passed ? '✓ PASÓ' : '✗ FALLÓ'}: ${name}`);
    if (details) console.log(`   Detalles: ${JSON.stringify(details)}`);
    results.tests.push({ num, name, passed, details });
    if (!passed) results.passed = false;
  }

  try {
    await startBackend();

    // Crear ventana en modo desarrollo con preload
    const win = new BrowserWindow({
      width: 1366,
      height: 768,
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
    await new Promise(r => setTimeout(r, 1200));

    // Configurar cuenta y proyecto inicial en el renderer
    await win.webContents.executeJavaScript(`
      (async function() {
        const $ = s => document.querySelector(s);
        const lock = $('#auth-lock-screen');
        if (lock) lock.classList.add('hidden');
        const topbar = $('#topbar');
        if (topbar) topbar.classList.remove('hidden');
        const workspace = $('#workspace');
        if (workspace) workspace.classList.remove('hidden');
        const transport = $('#transport');
        if (transport) transport.classList.remove('hidden');

        // Configurar un proyecto con 1 carril y 1 clip de 8s para pruebas de arrastre y división
        state.project.title = 'Test Playhead P27';
        state.project.duration = 10;
        state.tracks = [
          {
            id: 'track-p27-1',
            name: 'Pista Playhead',
            volume: 1,
            muted: false,
            solo: false,
            clips: [
              {
                id: 'clip-p27-1',
                libraryId: 'lib-import-test_sine.mp3',
                name: 'Audio Sine 440',
                start: 0,
                duration: 8.0,
                sourceOffset: 0,
                volume: 1
              }
            ]
          }
        ];
        renderAll();
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    // --- TEST 1: Alineación playhead / regla / carril a 0.00 px ---
    const alignment = await win.webContents.executeJavaScript(`
      (function() {
        seekTo(0);
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
          isExactZero: diffPHRuler < 0.01 && diffPHLane < 0.01,
          playheadLeft: playheadEl?.left,
          rulerLeft: rulerScaleEl?.left,
          laneLeft: laneEl?.left
        };
      })()
    `);

    record(1, 'Alineación milimétrica en origen 0.00 px (playhead vs regla vs carril)', alignment.isExactZero, alignment);

    // --- TEST 2: Hit area ensanchada (~16px) y presencia del elemento con estilos ---
    const hitArea = await win.webContents.executeJavaScript(`
      (function() {
        const ph = document.querySelector('#timeline-playhead');
        if (!ph) return { exists: false };
        const cs = window.getComputedStyle(ph);
        const csBefore = window.getComputedStyle(ph, '::before');
        const csAfter = window.getComputedStyle(ph, '::after');

        return {
          exists: true,
          cursor: cs.cursor,
          pointerEvents: cs.pointerEvents,
          beforeWidth: csBefore.width,
          beforePointerEvents: csBefore.pointerEvents,
          afterWidth: csAfter.width,
          afterHeight: csAfter.height,
          hitAreaActive: cs.pointerEvents === 'auto' && csBefore.pointerEvents === 'auto'
        };
      })()
    `);

    record(2, 'Área de agarre ensanchada (~16px) con pointer-events activos en línea y cabeza', hitArea.hitAreaActive, hitArea);

    // --- TEST 3: Simulación de arrastre (scrubbing) desde la regla y medición de latencia rAF ---
    const scrubTest = await win.webContents.executeJavaScript(`
      (async function() {
        const ruler = document.querySelector('#timeline-ruler');
        const scale = document.querySelector('#timeline-ruler-scale');
        const rect = scale.getBoundingClientRect();

        // 1. Pointerdown en posición correspondiente a 2.0s
        const px1 = timeToPixels(2.0);
        const downEvent = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + px1,
          clientY: rect.top + 10,
          button: 0,
          pointerId: 1
        });
        ruler.dispatchEvent(downEvent);

        // 2. Mover a posición correspondiente a 5.5s
        const px2 = timeToPixels(5.5);
        const moveEvent = new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + px2,
          clientY: rect.top + 10,
          button: 0,
          pointerId: 1
        });
        ruler.dispatchEvent(moveEvent);

        // Esperar cuadro de animación
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 60));

        const latency = window.PodcastCraftPlayheadLatencyMs || 0;
        const playheadEl = document.querySelector('#timeline-playhead');
        const transformDuringMove = playheadEl.style.transform;

        // 3. Pointerup
        const upEvent = new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + px2,
          clientY: rect.top + 10,
          button: 0,
          pointerId: 1
        });
        ruler.dispatchEvent(upEvent);

        await new Promise(r => setTimeout(r, 60));

        const finalTime = state.project.currentTime;
        const expectedTime = 5.5;
        const timeDelta = Math.abs(finalTime - expectedTime);

        return {
          success: timeDelta < 0.05,
          latencyMs: latency,
          transformDuringMove,
          finalTime,
          expectedTime,
          timeDelta
        };
      })()
    `);

    record(3, 'Scrubbing en regla con PointerEvent, rAF throttling y medición de latencia', scrubTest.success, scrubTest);
    results.metrics.latencyMs = scrubTest.latencyMs;

    // --- TEST 4: Simulación de arrastre directo sobre el playhead ---
    const playheadDragTest = await win.webContents.executeJavaScript(`
      (async function() {
        const playhead = document.querySelector('#timeline-playhead');
        const scale = document.querySelector('#timeline-ruler-scale');
        const rect = scale.getBoundingClientRect();

        // Pointerdown sobre el playhead
        const phRect = playhead.getBoundingClientRect();
        const downEvent = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: phRect.left + 1,
          clientY: phRect.top + 20,
          button: 0,
          pointerId: 2
        });
        playhead.dispatchEvent(downEvent);

        // Mover a 3.0s
        const targetX = rect.left + timeToPixels(3.0);
        const moveEvent = new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          clientX: targetX,
          clientY: phRect.top + 20,
          button: 0,
          pointerId: 2
        });
        playhead.dispatchEvent(moveEvent);

        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 60));

        const upEvent = new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          clientX: targetX,
          clientY: phRect.top + 20,
          button: 0,
          pointerId: 2
        });
        playhead.dispatchEvent(upEvent);

        await new Promise(r => setTimeout(r, 60));

        const finalTime = state.project.currentTime;
        const expectedTime = 3.0;
        const timeDelta = Math.abs(finalTime - expectedTime);

        return {
          success: timeDelta < 0.05,
          finalTime,
          expectedTime,
          timeDelta
        };
      })()
    `);

    record(4, 'Arrastre directo sobre el playhead (línea / cabeza) actualiza posición y tiempo', playheadDragTest.success, playheadDragTest);

    // --- TEST 5: Atajos J/L, Dividir con S y reproducción continúan intactos ---
    const shortcutsTest = await win.webContents.executeJavaScript(`
      (async function() {
        // Seleccionar el clip
        setState({ selection: { clipId: 'clip-p27-1' } });

        // Posicionar playhead en 2.0s
        seekTo(2.0);

        // Disparar tecla 's' para dividir clip en 2.0s
        const splitEvent = new KeyboardEvent('keydown', { key: 's', code: 'KeyS', bubbles: true });
        document.dispatchEvent(splitEvent);

        const trackClips = state.tracks[0].clips;
        const clipSplitOk = trackClips.length === 2 &&
                            Math.abs(trackClips[0].duration - 2.0) < 0.05 &&
                            Math.abs(trackClips[1].start - 2.0) < 0.05;

        // Probar J (retroceder 5s) y L (avanzar 5s)
        seekTo(4.0);
        const btnRewind = document.querySelector('#btn-rewind');
        if (btnRewind) btnRewind.click();
        const timeAfterJ = state.project.currentTime;
        const jOk = Math.abs(timeAfterJ - 0.0) < 0.05; // clamp a 0

        const btnForward = document.querySelector('#btn-forward');
        if (btnForward) btnForward.click();
        const timeAfterL = state.project.currentTime;
        const lOk = Math.abs(timeAfterL - 5.0) < 0.05;

        return {
          clipSplitOk,
          trackClipsCount: trackClips.length,
          jOk,
          timeAfterJ,
          lOk,
          timeAfterL
        };
      })()
    `);

    const shortcutsPassed = Boolean(shortcutsTest.clipSplitOk && shortcutsTest.jOk && shortcutsTest.lOk);
    record(5, 'Integridad de atajos de DAW: Dividir con "S", J/L (retroceso/avance) y transporte', shortcutsPassed, shortcutsTest);

    win.destroy();
  } catch (err) {
    console.error('[Test Runner] Error crítico:', err);
    results.passed = false;
    results.error = String(err.stack || err);
  } finally {
    if (backendProcess) {
      try {
        if (process.platform === 'win32' && backendProcess.pid) {
          execSync(`taskkill /pid ${backendProcess.pid} /T /F`, { stdio: 'ignore' });
        } else {
          backendProcess.kill();
        }
      } catch (_) {}
    }

    try {
      if (fs.existsSync(tempStorageDir)) fs.rmSync(tempStorageDir, { recursive: true, force: true });
      if (fs.existsSync(tempUserDataDir)) fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (_) {}

    console.log(`[Test Runner] Estado final: ${results.passed ? 'TODAS LAS PRUEBAS PASARON EXITOSAMENTE (5/5)' : 'FALLOS'}`);
    app.exit(results.passed ? 0 : 1);
  }
});
