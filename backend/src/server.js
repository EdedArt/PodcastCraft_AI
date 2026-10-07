const path = require('path');
const express = require('express');
const cors = require('cors');
const { readProject } = require('./storage');
const projectRoutes = require('./routes/project');
const audioRoutes = require('./routes/audio');

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Logging simple de peticiones entrantes
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// 2. CORS (abierto para desarrollo local)
app.use(cors());

// 3. Parser para cuerpos JSON
app.use(express.json());

// 4. Servir archivos de audio como estáticos
app.use('/audio-files', express.static(path.join(__dirname, '..', 'storage', 'audio-files')));

// 5. Endpoint de verificación de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 6. Rutas de API
app.use('/api/project', projectRoutes);
app.use('/api/audio', audioRoutes);

// 7. Middleware de 404 genérico para rutas no definidas (JSON consistente)
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// 8. Middleware de manejo de errores centralizado
app.use((err, req, res, next) => {
  console.error('[Error no manejado]', err.stack || err.message);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
});

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
