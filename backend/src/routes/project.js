const express = require('express');
const { readProject, writeProject } = require('../storage');

const router = express.Router();

// GET /api/project — devuelve el proyecto persistido actual
router.get('/', async (req, res) => {
  try {
    const project = await readProject();
    res.json(project);
  } catch (error) {
    console.error('[GET /api/project] Error:', error.message);
    res.status(500).json({ error: 'No se pudo leer el proyecto almacenado.' });
  }
});

// PUT /api/project — sobrescribe el proyecto persistido con el body recibido
router.put('/', async (req, res) => {
  const body = req.body;

  // Validación básica de forma (no exhaustiva, solo lo esencial)
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'El cuerpo de la petición debe ser un objeto JSON.' });
  }
  if (!body.project || typeof body.project !== 'object') {
    return res.status(400).json({ error: 'Falta el campo "project" o no es un objeto.' });
  }
  if (!Array.isArray(body.library)) {
    return res.status(400).json({ error: 'El campo "library" debe ser un arreglo.' });
  }
  if (!Array.isArray(body.tracks)) {
    return res.status(400).json({ error: 'El campo "tracks" debe ser un arreglo.' });
  }

  try {
    const saved = await writeProject(body);
    res.json(saved);
  } catch (error) {
    console.error('[PUT /api/project] Error:', error.message);
    res.status(500).json({ error: 'No se pudo guardar el proyecto.' });
  }
});

module.exports = router;
