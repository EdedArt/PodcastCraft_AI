const express = require('express');
const { readProject } = require('./storage');
const projectRoutes = require('./routes/project');
const audioRoutes = require('./routes/audio');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para parsear cuerpos JSON
app.use(express.json());

// Endpoint de verificación de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas de API
app.use('/api/project', projectRoutes);
app.use('/api/audio', audioRoutes);

async function startServer() {
  try {
    const projectData = await readProject();
    const tracksCount = Array.isArray(projectData.tracks) ? projectData.tracks.length : 0;
    const libraryCount = Array.isArray(projectData.library) ? projectData.library.length : 0;
    console.log(`Proyecto cargado desde storage/project.json (${tracksCount} carriles, ${libraryCount} ítems en biblioteca)`);

    app.listen(PORT, () => {
      console.log(`PodcastCraft AI backend escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`[Error de arranque] No se pudo inicializar el almacenamiento del proyecto: ${error.message}`);
    process.exit(1);
  }
}

startServer();
