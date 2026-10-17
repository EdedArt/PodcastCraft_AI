const express = require('express');
const fs = require('fs');
const { mixProjectToMp3, sanitizeFilename } = require('../utils/audioMixer');

const router = express.Router();

// Aumentar límite de express.json exclusivamente para la ruta de exportación a 2 MB
router.post('/', express.json({ limit: '2mb' }), async (req, res) => {
  const { title, tracks, destinationPath } = req.body || {};

  if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
    return res.status(400).json({ error: 'El proyecto no contiene carriles para exportar.' });
  }

  const hasAnyClip = tracks.some((t) => Array.isArray(t.clips) && t.clips.length > 0);
  if (!hasAnyClip) {
    return res.status(400).json({ error: 'El proyecto no contiene clips de audio para exportar.' });
  }

  const abortController = new AbortController();
  // Corregido: escuchar en res.on('close'), ya que req.on('close') dispara en Node al consumirse el body
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  try {
    const { outputPath, filename, cleanup } = await mixProjectToMp3({
      title,
      tracks,
      destinationPath,
      cancelSignal: abortController.signal
    });

    if (destinationPath) {
      // Exportación directa al archivo destino del usuario (Electron)
      const stats = await fs.promises.stat(outputPath).catch(() => ({ size: 0 }));
      return res.json({
        success: true,
        filePath: outputPath,
        filename,
        size: stats.size
      });
    }

    const safeFilename = sanitizeFilename(title) + '.mp3';

    // res.download envía el archivo y ejecuta el callback al completarse o fallar
    res.download(outputPath, safeFilename, async (downloadErr) => {
      // Limpieza garantizada del archivo temporal en todos los casos
      await cleanup().catch(() => {});
      if (downloadErr && !res.headersSent) {
        console.error('[POST /api/export] Error enviando archivo al cliente:', downloadErr.message);
        res.status(500).json({ error: 'Error al transferir el archivo exportado.' });
      }
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error(`[POST /api/export] Fallo (${statusCode}):`, err.message);
    if (!res.headersSent) {
      res.status(statusCode).json({ error: err.message });
    }
  }
});

module.exports = router;
