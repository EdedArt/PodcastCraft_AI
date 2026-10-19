const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe');
const targetScript = process.argv[2] || 'test_phase26.js';
const testScript = path.isAbsolute(targetScript) ? targetScript : path.join(__dirname, targetScript);

const runnerTempUserData = path.join(os.tmpdir(), `pc_runtests_userdata_${Date.now()}`);
fs.mkdirSync(runnerTempUserData, { recursive: true });

console.log('[Runner] Lanzando Electron:', electronPath, testScript);

const child = spawn(electronPath, [`--user-data-dir=${runnerTempUserData}`, testScript], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_ENABLE_LOGGING: '1'
  }
});

child.on('exit', (code) => {
  console.log('[Runner] Proceso Electron finalizado con código:', code);
  try {
    if (fs.existsSync(runnerTempUserData)) fs.rmSync(runnerTempUserData, { recursive: true, force: true });
  } catch (_) {}
  process.exit(code || 0);
});
