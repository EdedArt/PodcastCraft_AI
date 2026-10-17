const { app, BrowserWindow, dialog, ipcMain, screen, shell, session } = require('electron');
const path = require('path');
const http = require('http');
const fsPromises = require('fs').promises;
const { fork, execSync } = require('child_process');

let backendProcess = null;
let mainWindow = null;
let isQuitting = false;

// Deshabilitar aceleración por hardware para prevenir caídas del proceso GPU en Windows (código -1073741819)
app.disableHardwareAcceleration();

// Permitir reproducción fluida de Web Audio API sin requerir gesto previo por documento
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const BACKEND_PORT = process.env.PORT || '3001';
const HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/health`;

function getStorageDirectory() {
  if (process.env.PODCASTCRAFT_STORAGE_DIR) {
    return process.env.PODCASTCRAFT_STORAGE_DIR;
  }
  return app.isPackaged
    ? path.join(app.getPath('userData'), 'storage')
    : path.join(__dirname, '..', 'backend', 'storage');
}

function startBackend() {
  const backendEntry = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'src', 'server.js')
    : path.join(__dirname, '..', 'backend', 'src', 'server.js');

  const backendCwd = app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '..', 'backend');

  const storageDir = getStorageDirectory();

  console.log('[Electron Main] Iniciando backend embebido...');
  console.log(`[Electron Main] Ruta del servidor: ${backendEntry}`);
  console.log(`[Electron Main] Directorio de almacenamiento: ${storageDir}`);

  backendProcess = fork(backendEntry, [], {
    cwd: backendCwd,
    silent: false,
    windowsHide: true,
    env: {
      ...process.env,
      PORT: BACKEND_PORT,
      PODCASTCRAFT_STORAGE_DIR: storageDir,
      ELECTRON_RUN_AS_NODE: '1'
    }
  });

  backendProcess.on('error', (err) => {
    console.error('[Electron Main] Error al iniciar backend embebido:', err);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`[Electron Main] Proceso de backend finalizado (código: ${code}, señal: ${signal})`);
    backendProcess = null;
  });
}

function killBackend() {
  if (backendProcess && !backendProcess.killed) {
    console.log('[Electron Main] Terminando proceso backend embebido...');
    try {
      if (process.platform === 'win32' && backendProcess.pid) {
        // En Windows, taskkill /pid /T /F termina el proceso y todos sus subprocesos
        execSync(`taskkill /pid ${backendProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch (e) {
      // Proceso ya terminado o no alcanzable
    }
    backendProcess = null;
  }
}

/**
 * Sondea el endpoint GET /health hasta que responda 200 OK o expire el timeout.
 * Implementa un temporizador único sin fugas de sockets y con un margen de 30 segundos.
 */
function waitForBackend(url, timeoutMs = 30000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    let resolved = false;
    let retryTimer = null;

    function cleanup() {
      resolved = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    }

    function check() {
      if (resolved || isQuitting) return;

      const req = http.get(url, (res) => {
        res.resume(); // Consumir stream inmediatamente para liberar el socket
        if (res.statusCode === 200) {
          const elapsed = Date.now() - startTime;
          cleanup();
          resolve(elapsed);
        } else {
          scheduleRetry();
        }
      });

      req.on('error', () => {
        scheduleRetry();
      });

      req.setTimeout(2000, () => {
        req.destroy();
        scheduleRetry();
      });
    }

    function scheduleRetry() {
      if (resolved || isQuitting) return;
      if (Date.now() - startTime > timeoutMs) {
        cleanup();
        reject(new Error(`El backend no respondió en ${url} tras ${timeoutMs}ms`));
      } else if (!retryTimer) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          check();
        }, 200);
      }
    }

    check();
  });
}

async function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workAreaSize;
  const targetWidth = Math.min(1440, Math.max(1024, Math.floor(workArea.width * 0.95)));
  const targetHeight = Math.min(900, Math.max(580, Math.floor(workArea.height * 0.95)));

  mainWindow = new BrowserWindow({
    title: 'PodcastCraft AI',
    width: targetWidth,
    height: targetHeight,
    minWidth: 960,
    minHeight: 540,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.on('page-title-updated', (e) => e.preventDefault());

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message}`);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[Electron Main] Render process gone:', details);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Electron Main] Fallo al cargar interfaz:', errorCode, errorDescription);
  });

  function showAndActivate() {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.center();
    mainWindow.show();
    mainWindow.focus();

    // En Windows, setAlwaysOnTop breve garantiza que la ventana
    // pase al frente si el proceso se inició en segundo plano
    mainWindow.setAlwaysOnTop(true);
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(false);

    const bounds = mainWindow.getBounds();
    const display = screen.getDisplayMatching(bounds);
    const hwndBuf = mainWindow.getNativeWindowHandle();
    const hwndDec = process.arch === 'x64' ? hwndBuf.readBigInt64LE(0).toString() : hwndBuf.readInt32LE(0).toString();
    const hwndHex = '0x' + (process.arch === 'x64' ? hwndBuf.readBigInt64LE(0).toString(16) : hwndBuf.readInt32LE(0).toString(16));

    console.log(`[Electron Main] Ventana activa: "${mainWindow.getTitle()}"`);
    console.log(`[Electron Main] Visible: ${mainWindow.isVisible()}`);
    console.log(`[Electron Main] MainWindowHandle (HWND): ${hwndDec} (${hwndHex})`);
    console.log(`[Electron Main] Monitor: ${display.id} (${display.bounds.width}x${display.bounds.height}, Primario: ${display.id === primaryDisplay.id})`);
    console.log(`[Electron Main] Bounds: x=${bounds.x}, y=${bounds.y}, w=${bounds.width}, h=${bounds.height}`);
  }

  mainWindow.once('ready-to-show', () => {
    console.log('[Electron Main] Evento ready-to-show recibido.');
    showAndActivate();
  });

  const frontendPath = path.join(__dirname, '..', 'frontend', 'index.html');

  try {
    console.log(`[Electron Main] Esperando backend en ${HEALTH_URL} (timeout máx: 30000ms)...`);
    const elapsed = await waitForBackend(HEALTH_URL, 30000);
    console.log(`[Electron Main] Backend listo en ${elapsed}ms. Cargando interfaz...`);

    await mainWindow.loadFile(frontendPath);
    console.log('[Electron Main] Archivo frontend index.html cargado con éxito.');
    showAndActivate();
  } catch (error) {
    console.error('[Electron Main] Fallo al inicializar el backend:', error.message);
    if (!isQuitting) {
      dialog.showErrorBox(
        'PodcastCraft AI',
        `No fue posible iniciar el servidor interno de PodcastCraft AI:\n${error.message}\n\nPor favor intenta reiniciar la aplicación.`
      );
      app.quit();
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Manejo de diálogo nativo de guardado PREVIO a la mezcla (Fase 26d)
ipcMain.handle('show-save-export-dialog', async (event, options) => {
  const { defaultName } = options || {};
  const parentWindow = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  let defaultDir;
  try {
    defaultDir = app.getPath('music') || app.getPath('documents');
  } catch (_) {
    defaultDir = app.getPath('documents');
  }
  const defaultPath = path.join(defaultDir, defaultName || 'Mi_Podcast.mp3');

  const result = await dialog.showSaveDialog(parentWindow, {
    title: 'Exportar MP3',
    defaultPath,
    filters: [
      { name: 'Audio MP3 (*.mp3)', extensions: ['mp3'] },
      { name: 'Todos los archivos (*.*)', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }
  return { canceled: false, filePath: result.filePath };
});

// Mostrar archivo exportado en el Explorador de Windows (Fase 26d)
ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  if (filePath && typeof filePath === 'string') {
    try {
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (err) {
      console.error('[Electron Main] Error al abrir carpeta contenedora:', err.message);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Ruta no válida.' };
});

// Persistencia durable de sesión "Recordarme" (Fase 26d)
function getAuthSessionFilePath() {
  const userDataDir = app.getPath('userData');
  return path.join(userDataDir, 'auth_session.json');
}

ipcMain.handle('save-auth-session', async (event, sessionData) => {
  try {
    const sessionFile = getAuthSessionFilePath();
    const tmpFile = sessionFile + '.tmp';
    const jsonStr = JSON.stringify(sessionData || {}, null, 2);
    await fsPromises.writeFile(tmpFile, jsonStr, 'utf8');
    await fsPromises.rename(tmpFile, sessionFile);
    if (session.defaultSession) {
      await session.defaultSession.flushStorageData().catch(() => {});
    }
    return { success: true };
  } catch (err) {
    console.error('[Electron Main] Error guardando auth_session durable:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-auth-session', async () => {
  try {
    const sessionFile = getAuthSessionFilePath();
    const data = await fsPromises.readFile(sessionFile, 'utf8');
    return JSON.parse(data);
  } catch (_) {
    return null;
  }
});

ipcMain.handle('clear-auth-session', async () => {
  try {
    const sessionFile = getAuthSessionFilePath();
    await fsPromises.unlink(sessionFile).catch(() => {});
    if (session.defaultSession) {
      await session.defaultSession.flushStorageData().catch(() => {});
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Manejo de diálogo nativo de Windows para guardar la exportación MP3 (compatibilidad hacia atrás)
ipcMain.handle('save-exported-file', async (event, payload) => {
  const { defaultName, buffer } = payload || {};
  const parentWindow = BrowserWindow.fromWebContents(event.sender) || mainWindow;

  const result = await dialog.showSaveDialog(parentWindow, {
    title: 'Exportar MP3',
    defaultPath: defaultName || 'Mi_Podcast.mp3',
    filters: [
      { name: 'Audio MP3 (*.mp3)', extensions: ['mp3'] },
      { name: 'Todos los archivos (*.*)', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  try {
    const rawData = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    await fsPromises.writeFile(result.filePath, rawData);
    return { success: true, filePath: result.filePath };
  } catch (writeErr) {
    console.error('[Electron Main] Error guardando archivo exportado:', writeErr);
    return { success: false, error: writeErr.message };
  }
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    startBackend();
    await createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  killBackend();
  if (session.defaultSession) {
    session.defaultSession.flushStorageData().catch(() => {});
  }
});

app.on('window-all-closed', () => {
  isQuitting = true;
  killBackend();
  if (session.defaultSession) {
    session.defaultSession.flushStorageData().catch(() => {});
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('exit', () => {
  killBackend();
});

process.on('SIGINT', () => {
  killBackend();
  process.exit(0);
});

process.on('SIGTERM', () => {
  killBackend();
  process.exit(0);
});
