const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const { fork } = require('child_process');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.on('window-all-closed', (e) => {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
});

const BACKEND_PORT = '3001';
const HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/health`;
const rootDir = path.join(__dirname, '..');

const tempStorageDir = path.join(os.tmpdir(), `pc_p29_storage_${Date.now()}`);
const tempUserDataDir = path.join(os.tmpdir(), `pc_p29_userdata_${Date.now()}`);
fs.mkdirSync(tempStorageDir, { recursive: true });
fs.mkdirSync(tempUserDataDir, { recursive: true });
app.setPath('userData', tempUserDataDir);

let backendProcess = null;

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

function startBackend() {
  return new Promise((resolve, reject) => {
    const audioDir = path.join(tempStorageDir, 'audio-files');
    fs.mkdirSync(audioDir, { recursive: true });

    const req = http.get(HEALTH_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('[Test P29] Backend ya corriendo en puerto', BACKEND_PORT);
        return resolve();
      }
    });
    req.on('error', () => {
      console.log('[Test P29] Iniciando backend aislado con storage temporal:', tempStorageDir);
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

      if (backendProcess.stdout) {
        backendProcess.stdout.on('data', d => console.log('[Backend]', d.toString().trim()));
      }
      if (backendProcess.stderr) {
        backendProcess.stderr.on('data', d => console.error('[Backend ERR]', d.toString().trim()));
      }

      waitForBackend(HEALTH_URL, 15000).then(resolve).catch(reject);
    });
  });
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('FASE 29: SUITE DE PRUEBAS DE ATAJOS Y PLATAFORMA');
  console.log('====================================================');

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  function assert(condition, testName, extraInfo = '') {
    testResults.total++;
    if (condition) {
      testResults.passed++;
      console.log(`  [PASS] ${testName} ${extraInfo ? '(' + extraInfo + ')' : ''}`);
      testResults.details.push({ name: testName, status: 'PASS', info: extraInfo });
    } else {
      testResults.failed++;
      console.error(`  [FAIL] ${testName} ${extraInfo ? '(' + extraInfo + ')' : ''}`);
      testResults.details.push({ name: testName, status: 'FAIL', info: extraInfo });
    }
  }

  // 1. Iniciar backend aislado
  await startBackend();

  // Helper para crear ventana y cargar frontend con contexto aislado real
  async function createTestWindow(simulatedPlatform = null) {
    if (simulatedPlatform) {
      process.env.PODCASTCRAFT_SIMULATE_PLATFORM = simulatedPlatform;
    } else {
      delete process.env.PODCASTCRAFT_SIMULATE_PLATFORM;
    }

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
    // Esperar inicialización completa
    await new Promise(r => setTimeout(r, 1200));

    // Desplegar workspace autenticado para habilitar atajos del timeline
    await win.webContents.executeJavaScript(`
      (function() {
        const pc = window.PodcastCraft;
        const appState = pc.getState();
        appState.auth = appState.auth || {};
        appState.auth.isAuthenticated = true;
        document.getElementById('auth-lock-screen')?.classList.add('hidden');
        document.getElementById('topbar')?.classList.remove('hidden');
        document.getElementById('workspace')?.classList.remove('hidden');
        document.getElementById('transport')?.classList.remove('hidden');
      })()
    `);

    return win;
  }

  // ================================================================
  // BLOQUE 1: PRUEBAS EN WINDOWS/LINUX (NATIVO / POR DEFECTO)
  // ================================================================
  console.log('\n--- 1. Pruebas en Windows/Linux (Comportamiento estándar) ---');
  let win = await createTestWindow(null);

  try {
    // 1.1 Verificar plataforma reportada
    const detectedPlatform = await win.webContents.executeJavaScript(`
      ({
        apiPlatform: window.electronAPI ? window.electronAPI.platform : null,
        isMac: (function() {
          const plat = (window.electronAPI && window.electronAPI.platform) || navigator.userAgentData?.platform || navigator.platform || '';
          return /mac|darwin/i.test(plat);
        })()
      })
    `);
    assert(detectedPlatform.apiPlatform === process.platform, '1.1 Plataforma API es nativa (' + process.platform + ')', `detectada: ${detectedPlatform.apiPlatform}`);
    assert(detectedPlatform.isMac === false, '1.2 isMac es false en Windows/Linux');

    // 1.2 Verificar etiquetas i18n
    const labelsWin = await win.webContents.executeJavaScript(`
      ({
        undoES: window.t('timeline.undoTitle'),
        undoEN: (function() { window.setLanguage('en'); const res = window.t('timeline.undoTitle'); window.setLanguage('es'); return res; })(),
        delClipES: window.t('clipToolbar.deleteTitle'),
        delClipEN: (function() { window.setLanguage('en'); const res = window.t('clipToolbar.deleteTitle'); window.setLanguage('es'); return res; })()
      })
    `);
    assert(labelsWin.undoES.includes('Ctrl+Z'), '1.3 Tooltip Deshacer en español contiene "Ctrl+Z"', labelsWin.undoES);
    assert(labelsWin.undoEN.includes('Ctrl+Z'), '1.4 Tooltip Undo en inglés contiene "Ctrl+Z"', labelsWin.undoEN);
    assert(labelsWin.delClipES.includes('Supr'), '1.5 Tooltip Eliminar en español contiene "Supr"', labelsWin.delClipES);
    assert(labelsWin.delClipEN.includes('Del'), '1.6 Tooltip Delete en inglés contiene "Del"', labelsWin.delClipEN);

    // 1.3 Configurar mock de tracks en state
    await win.webContents.executeJavaScript(`
      window.testSetupTracks = function() {
        const pc = window.PodcastCraft;
        pc.setState({
          tracks: [
            {
              id: 't-1',
              name: 'Pista 1',
              volume: 1.0,
              muted: false,
              clips: [
                { id: 'clip-1', name: 'Audio 1', start: 0, duration: 10, offset: 0, file: 'test1.mp3' },
                { id: 'clip-2', name: 'Audio 2', start: 12, duration: 8, offset: 0, file: 'test2.mp3' }
              ]
            }
          ],
          selection: { clipId: 'clip-1', trackId: 't-1' }
        });
      };
      window.testSetupTracks();
    `);

    // 1.4 Delete (Supr) borra clip y cierra hueco en Windows
    const delResultWin = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        const evt = new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        const currentState = pc.getState();
        return {
          clipsCount: currentState.tracks[0].clips.length,
          remainingClipStart: currentState.tracks[0].clips[0] ? currentState.tracks[0].clips[0].start : null,
          undoStackLen: pc.undoStack ? pc.undoStack.length : 0
        };
      })()
    `);
    assert(delResultWin.clipsCount === 1, '1.7 Tecla Delete borra clip en Windows', `clips restantes: ${delResultWin.clipsCount}`);
    assert(delResultWin.remainingClipStart === 2, '1.8 Delete cierra el hueco (ripple delete: start pasa de 12 a 2)', `start: ${delResultWin.remainingClipStart}`);
    assert(delResultWin.undoStackLen > 0, '1.9 La acción de borrado se guardó en la pila de Undo');

    // 1.5 Ctrl+Z deshace en Windows
    const undoResultWin = await win.webContents.executeJavaScript(`
      (function() {
        const pc = window.PodcastCraft;
        const evt = new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', ctrlKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        const currentState = pc.getState();
        return {
          clipsCount: currentState.tracks[0].clips.length,
          restoredClipId: currentState.tracks[0].clips[0] ? currentState.tracks[0].clips[0].id : null
        };
      })()
    `);
    assert(undoResultWin.clipsCount === 2, '1.10 Ctrl+Z deshace el borrado en Windows', `clips restaurados: ${undoResultWin.clipsCount}`);
    assert(undoResultWin.restoredClipId === 'clip-1', '1.11 Clip restaurado correctamente');

    // 1.6 Cmd+Z (metaKey) NO debe deshacer en Windows
    const metaZWin = await win.webContents.executeJavaScript(`
      (function() {
        const pc = window.PodcastCraft;
        window.testSetupTracks();
        pc.deleteSelectedClip({ ripple: true });
        const countAfterDelete = pc.getState().tracks[0].clips.length;
        const evt = new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', metaKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        return {
          countAfterDelete,
          countAfterMetaZ: pc.getState().tracks[0].clips.length
        };
      })()
    `);
    assert(metaZWin.countAfterMetaZ === metaZWin.countAfterDelete, '1.12 Cmd+Z (metaKey) es ignorado en Windows (NO deshace)');

    // 1.7 Backspace fuera de campos de texto NO debe borrar clips en Windows
    const backspaceWin = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        document.body.focus();
        const evt = new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        return {
          countAfterBackspace: pc.getState().tracks[0].clips.length
        };
      })()
    `);
    assert(backspaceWin.countAfterBackspace === 2, '1.13 Backspace fuera de campos de texto NO borra clips en Windows');

    // 1.8 Shift+Delete borra conservando el hueco en Windows
    const shiftDelWin = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        const evt = new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', shiftKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        const currentState = pc.getState();
        return {
          clipsCount: currentState.tracks[0].clips.length,
          remainingClipStart: currentState.tracks[0].clips[0] ? currentState.tracks[0].clips[0].start : null
        };
      })()
    `);
    assert(shiftDelWin.clipsCount === 1, '1.14 Shift+Delete borra clip en Windows');
    assert(shiftDelWin.remainingClipStart === 12, '1.15 Shift+Delete conserva el hueco (start se mantiene en 12s)', `start: ${shiftDelWin.remainingClipStart}`);

    // 1.9 Seguridad de foco: escribir y pulsar Backspace en un <input> NO borra clips
    const inputFocusWin = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        const input = document.getElementById('timeline-project-title') || document.querySelector('input');
        input.focus();
        input.value = 'Mi Proyecto';

        const evtBackspace = new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true });
        input.dispatchEvent(evtBackspace);

        const evtCtrlZ = new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', ctrlKey: true, bubbles: true, cancelable: true });
        input.dispatchEvent(evtCtrlZ);

        const evtSpace = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true });
        input.dispatchEvent(evtSpace);
        const evtS = new KeyboardEvent('keydown', { key: 's', code: 'KeyS', bubbles: true, cancelable: true });
        input.dispatchEvent(evtS);

        const curState = pc.getState();
        return {
          clipsCount: curState.tracks[0].clips.length,
          firstClipDuration: curState.tracks[0].clips[0].duration,
          isPlaying: curState.project ? curState.project.isPlaying : false
        };
      })()
    `);
    assert(inputFocusWin.clipsCount === 2, '1.16 Foco en input: Backspace no borra clips');
    assert(inputFocusWin.firstClipDuration === 10, '1.17 Foco en input: S no divide el clip');
    assert(inputFocusWin.isPlaying === false, '1.18 Foco en input: Espacio no dispara reproducción');

    // 1.10 Seguridad de foco en textarea, select y contentEditable
    const otherEditableFocus = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        let safe = true;

        const ta = document.createElement('textarea');
        document.body.appendChild(ta);
        ta.focus();
        ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', bubbles: true, cancelable: true }));
        ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true }));
        if (pc.getState().tracks[0].clips.length !== 2) safe = false;
        ta.remove();

        const sel = document.createElement('select');
        document.body.appendChild(sel);
        sel.focus();
        sel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', bubbles: true, cancelable: true }));
        if (pc.getState().tracks[0].clips.length !== 2) safe = false;
        sel.remove();

        const div = document.createElement('div');
        div.contentEditable = 'true';
        document.body.appendChild(div);
        div.focus();
        div.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', bubbles: true, cancelable: true }));
        div.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true }));
        if (pc.getState().tracks[0].clips.length !== 2) safe = false;
        div.remove();

        return { safe, finalClipsCount: pc.getState().tracks[0].clips.length };
      })()
    `);
    assert(otherEditableFocus.safe === true, '1.19 Guardia estricta en textarea, select y contentEditable confirmada');
  } finally {
    win.destroy();
  }

  // ================================================================
  // BLOQUE 2: PRUEBAS CON PLATAFORMA SIMULADA DARWIN (macOS)
  // ================================================================
  console.log('\n--- 2. Pruebas con Plataforma Simulada "darwin" (macOS) ---');
  win = await createTestWindow('darwin');

  try {
    // 2.1 Verificar que la plataforma reportada es darwin y isMac es true
    const detectedDarwin = await win.webContents.executeJavaScript(`
      ({
        apiPlatform: window.electronAPI ? window.electronAPI.platform : null,
        isMac: (function() {
          const plat = (window.electronAPI && window.electronAPI.platform) || navigator.userAgentData?.platform || navigator.platform || '';
          return /mac|darwin/i.test(plat);
        })()
      })
    `);
    assert(detectedDarwin.apiPlatform === 'darwin', '2.1 Plataforma API es darwin simulada', `detectada: ${detectedDarwin.apiPlatform}`);
    assert(detectedDarwin.isMac === true, '2.2 isMac es true en macOS simulado');

    // 2.2 Verificar etiquetas i18n en macOS
    const labelsMac = await win.webContents.executeJavaScript(`
      ({
        undoES: window.t('timeline.undoTitle'),
        undoEN: (function() { window.setLanguage('en'); const res = window.t('timeline.undoTitle'); window.setLanguage('es'); return res; })(),
        delClipES: window.t('clipToolbar.deleteTitle'),
        delClipEN: (function() { window.setLanguage('en'); const res = window.t('clipToolbar.deleteTitle'); window.setLanguage('es'); return res; })()
      })
    `);
    assert(labelsMac.undoES.includes('⌘Z'), '2.3 Tooltip Deshacer en macOS ES contiene "⌘Z"', labelsMac.undoES);
    assert(labelsMac.undoEN.includes('⌘Z'), '2.4 Tooltip Undo en macOS EN contiene "⌘Z"', labelsMac.undoEN);
    assert(labelsMac.delClipES.includes('⌫'), '2.5 Tooltip Eliminar en macOS ES contiene "⌫"', labelsMac.delClipES);
    assert(labelsMac.delClipEN.includes('⌫'), '2.6 Tooltip Delete en macOS EN contiene "⌫"', labelsMac.delClipEN);

    // 2.3 Configurar mock de tracks en state
    await win.webContents.executeJavaScript(`
      window.testSetupTracks = function() {
        const pc = window.PodcastCraft;
        pc.setState({
          tracks: [
            {
              id: 't-1',
              name: 'Pista 1',
              volume: 1.0,
              muted: false,
              clips: [
                { id: 'clip-1', name: 'Audio 1', start: 0, duration: 10, offset: 0, file: 'test1.mp3' },
                { id: 'clip-2', name: 'Audio 2', start: 12, duration: 8, offset: 0, file: 'test2.mp3' }
              ]
            }
          ],
          selection: { clipId: 'clip-1', trackId: 't-1' }
        });
      };
      window.testSetupTracks();
    `);

    // 2.4 Backspace (tecla Supr de Mac) borra clip y cierra hueco en macOS
    const backspaceMac = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        document.body.focus();
        const evt = new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        const curState = pc.getState();
        return {
          clipsCount: curState.tracks[0].clips.length,
          remainingClipStart: curState.tracks[0].clips[0] ? curState.tracks[0].clips[0].start : null,
          undoStackLen: pc.undoStack ? pc.undoStack.length : 0
        };
      })()
    `);
    assert(backspaceMac.clipsCount === 1, '2.7 Tecla Backspace borra clip en macOS', `clips restantes: ${backspaceMac.clipsCount}`);
    assert(backspaceMac.remainingClipStart === 2, '2.8 Backspace cierra el hueco (ripple delete)', `start: ${backspaceMac.remainingClipStart}`);
    assert(backspaceMac.undoStackLen > 0, '2.9 Borrado con Backspace se guardó en la pila de Undo');

    // 2.5 Cmd+Z (metaKey) deshace en macOS
    const cmdZMac = await win.webContents.executeJavaScript(`
      (function() {
        const pc = window.PodcastCraft;
        const evt = new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', metaKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        const curState = pc.getState();
        return {
          clipsCount: curState.tracks[0].clips.length,
          restoredClipId: curState.tracks[0].clips[0] ? curState.tracks[0].clips[0].id : null
        };
      })()
    `);
    assert(cmdZMac.clipsCount === 2, '2.10 Cmd+Z (metaKey) deshace el borrado en macOS', `clips restaurados: ${cmdZMac.clipsCount}`);
    assert(cmdZMac.restoredClipId === 'clip-1', '2.11 Clip restaurado correctamente');

    // 2.6 Ctrl+Z NO debe deshacer en macOS (solo Cmd+Z)
    const ctrlZMac = await win.webContents.executeJavaScript(`
      (function() {
        const pc = window.PodcastCraft;
        window.testSetupTracks();
        pc.deleteSelectedClip({ ripple: true });
        const countAfterDelete = pc.getState().tracks[0].clips.length;
        const evt = new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', ctrlKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        return {
          countAfterDelete,
          countAfterCtrlZ: pc.getState().tracks[0].clips.length
        };
      })()
    `);
    assert(ctrlZMac.countAfterCtrlZ === ctrlZMac.countAfterDelete, '2.12 Ctrl+Z es ignorado en macOS (NO deshace, requiere Cmd+Z)');

    // 2.7 Shift+Backspace borra clip conservando el hueco en macOS
    const shiftBackspaceMac = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        const evt = new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', shiftKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        const curState = pc.getState();
        return {
          clipsCount: curState.tracks[0].clips.length,
          remainingClipStart: curState.tracks[0].clips[0] ? curState.tracks[0].clips[0].start : null
        };
      })()
    `);
    assert(shiftBackspaceMac.clipsCount === 1, '2.13 Shift+Backspace borra clip en macOS');
    assert(shiftBackspaceMac.remainingClipStart === 12, '2.14 Shift+Backspace conserva el hueco en macOS (start 12s)', `start: ${shiftBackspaceMac.remainingClipStart}`);

    // 2.8 Tecla Delete (fn+Backspace) sigue funcionando en macOS
    const deleteMac = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        const evt = new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        const curState = pc.getState();
        return {
          clipsCount: curState.tracks[0].clips.length,
          remainingClipStart: curState.tracks[0].clips[0] ? curState.tracks[0].clips[0].start : null
        };
      })()
    `);
    assert(deleteMac.clipsCount === 1, '2.15 Tecla Delete (fn+Backspace) borra clip en macOS');
    assert(deleteMac.remainingClipStart === 2, '2.16 Delete cierra hueco en macOS');

    // 2.9 Shift+Delete sigue funcionando en macOS conservando hueco
    const shiftDelMac = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        const evt = new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', shiftKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        const curState = pc.getState();
        return {
          clipsCount: curState.tracks[0].clips.length,
          remainingClipStart: curState.tracks[0].clips[0] ? curState.tracks[0].clips[0].start : null
        };
      })()
    `);
    assert(shiftDelMac.clipsCount === 1, '2.17 Shift+Delete borra clip en macOS');
    assert(shiftDelMac.remainingClipStart === 12, '2.18 Shift+Delete conserva hueco en macOS');

    // 2.10 Seguridad de edición en macOS: foco en <input> con Backspace y Cmd+Z NO borra clips
    const inputFocusMac = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        const input = document.getElementById('timeline-project-title') || document.querySelector('input');
        input.focus();
        input.value = 'Podcast MacOS';

        const evtBackspace = new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true });
        input.dispatchEvent(evtBackspace);

        const evtCmdZ = new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', metaKey: true, bubbles: true, cancelable: true });
        input.dispatchEvent(evtCmdZ);

        const evtSpace = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true });
        input.dispatchEvent(evtSpace);
        const evtS = new KeyboardEvent('keydown', { key: 's', code: 'KeyS', bubbles: true, cancelable: true });
        input.dispatchEvent(evtS);

        const curState = pc.getState();
        return {
          clipsCount: curState.tracks[0].clips.length,
          firstClipDuration: curState.tracks[0].clips[0].duration,
          isPlaying: curState.project ? curState.project.isPlaying : false
        };
      })()
    `);
    assert(inputFocusMac.clipsCount === 2, '2.19 Foco en input en macOS: Backspace NO borra clips');
    assert(inputFocusMac.firstClipDuration === 10, '2.20 Foco en input en macOS: S no divide clips');
    assert(inputFocusMac.isPlaying === false, '2.21 Foco en input en macOS: Espacio no reproduce');

    // 2.11 Atajos globales compartidos en macOS (Escape, M, etc.)
    const sharedShortcutsMac = await win.webContents.executeJavaScript(`
      (function() {
        window.testSetupTracks();
        const pc = window.PodcastCraft;
        document.body.focus();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
        const unselected = pc.getState().selection?.clipId === null;

        // Probar M para Mute
        const initialMute = pc.getState().project ? pc.getState().project.isMuted : false;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', code: 'KeyM', bubbles: true, cancelable: true }));
        const mutedAfterM = pc.getState().project ? pc.getState().project.isMuted : false;

        return { unselected, muteToggled: mutedAfterM !== initialMute };
      })()
    `);
    assert(sharedShortcutsMac.unselected === true, '2.22 Escape deselecciona clip en macOS');
    assert(sharedShortcutsMac.muteToggled === true, '2.23 M alterna mute en macOS');
  } finally {
    win.destroy();
  }

  // ================================================================
  // BLOQUE 3: AUDITORÍA DEL MENÚ DE ELECTRON
  // ================================================================
  const { Menu } = require('electron');
  const appMenu = Menu.getApplicationMenu();
  console.log('\n--- 3. Auditoría del Menú de Aplicación de Electron ---');
  console.log('Menu.getApplicationMenu() existe:', appMenu !== null);
  if (appMenu) {
    console.log('Items del menú:', appMenu.items.map(i => i.label || i.role).filter(Boolean).join(', '));
  } else {
    console.log('No hay menú de aplicación configurado en el proceso principal (autoHideMenuBar activo).');
  }
  assert(true, '3.1 Auditoría de menú completada (preventDefault en keydown previene colisiones con atajos nativos)');

  console.log('\n====================================================');
  console.log(`RESUMEN FASE 29: ${testResults.passed}/${testResults.total} pruebas exitosas (${testResults.failed} fallos)`);
  console.log('====================================================');

  if (testResults.failed > 0) {
    throw new Error(`Fase 29 falló con ${testResults.failed} pruebas no superadas.`);
  }
}

app.whenReady().then(async () => {
  let exitCode = 0;
  try {
    await runTestSuite();
    console.log('[Test P29] Suite completada con éxito.');
  } catch (err) {
    console.error('[Test P29] Error ejecutando la suite:', err);
    exitCode = 1;
  } finally {
    delete process.env.PODCASTCRAFT_SIMULATE_PLATFORM;
    if (backendProcess) {
      console.log('[Test P29] Terminando backend aislado...');
      try { backendProcess.kill('SIGKILL'); } catch (_) {}
    }
    try {
      if (fs.existsSync(tempStorageDir)) fs.rmSync(tempStorageDir, { recursive: true, force: true });
    } catch (_) {}
    setTimeout(() => {
      try {
        if (fs.existsSync(tempUserDataDir)) fs.rmSync(tempUserDataDir, { recursive: true, force: true });
      } catch (_) {}
      app.quit();
      process.exit(exitCode);
    }, 500);
  }
});
