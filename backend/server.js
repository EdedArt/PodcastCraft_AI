const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const audioRoutes = require('./routes/audio');
const projectRoutes = require('./routes/project');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de rutas de almacenamiento local
const storageDir = path.join(__dirname, 'storage');
const audioFilesDir = path.join(storageDir, 'audio-files');
const projectFile = path.join(storageDir, 'project.json');

// Asegurar existencia de directorios de almacenamiento en el arranque
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
if (!fs.existsSync(audioFilesDir)) {
  fs.mkdirSync(audioFilesDir, { recursive: true });
}

// Inicializar project.json con estructura vacía por defecto si no existe
if (!fs.existsSync(projectFile)) {
  const initialProject = {
    project: {
      title: 'Untitled Project',
      status: 'saved'
    },
    library: [],
    tracks: []
  };
  fs.writeFileSync(projectFile, JSON.stringify(initialProject, null, 2), 'utf8');
}

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servidor de archivos de audio estáticos
app.use('/audio-files', express.static(audioFilesDir));

// Rutas de la API REST
app.use('/api/audio', audioRoutes);
app.use('/api/project', projectRoutes);

// Endpoint de verificación de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'podcastcraft-ai-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Manejador de ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en el backend' });
});

// Manejador centralizado de errores
app.use((err, req, res, next) => {
  console.error('[PodcastCraft Backend Error]', err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// Arranque del servidor
app.listen(PORT, () => {
  console.log(`PodcastCraft AI backend escuchando en http://localhost:${PORT}`);
});
