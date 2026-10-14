const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const crypto = require('crypto');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

// Configuración de la ruta al ejecutable estático de ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

const TMP_DIR = path.join(__dirname, '..', '..', 'storage', 'tmp');

/**
 * Asegura que el directorio temporal exista.
 */
function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

/**
 * Recorta un fragmento de audio con ffmpeg de forma no destructiva.
 * @param {string} sourceFilePath Ruta absoluta al archivo fuente MP3.
 * @param {number} startSeconds Segundo de inicio dentro del audio fuente.
 * @param {number} durationSeconds Duración en segundos del segmento a extraer.
 * @param {string} [customOutputPath] Ruta destino opcional.
 * @returns {Promise<string>} Ruta absoluta del archivo temporal generado.
 */
function trimAudioForTranscription(sourceFilePath, startSeconds, durationSeconds, customOutputPath) {
  ensureTmpDir();

  const outputPath = customOutputPath || path.join(TMP_DIR, `trim-${crypto.randomUUID()}.mp3`);
  const safeStart = Math.max(0, Number(startSeconds) || 0);
  const safeDuration = Math.max(0.1, Number(durationSeconds) || 1);

  return new Promise((resolve, reject) => {
    ffmpeg(sourceFilePath)
      .setStartTime(safeStart)
      .setDuration(safeDuration)
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('[audioTrimmer] Error recortando audio:', err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Elimina un archivo temporal de forma segura si existe.
 * @param {string} filePath
 */
async function cleanupTmpFile(filePath) {
  if (!filePath) return;
  try {
    await fsPromises.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[audioTrimmer] No se pudo eliminar el archivo temporal "${filePath}":`, err.message);
    }
  }
}

module.exports = {
  trimAudioForTranscription,
  cleanupTmpFile,
  TMP_DIR
};
