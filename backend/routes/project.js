const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const storageDir = path.join(__dirname, '..', 'storage');
const projectFile = path.join(storageDir, 'project.json');
const projectTmpFile = path.join(storageDir, 'project.tmp.json');

// Estado base por defecto para inicialización
const DEFAULT_PROJECT_STATE = {
  project: {
    title: 'Untitled Project',
    status: 'saved'
  },
  library: [],
  tracks: []
};

// Asegurar existencia del directorio de almacenamiento
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

/**
 * GET /api/project
 * Retorna el estado persistido del proyecto desde storage/project.json.
 * Si el archivo no existe o está corrupto, retorna el estado por defecto.
 */
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(projectFile)) {
      return res.json(DEFAULT_PROJECT_STATE);
    }

    const raw = fs.readFileSync(projectFile, 'utf8');
    if (!raw.trim()) {
      return res.json(DEFAULT_PROJECT_STATE);
    }

    const data = JSON.parse(raw);
    return res.json(data);
  } catch (err) {
    console.error('[PodcastCraft Backend] Error leyendo project.json:', err);
    return res.status(500).json({
      error: 'Error al leer el archivo de persistencia del proyecto',
      fallback: DEFAULT_PROJECT_STATE
    });
  }
});

/**
 * PUT /api/project
 * Sobrescribe atómicamente el estado del proyecto en storage/project.json.
 * Espera { project: { title, status }, library: [...], tracks: [...] }.
 */
router.put('/', (req, res) => {
  try {
    const payload = req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Cuerpo de solicitud inválido' });
    }

    // Normalizar estructura de guardado asegurando que no se guarden campos efímeros
    const cleanProjectState = {
      project: {
        title: (payload.project && typeof payload.project.title === 'string')
          ? payload.project.title
          : 'Untitled Project',
        status: 'saved'
      },
      library: Array.isArray(payload.library)
        ? payload.library.map((item) => ({
            id: item.id,
            name: item.name,
            duration: typeof item.duration === 'number' ? item.duration : 0,
            url: item.url || ''
          }))
        : [],
      tracks: Array.isArray(payload.tracks)
        ? payload.tracks.map((track) => ({
            id: track.id,
            name: track.name || 'Carril',
            colorIndex: typeof track.colorIndex === 'number' ? track.colorIndex : 0,
            clips: Array.isArray(track.clips)
              ? track.clips.map((clip) => ({
                  id: clip.id,
                  libraryId: clip.libraryId,
                  name: clip.name,
                  start: typeof clip.start === 'number' ? clip.start : 0,
                  duration: typeof clip.duration === 'number' ? clip.duration : 0
                }))
              : []
          }))
        : []
    };

    const serialized = JSON.stringify(cleanProjectState, null, 2);

    // Escritura atómica: primero al archivo temporal y luego reemplazo
    fs.writeFileSync(projectTmpFile, serialized, 'utf8');

    try {
      fs.renameSync(projectTmpFile, projectFile);
    } catch (renameErr) {
      // Fallback para Windows en caso de bloqueo transitorio de archivo
      fs.copyFileSync(projectTmpFile, projectFile);
      try {
        fs.unlinkSync(projectTmpFile);
      } catch (_) {}
    }

    return res.json({
      success: true,
      message: 'Proyecto guardado exitosamente en el backend',
      project: cleanProjectState
    });
  } catch (err) {
    console.error('[PodcastCraft Backend] Error guardando project.json:', err);
    return res.status(500).json({
      error: 'Error interno al persistir el proyecto en disco'
    });
  }
});

module.exports = router;
