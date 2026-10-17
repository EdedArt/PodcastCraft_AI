const { spawn } = require('child_process');
const path = require('path');

const electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
const testScript = path.join(__dirname, 'test_phase23.js');

console.log('[Runner] Lanzando Electron:', electronPath, testScript);

const child = spawn(electronPath, [testScript], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_ENABLE_LOGGING: '1'
  }
});

child.on('exit', (code) => {
  console.log('[Runner] Proceso Electron finalizado con código:', code);
  process.exit(code || 0);
});
