const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const router = express.Router();

const AUDIO_DIR = path.join(__dirname, '..', '..', 'storage', 'audio-files');

// Asegura que el directorio exista antes de que multer intente escribir en él
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AUDIO_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    cb(null, `${uniqueId}.mp3`);
  }
});

function mp3FileFilter(req, file, cb) {
  const isMp3Mime = file.mimetype === 'audio/mpeg';
  const isMp3Ext = file.originalname.toLowerCase().endsWith('.mp3');
  if (isMp3Mime || isMp3Ext) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos MP3.'));
  }
}

const upload = multer({
  storage,
  fileFilter: mp3FileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB, ajustable
});

// POST /api/audio — recibe un archivo MP3 en el campo "file"
router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Error al subir el archivo: ${err.message}` });
    }
    if (err) {
      // Error lanzado por mp3FileFilter u otro error no-multer
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo en el campo "file".' });
    }

    const nameWithoutExt = path.parse(req.file.originalname).name;
    const uniqueId = path.parse(req.file.filename).name; // UUID sin extensión

    res.status(201).json({
      id: `lib-import-${uniqueId}`,
      name: nameWithoutExt,
      url: `/audio-files/${req.file.filename}`,
      sizeBytes: req.file.size
    });
  });
});

// DELETE /api/audio/:id — elimina el archivo físico correspondiente
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const prefix = 'lib-import-';

  if (!id.startsWith(prefix)) {
    return res.status(400).json({ error: 'ID de audio con formato inválido.' });
  }

  const uuid = id.slice(prefix.length);
  const filename = `${uuid}.mp3`;
  const filePath = path.join(AUDIO_DIR, filename);

  // Previene path traversal: confirma que el archivo resuelto sigue dentro de AUDIO_DIR
  const resolvedPath = path.resolve(filePath);
  const resolvedAudioDir = path.resolve(AUDIO_DIR);
  if (!resolvedPath.startsWith(resolvedAudioDir)) {
    return res.status(400).json({ error: 'ID de audio inválido.' });
  }

  try {
    await fsPromises.unlink(resolvedPath);
    res.json({ deleted: true, id });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'El archivo de audio no existe.' });
    }
    console.error('[DELETE /api/audio/:id] Error:', error.message);
    res.status(500).json({ error: 'No se pudo eliminar el archivo.' });
  }
});

module.exports = router;
