const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { readProject, readAuth, AUDIO_DIR } = require('./storage');
const projectRoutes = require('./routes/project');
const audioRoutes = require('./routes/audio');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const exportRoutes = require('./routes/export');

// Salir limpiamente si el proceso padre (Electron) se desconecta
process.on('disconnect', () => {
  console.log('[Servidor embebido] Proceso padre desconectado. Saliendo...');
  process.exit(0);
});

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

// 2. CORS (abierto para desarrollo local y Electron)
app.use(cors());

// 3. Parser JSON específico con límite estricto de 2 KB para autenticación (Fase 26)
// Se monta ANTES del express.json() global para que peticiones excesivas se rechacen con 413 de inmediato
app.use('/api/auth', express.json({ limit: '2kb' }));
app.use('/api/auth', (err, req, res, next) => {
  if (err && (err.status === 413 || err.type === 'entity.too.large')) {
    return res.status(413).json({ error: 'El tamaño de la petición excede el límite permitido (máximo 2 KB).' });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Cuerpo JSON inválido o malformado.' });
  }
  next(err);
});

// 4. Parser para cuerpos JSON global
app.use(express.json());

// 5. Servir archivos de audio como estáticos
app.use('/audio-files', express.static(AUDIO_DIR));

// 6. Endpoint de verificación de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 7. Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/export', exportRoutes);

// 8. Middleware de 404 genérico para rutas no definidas (JSON consistente)
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// 9. Middleware de manejo de errores centralizado
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

    const authData = await readAuth();
    const userCount = Array.isArray(authData.users) ? authData.users.length : 0;
    console.log(`Estado de autenticación local: ${userCount > 0 ? `Configurado (${userCount} cuenta(s))` : 'Sin configurar (primer uso)'}`);

    if (!process.env.GEMINI_API_KEY) {
      console.warn('[Advertencia de IA] GEMINI_API_KEY no configurada — la transcripción con IA no funcionará hasta que se configure .env');
    } else {
      console.log(`[IA Gemini] Integración activa con modelo "${process.env.GEMINI_MODEL || 'gemini-3.5-flash'}"`);
    }

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`PodcastCraft AI backend escuchando en http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error(`[Error de arranque] No se pudo inicializar el almacenamiento del proyecto: ${error.message}`);
    process.exit(1);
  }
}

startServer();
