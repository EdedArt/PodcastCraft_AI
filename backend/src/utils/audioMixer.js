const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const crypto = require('crypto');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { AUDIO_DIR, TMP_DIR } = require('../storage');

// Configurar ruta al ejecutable empaquetado de ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Asegura que el directorio temporal exista.
 */
function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

/**
 * Resuelve un libraryId al archivo físico correspondiente en AUDIO_DIR con protección contra path traversal.
 * @param {string} libraryId
 * @returns {string} Ruta absoluta del archivo de audio.
 */
function resolveAudioFilePath(libraryId) {
  if (!libraryId || typeof libraryId !== 'string') {
    throw new Error('ID de audio no especificado o inválido.');
  }

  const prefix = 'lib-import-';
  const rawId = libraryId.startsWith(prefix) ? libraryId.slice(prefix.length) : libraryId;
  const filename = rawId.toLowerCase().endsWith('.mp3') ? rawId : `${rawId}.mp3`;
  const filePath = path.join(AUDIO_DIR, filename);

  const resolvedPath = path.resolve(filePath);
  const resolvedAudioDir = path.resolve(AUDIO_DIR);

  // Protección estricta contra Path Traversal
  if (!resolvedPath.startsWith(resolvedAudioDir)) {
    const err = new Error(`Acceso no autorizado al archivo: ${libraryId}`);
    err.statusCode = 400;
    throw err;
  }

  if (!fs.existsSync(resolvedPath)) {
    const err = new Error(`El archivo de audio para "${libraryId}" no fue encontrado en el servidor.`);
    err.statusCode = 404;
    err.libraryId = libraryId;
    throw err;
  }

  return resolvedPath;
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
      console.warn(`[audioMixer] No se pudo eliminar el archivo temporal "${filePath}":`, err.message);
    }
  }
}

/**
 * Sanitiza un título para usarlo como nombre de archivo en Windows y metadato ID3.
 * @param {string} title
 * @returns {string}
 */
function sanitizeFilename(title) {
  if (!title || typeof title !== 'string') {
    return 'Mi_Podcast';
  }
  const clean = title.replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim();
  return clean || 'Mi_Podcast';
}

// Bandera para asegurar una sola exportación a la vez (evita saturación de CPU)
let isExportInProgress = false;

/**
 * Mezcla múltiples pistas y clips en un archivo MP3 estéreo unificado con ffmpeg.
 * 
 * Reglas de mezcla:
 * - Cada clip: atrim (sourceOffset -> sourceOffset + duration) + asetpts=PTS-STARTPTS
 * - aformat=sample_rates=44100:channel_layouts=stereo (unifica mono/estéreo a 44.1kHz)
 * - volume = clip.volume × track.volume
 * - adelay hasta clip.start (en milisegundos)
 * - amix con normalize=0 (evita reducción artificial de ganancia por N canales)
 * - alimiter suave para evitar distorsión dura (clipping digital)
 * 
 * @param {object} options
 * @param {string} [options.title] Título del proyecto
 * @param {Array} options.tracks Carriles con clips y volúmenes
 * @param {object} [options.cancelSignal] Señal para abortar ffmpeg si el cliente desconecta
 * @returns {Promise<{ outputPath: string, filename: string, cleanup: Function }>}
 */
async function mixProjectToMp3({ title, tracks, cancelSignal }) {
  if (isExportInProgress) {
    const err = new Error('Ya hay una exportación en curso. Por favor espera a que finalice.');
    err.statusCode = 429;
    throw err;
  }

  if (!Array.isArray(tracks) || tracks.length === 0) {
    const err = new Error('El proyecto no contiene carriles para exportar.');
    err.statusCode = 400;
    throw err;
  }

  // Extraer todos los clips con sus parámetros normalizados
  const clipsToProcess = [];
  for (const track of tracks) {
    const trackVol = typeof track.volume === 'number' ? Math.max(0, track.volume) : 1;
    for (const clip of (track.clips || [])) {
      const clipVol = typeof clip.volume === 'number' ? Math.max(0, clip.volume) : 1;
      const start = Math.max(0, Number(clip.start) || 0);
      const duration = Math.max(0.01, Number(clip.duration) || 0);
      const sourceOffset = Math.max(0, Number(clip.sourceOffset) || 0);
      const effectiveVol = Math.round(clipVol * trackVol * 1000) / 1000;

      // Resuelve el archivo en disco (arroja 404 si falta)
      const filePath = resolveAudioFilePath(clip.libraryId);

      clipsToProcess.push({
        filePath,
        libraryId: clip.libraryId,
        start,
        duration,
        sourceOffset,
        volume: effectiveVol
      });
    }
  }

  if (clipsToProcess.length === 0) {
    const err = new Error('El proyecto no contiene clips de audio para exportar.');
    err.statusCode = 400;
    throw err;
  }

  ensureTmpDir();
  const safeTitle = sanitizeFilename(title);
  const outputFilename = `${safeTitle}.mp3`;
  const outputPath = path.join(TMP_DIR, `export-${crypto.randomUUID()}.mp3`);

  isExportInProgress = true;

  return new Promise((resolve, reject) => {
    let command = ffmpeg();
    let aborted = false;

    // Conectar señal de cancelación si se provee
    if (cancelSignal) {
      cancelSignal.addEventListener('abort', () => {
        aborted = true;
        try {
          command.kill('SIGKILL');
        } catch (_) {}
        cleanupTmpFile(outputPath);
        isExportInProgress = false;
        const err = new Error('Exportación cancelada por el cliente.');
        err.statusCode = 499;
        reject(err);
      });
    }

    // 1. Agregar cada clip como entrada independiente de ffmpeg
    for (const clip of clipsToProcess) {
      command = command.input(clip.filePath);
    }

    // 2. Construir la cadena de filtros complex
    const filterParts = [];
    const clipLabels = [];

    clipsToProcess.forEach((clip, idx) => {
      const inLabel = `${idx}:a`;
      const outLabel = `c${idx}`;
      clipLabels.push(`[${outLabel}]`);

      const trimStart = clip.sourceOffset.toFixed(4);
      const trimEnd = (clip.sourceOffset + clip.duration).toFixed(4);
      const delayMs = Math.max(0, Math.round(clip.start * 1000));

      const filter = `[${inLabel}]atrim=${trimStart}:${trimEnd},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo,volume=${clip.volume},adelay=${delayMs}|${delayMs}[${outLabel}]`;
      filterParts.push(filter);
    });

    if (clipsToProcess.length === 1) {
      filterParts.push(`[c0]alimiter=limit=1.0:attack=5:release=50[out]`);
    } else {
      filterParts.push(`${clipLabels.join('')}amix=inputs=${clipsToProcess.length}:normalize=0:duration=longest[mixed]`);
      filterParts.push(`[mixed]alimiter=limit=1.0:attack=5:release=50[out]`);
    }

    // 3. Configurar codificación MP3 estéreo 192 kbps y metadatos ID3
    command
      .complexFilter(filterParts, ['out'])
      .outputOptions([
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
        '-ar', '44100',
        '-ac', '2',
        '-id3v2_version', '3'
      ])
      .outputOption('-metadata', `title=${safeTitle}`)
      .output(outputPath)
      .on('start', (cmdLine) => {
        console.log(`[audioMixer] ffmpeg cmdLine: ${cmdLine}`);
      })
      .on('end', () => {
        isExportInProgress = false;
        if (aborted) return;
        resolve({
          outputPath,
          filename: outputFilename,
          cleanup: () => cleanupTmpFile(outputPath)
        });
      })
      .on('error', (err) => {
        isExportInProgress = false;
        cleanupTmpFile(outputPath);
        if (aborted) return;
        console.error('[audioMixer] Error durante la mezcla con ffmpeg:', err.message);
        const serverErr = new Error(`Error en el procesamiento de audio: ${err.message}`);
        serverErr.statusCode = 500;
        reject(serverErr);
      })
      .run();
  });
}

module.exports = {
  mixProjectToMp3,
  resolveAudioFilePath,
  cleanupTmpFile,
  sanitizeFilename,
  TMP_DIR
};
