const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const http = require('http');
const { fork, execSync } = require('child_process');

let backendProcess = null;
let mainWindow = null;
let isQuitting = false;

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
 */
function waitForBackend(url, timeoutMs = 15000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (isQuitting) {
        return reject(new Error('Aplicación en proceso de cierre'));
      }

      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      });

      req.on('error', () => {
        retry();
      });

      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    }

    function retry() {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`El backend no respondió en ${url} tras ${timeoutMs}ms`));
      } else {
        setTimeout(check, 200);
      }
    }

    check();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'PodcastCraft AI',
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.on('page-title-updated', (e) => e.preventDefault());

  const frontendPath = path.join(__dirname, '..', 'frontend', 'index.html');

  try {
    console.log(`[Electron Main] Esperando backend en ${HEALTH_URL}...`);
    await waitForBackend(HEALTH_URL, 15000);
    console.log('[Electron Main] Backend listo. Cargando interfaz...');

    await mainWindow.loadFile(frontendPath);
    mainWindow.show();
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

// Bloqueo de instancia única para evitar múltiples procesos compitiendo por el puerto 3001
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
});

app.on('window-all-closed', () => {
  isQuitting = true;
  killBackend();
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
