const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

function safeReadJson(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (_) {}
  return null;
}

function getUnameM() {
  try {
    return execSync('uname -m', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (_) {
    return os.arch();
  }
}

function getFileSize(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      return stat.size;
    }
  } catch (_) {}
  return null;
}

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return 'NO DISPONIBLE';
  return `${Number(bytes).toLocaleString('en-US')} bytes`;
}

function main() {
  const job = getArg('--job') || 'linux-x64';
  const unameM = getUnameM();
  const runner = process.env.RUNNER_NAME || process.env.RUNNER_OS || 'github-hosted';

  const metricsDir = path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'podcastcraft_ci');
  const distDir = path.join(process.cwd(), 'dist');

  const archCheck = safeReadJson(path.join(metricsDir, 'arch_check.json'))
    || safeReadJson(path.join(distDir, 'arch_check.json'))
    || {};

  let platform = 'NO DISPONIBLE';
  let rows = [];

  if (job === 'linux-x64') {
    platform = 'Linux x64';
    const archElectron = archCheck.electron || 'NO DISPONIBLE';
    const archFfmpeg = archCheck.ffmpeg || 'NO DISPONIBLE';

    // Target 1: appimage
    const smokeAppImage = safeReadJson(path.join(metricsDir, 'smoke_appimage.json'))
      || safeReadJson(path.join(distDir, 'smoke_appimage.json'));
    const appimageResult = smokeAppImage ? smokeAppImage.smokeResult : 'NO DISPONIBLE';
    const appimageCleanup = smokeAppImage && smokeAppImage.cleanupStage
      ? `${smokeAppImage.cleanupStage} (${smokeAppImage.cleanupElapsedMs} ms)`
      : 'NO DISPONIBLE';

    const appimageFile = path.join(distDir, 'PodcastCraft-AI-1.2.0-linux-x64.AppImage');
    const appimageSize = getFileSize(appimageFile);
    const appimageName = appimageSize !== null ? path.basename(appimageFile) : 'NO DISPONIBLE';

    rows.push({
      platform,
      runner,
      unameM,
      archElectron,
      archFfmpeg,
      target: 'appimage',
      smokeResult: appimageResult,
      cleanupStage: appimageCleanup,
      installer: appimageName,
      installerBytes: formatBytes(appimageSize)
    });

    // Target 2: deb
    const smokeDeb = safeReadJson(path.join(metricsDir, 'smoke_deb.json'))
      || safeReadJson(path.join(distDir, 'smoke_deb.json'));
    const debResult = smokeDeb ? smokeDeb.smokeResult : 'NO DISPONIBLE';
    const debCleanup = smokeDeb && smokeDeb.cleanupStage
      ? `${smokeDeb.cleanupStage} (${smokeDeb.cleanupElapsedMs} ms)`
      : 'NO DISPONIBLE';

    const debFile = path.join(distDir, 'PodcastCraft-AI-1.2.0-linux-x64.deb');
    const debSize = getFileSize(debFile);
    const debName = debSize !== null ? path.basename(debFile) : 'NO DISPONIBLE';

    rows.push({
      platform,
      runner,
      unameM,
      archElectron,
      archFfmpeg,
      target: 'deb',
      smokeResult: debResult,
      cleanupStage: debCleanup,
      installer: debName,
      installerBytes: formatBytes(debSize)
    });

  } else if (job === 'macos-arm64') {
    platform = 'macOS Apple Silicon';
    const archElectron = archCheck.electron || 'NO DISPONIBLE';
    const archFfmpeg = archCheck.ffmpeg || 'NO DISPONIBLE';

    const smokeMacArm = safeReadJson(path.join(metricsDir, 'smoke_mac-arm64.json'))
      || safeReadJson(path.join(distDir, 'smoke_mac-arm64.json'));
    const armResult = smokeMacArm ? smokeMacArm.smokeResult : 'NO DISPONIBLE';
    const armCleanup = smokeMacArm && smokeMacArm.cleanupStage
      ? `${smokeMacArm.cleanupStage} (${smokeMacArm.cleanupElapsedMs} ms)`
      : 'NO DISPONIBLE';

    const dmgFile = path.join(distDir, 'PodcastCraft-AI-1.2.0-mac-arm64.dmg');
    const dmgSize = getFileSize(dmgFile);
    const dmgName = dmgSize !== null ? path.basename(dmgFile) : 'NO DISPONIBLE';

    rows.push({
      platform,
      runner,
      unameM,
      archElectron,
      archFfmpeg,
      target: 'mac-arm64',
      smokeResult: armResult,
      cleanupStage: armCleanup,
      installer: dmgName,
      installerBytes: formatBytes(dmgSize)
    });

  } else if (job === 'macos-x64') {
    platform = 'macOS Intel';
    const archElectron = archCheck.electron || 'NO DISPONIBLE';
    const archFfmpeg = archCheck.ffmpeg || 'NO DISPONIBLE';

    const smokeMacX64 = safeReadJson(path.join(metricsDir, 'smoke_mac-x64.json'))
      || safeReadJson(path.join(distDir, 'smoke_mac-x64.json'));
    const x64Result = smokeMacX64 ? smokeMacX64.smokeResult : 'NO DISPONIBLE';
    const x64Cleanup = smokeMacX64 && smokeMacX64.cleanupStage
      ? `${smokeMacX64.cleanupStage} (${smokeMacX64.cleanupElapsedMs} ms)`
      : 'NO DISPONIBLE';

    const dmgFile = path.join(distDir, 'PodcastCraft-AI-1.2.0-mac-x64.dmg');
    const dmgSize = getFileSize(dmgFile);
    const dmgName = dmgSize !== null ? path.basename(dmgFile) : 'NO DISPONIBLE';

    rows.push({
      platform,
      runner,
      unameM,
      archElectron,
      archFfmpeg,
      target: 'mac-x64',
      smokeResult: x64Result,
      cleanupStage: x64Cleanup,
      installer: dmgName,
      installerBytes: formatBytes(dmgSize)
    });
  }

  // Generar tabla Markdown
  const markdown = [
    `### 📊 Resultados de Verificación y Empaquetado — ${platform}`,
    '',
    '| Plataforma | Runner | `uname -m` | ARCH_CHECK (Electron) | ARCH_CHECK (FFmpeg) | Target | SMOKE_RESULT | CLEANUP_STAGE | Instalador | Tamaño |',
    '| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- | ---: |'
  ];

  for (const r of rows) {
    markdown.push(`| ${r.platform} | ${r.runner} | \`${r.unameM}\` | ${r.archElectron} | ${r.archFfmpeg} | \`${r.target}\` | **${r.smokeResult}** | ${r.cleanupStage} | \`${r.installer}\` | ${r.installerBytes} |`);
  }

  markdown.push('');

  const outputText = markdown.join('\n');
  console.log(outputText);

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    try {
      fs.appendFileSync(summaryFile, outputText + '\n', 'utf8');
      console.log(`[Summary] Resumen Markdown añadido exitosamente a $GITHUB_STEP_SUMMARY (${summaryFile})`);
    } catch (err) {
      console.warn(`[Summary Warning] No se pudo escribir en $GITHUB_STEP_SUMMARY: ${err.message}`);
    }
  }
}

try {
  main();
} catch (err) {
  console.warn(`[Summary Warning] Error general generando resumen: ${err.message}`);
}
