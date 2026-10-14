const express = require('express');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { trimAudioForTranscription, cleanupTmpFile } = require('../utils/audioTrimmer');
const { readProject } = require('../storage');

const router = express.Router();

const AUDIO_DIR = path.join(__dirname, '..', '..', 'storage', 'audio-files');

/**
 * Esquema estructurado JSON contractual para la respuesta de Gemini.
 */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    segments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          isFiller: { type: "boolean" }
        },
        required: ["text", "startTime", "endTime", "isFiller"]
      }
    }
  },
  required: ["segments"]
};

/**
 * Resuelve la ruta física del archivo de audio a partir del libraryId o url.
 * @param {string} libraryId
 * @returns {Promise<string|null>}
 */
async function resolveAudioFilePath(libraryId) {
  if (!libraryId || typeof libraryId !== 'string') return null;

  // 1. Caso directo por UUID (con o sin prefijo 'lib-import-')
  const prefix = 'lib-import-';
  const cleanId = libraryId.startsWith(prefix) ? libraryId.slice(prefix.length) : libraryId;
  const directPath = path.join(AUDIO_DIR, `${cleanId}.mp3`);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  // 2. Si libraryId ya termina en .mp3
  const directNamePath = path.join(AUDIO_DIR, libraryId);
  if (fs.existsSync(directNamePath)) {
    return directNamePath;
  }

  // 3. Buscar en la biblioteca persistida en project.json
  try {
    const projectData = await readProject();
    if (projectData && Array.isArray(projectData.library)) {
      const match = projectData.library.find((item) => item.id === libraryId || item.name === libraryId);
      if (match && match.url) {
        const filename = path.basename(match.url);
        const resolved = path.join(AUDIO_DIR, filename);
        if (fs.existsSync(resolved)) {
          return resolved;
        }
      }
    }
  } catch (err) {
    console.warn('[aiRoutes] No se pudo leer project.json para resolver audio:', err.message);
  }

  // 4. Si es sample_podcast.mp3 en la raíz del proyecto
  const rootSamplePath = path.resolve(__dirname, '..', '..', '..', 'sample_podcast.mp3');
  if (fs.existsSync(rootSamplePath)) {
    return rootSamplePath;
  }

  return null;
}

/**
 * Obtiene o crea la instancia del cliente Gemini con configuración estructurada.
 * Soporta lista de modelos de respaldo si el principal experimenta 404/503.
 */
function getGenerativeModel(modelName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });
}

/**
 * POST /api/ai/transcribe
 * Cuerpo esperado: { libraryId: string, start: number, duration: number }
 */
router.post('/transcribe', async (req, res) => {
  const { libraryId, start = 0, duration } = req.body || {};

  // 1. Verificación de clave de API
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY no configurada en el servidor. Configura el archivo .env para habilitar la transcripción.'
    });
  }

  // 2. Validación de parámetros de entrada
  if (!libraryId) {
    return res.status(400).json({
      error: 'El parámetro libraryId es requerido para transcribir.'
    });
  }

  const startSec = Math.max(0, parseFloat(start) || 0);
  const durationSec = parseFloat(duration);
  if (isNaN(durationSec) || durationSec <= 0) {
    return res.status(400).json({
      error: 'La duración del clip debe ser un número positivo en segundos.'
    });
  }

  // 3. Resolución del archivo de audio físico
  const sourceFilePath = await resolveAudioFilePath(libraryId);
  if (!sourceFilePath) {
    return res.status(404).json({
      error: `No se encontró el archivo de audio físico para el identificador "${libraryId}".`
    });
  }

  let tmpTrimmedPath = null;

  try {
    // 4. Recorte del audio con ffmpeg a la porción exacta del clip
    tmpTrimmedPath = await trimAudioForTranscription(sourceFilePath, startSec, durationSec);

    // 5. Lectura del buffer de audio recortado en base64
    const audioBuffer = await fsPromises.readFile(tmpTrimmedPath);
    const audioBase64 = audioBuffer.toString('base64');

    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: 'audio/mp3'
      }
    };

    const promptText = `Transcribe con alta fidelidad el audio adjunto.
Instrucciones obligatorias:
1. Detecta automáticamente el idioma hablado y transcribe en ese mismo idioma (no traduzcas).
2. Divide el texto en segmentos o frases cortas (aproximadamente entre 3 y 8 palabras).
3. Cada segmento debe incluir startTime y endTime en segundos, con precisión decimal, relativos al inicio de este recorte (0.0 = inicio del audio adjunto, endTime <= ${durationSec + 0.5}).
4. Identifica muletillas o palabras de relleno habituales (por ejemplo 'eh', 'em', 'o sea', 'este', 'bueno', 'um', 'like', 'you know', etc.) y márcalas con isFiller: true. Para palabras o frases normales de la conversación, marca isFiller: false.
5. Si el audio contiene música o letra cantada, transcribe la letra de forma fiel.
6. Devuelve exclusivamente la estructura JSON solicitada en el esquema.`;

    // 6. Ejecución de la llamada a Gemini con gestión de modelos de fallback
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const fallbackModels = [
      primaryModel,
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.5-transcribe',
      'gemini-flash-latest'
    ];
    // Eliminar duplicados manteniendo orden
    const uniqueModels = [...new Set(fallbackModels)];

    let lastError = null;
    let responseText = null;

    for (const currentModel of uniqueModels) {
      try {
        const modelInstance = getGenerativeModel(currentModel);
        const result = await modelInstance.generateContent([audioPart, promptText]);
        responseText = result.response.text();
        if (responseText) {
          break; // Éxito con este modelo
        }
      } catch (geminiErr) {
        lastError = geminiErr;
        const status = geminiErr.status || (geminiErr.message?.includes('404') ? 404 : (geminiErr.message?.includes('503') ? 503 : 500));
        // Si es 401 (clave inválida) o 429 (quota excedida), salir de inmediato
        if (status === 401 || status === 429 || geminiErr.message?.includes('API_KEY_INVALID') || geminiErr.message?.includes('quota') || geminiErr.message?.includes('Resource has been exhausted')) {
          break;
        }
        // Para cualquier otro error (404, 503, fetch failed, error de socket, etc.), probar modelo alternativo
        console.warn(`[aiRoutes] Modelo ${currentModel} falló (${status} / ${geminiErr.message}). Intentando modelo alternativo...`);
        continue;
      }
    }

    if (!responseText) {
      throw lastError || new Error('No se recibió respuesta válida del modelo Gemini.');
    }

    // 7. Parseo del JSON garantizado por responseSchema
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('[aiRoutes] Error parseando respuesta JSON de Gemini:', responseText);
      return res.status(500).json({
        error: 'La respuesta de la IA no pudo ser interpretada como JSON válido.'
      });
    }

    const segments = Array.isArray(parsedData.segments) ? parsedData.segments : [];

    // Normalización de tiempos y tipos en los segmentos
    const normalizedSegments = segments.map((seg, idx) => ({
      id: `seg-${idx + 1}`,
      text: typeof seg.text === 'string' ? seg.text.trim() : '',
      startTime: typeof seg.startTime === 'number' ? Math.max(0, seg.startTime) : 0,
      endTime: typeof seg.endTime === 'number' ? Math.min(durationSec, Math.max(seg.startTime || 0, seg.endTime)) : durationSec,
      isFiller: Boolean(seg.isFiller)
    }));

    return res.json({
      success: true,
      segments: normalizedSegments,
      count: normalizedSegments.length
    });

  } catch (error) {
    console.error('[aiRoutes] Error en transcripción con Gemini:', error.message || error);

    const status = error.status;
    if (status === 401 || (error.message && error.message.includes('API_KEY_INVALID'))) {
      return res.status(401).json({
        error: 'La clave GEMINI_API_KEY no es válida o no tiene permisos en Google AI Studio.'
      });
    }

    if (status === 429 || (error.message && error.message.includes('RESOURCE_EXHAUSTED'))) {
      return res.status(429).json({
        error: 'Límite de peticiones de Gemini excedido (cuota o rate limit). Intenta nuevamente en unos instantes.'
      });
    }

    if (status === 503 || (error.message && error.message.includes('high demand'))) {
      return res.status(503).json({
        error: 'El servicio de Google Gemini se encuentra temporalmente congestionado. Intenta de nuevo en unos segundos.'
      });
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      return res.status(504).json({
        error: 'Tiempo de espera agotado al conectar con los servidores de Google Gemini.'
      });
    }

    return res.status(500).json({
      error: `Error al transcribir el audio con IA: ${error.message || 'Error interno del servidor.'}`
    });

  } finally {
    // 8. Garantía de limpieza del archivo temporal en storage/tmp/
    if (tmpTrimmedPath) {
      await cleanupTmpFile(tmpTrimmedPath);
    }
  }
});

module.exports = router;
