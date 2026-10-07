const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();
const audioFilesDir = path.join(__dirname, '..', 'storage', 'audio-files');

// Asegurar existencia de la carpeta de almacenamiento
if (!fs.existsSync(audioFilesDir)) {
  fs.mkdirSync(audioFilesDir, { recursive: true });
}

// Configuración de almacenamiento en disco con UUID único
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioFilesDir);
  },
  filename: (req, file, cb) => {
    const uuid = crypto.randomUUID();
    req.fileUuid = uuid;
    cb(null, `${uuid}.mp3`);
  }
});

// Filtro estricto para validar formato MP3 tanto por MIME como por extensión
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB máximo
  },
  fileFilter: (req, file, cb) => {
    const isMp3Mime = file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3';
    const isMp3Ext = file.originalname.toLowerCase().endsWith('.mp3');

    if (isMp3Mime || isMp3Ext) {
      cb(null, true);
    } else {
      const err = new Error('Solo se permiten archivos MP3 (audio/mpeg)');
      err.code = 'INVALID_FILE_TYPE';
      cb(err, false);
    }
  }
});

/**
 * POST /api/audio
 * Recibe un archivo MP3 vía multipart/form-data (campo 'file'),
 * lo persiste en storage/audio-files/ y devuelve sus metadatos básicos.
 */
router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' || err.code === 'INVALID_FILE_TYPE' ? 400 : 500;
      return res.status(status).json({
        error: err.message || 'Error al procesar el archivo de audio'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No se proporcionó ningún archivo de audio en la solicitud'
      });
    }

    const uuid = req.fileUuid;
    const originalName = req.file.originalname || 'Audio sin título';
    const cleanName = path.basename(originalName, path.extname(originalName));

    const responsePayload = {
      id: `lib-import-${uuid}`,
      name: cleanName,
      url: `/audio-files/${uuid}.mp3`,
      sizeBytes: req.file.size
    };

    return res.status(201).json(responsePayload);
  });
});

/**
 * DELETE /api/audio/:id
 * Elimina físicamente el archivo MP3 asociado de storage/audio-files/ si existe.
 */
router.delete('/:id', (req, res) => {
  try {
    const rawId = req.params.id || '';
    const uuid = rawId.replace(/^lib-import-/, '').replace(/[^a-zA-Z0-9-]/g, '');

    if (!uuid) {
      return res.status(400).json({ error: 'Identificador de archivo no válido' });
    }

    const targetPath = path.join(audioFilesDir, `${uuid}.mp3`);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return res.json({ success: true, message: `Archivo ${uuid}.mp3 eliminado exitosamente` });
    }

    return res.status(404).json({ error: 'El archivo especificado no existe en el almacenamiento' });
  } catch (err) {
    console.error('[PodcastCraft Backend] Error eliminando archivo de audio:', err);
    return res.status(500).json({ error: 'Error interno eliminando archivo de audio' });
  }
});

module.exports = router;
