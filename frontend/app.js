/**
 * ==========================================================================
 * PodcastCraft AI — Archivo Principal de Lógica de Interfaz
 * SPRINT 6: Reestructuración Frontend/Backend + Persistencia Real
 * ==========================================================================
 */

/* ==========================================================================
   1. CONSTANTS
   ========================================================================== */

/**
 * URL base del backend Express local (Sprint 6).
 * Nota: En el empaquetado final con Electron (Sprint 7), backend y frontend
 * compartirán proceso local y esta constante se adaptará o unificará.
 */
const API_BASE_URL = 'http://localhost:3001';

/**
 * Ancho mínimo de pantalla soportado sin advertencia (en píxeles).
 */
const MIN_VIEWPORT_WIDTH = 1280;

/**
 * Configuración de etiquetas y estilos para el badge de estado del proyecto.
 */
const PROJECT_STATUS = {
  draft: {
    label: 'Borrador',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-400'
  },
  saved: {
    label: 'Guardado',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-400'
  }
};

/**
 * Paleta cromática unificada para carriles y clips (Fase 23: todos de un solo color).
 * Regla de oro: No incluye violet-500 puro para respetar el color reservado a IA/Play.
 */
const TRACK_PALETTE = [
  { lane: 'timeline-lane', clip: 'timeline-clip', dot: 'bg-sky-500' }
];

/**
 * Escala base de tiempo para la línea de tiempo (píxeles por segundo a zoom 50%).
 */
const PIXELS_PER_SECOND_BASE = 4;

/**
 * Tipo MIME contractual estandarizado para Drag & Drop entre la biblioteca y el timeline.
 */
const DRAG_MIME = 'application/x-podcastcraft-block';


/* ==========================================================================
   2. STATE
   ========================================================================== */

/**
 * Estado reactivo central — Sprint 4: Carriles dinámicos e importación de MP3 reales.
 */
const state = {
  project: {
    title: 'Untitled Project',
    status: 'draft',
    duration: 0,              // Se recalcula dinámicamente con recomputeProjectDuration()
    currentTime: 0,
    isPlaying: false,
    zoom: 50,                 // 0–100
    volume: 80,               // 0–100
    isMuted: false
  },
  library: [],                 // { id, name, duration, objectUrl, icon: 'file-audio', isImported: true }
  ui: {
    draggingLibraryId: null   // ID de audio arrastrándose actualmente
  },
  tracks: [],                  // Inicia VACÍO (0 a N carriles dinámicos)
  selection: {
    clipId: null,             // ID del clip activo en el timeline
    libraryId: null           // ID de la tarjeta seleccionada en la biblioteca
  },
  ai: {
    transcriptByClip: {}, // { [clipId]: { status: 'idle'|'processing'|'done', segments: [...] } }
    isMassCleaning: false
  }
};



/* ==========================================================================
   3. STORE
   ========================================================================== */

const listeners = new Set();

/**
 * Obtiene una referencia de solo lectura del estado global.
 * @returns {typeof state}
 */
function getState() {
  return state;
}

/**
 * Actualiza el estado mediante mezcla (merge) por sección y notifica suscriptores
 * entregando (state, prevState) para renderizado selectivo de alta eficiencia.
 * @param {Partial<typeof state>} patch
 */
function setState(patch) {
  if (!patch || typeof patch !== 'object') return;

  // Snapshot del estado previo para permitir comparaciones diferenciales
  const prevState = {
    ...state,
    project: { ...state.project },
    ui: { ...state.ui },
    selection: { ...state.selection },
    ai: {
      ...state.ai,
      transcriptByClip: { ...(state.ai?.transcriptByClip || {}) }
    },
    library: state.library,
    tracks: state.tracks
  };

  for (const key of Object.keys(patch)) {
    if (
      state[key] &&
      typeof state[key] === 'object' &&
      !Array.isArray(state[key]) &&
      typeof patch[key] === 'object' &&
      !Array.isArray(patch[key])
    ) {
      state[key] = { ...state[key], ...patch[key] };
    } else {
      state[key] = patch[key];
    }
  }

  listeners.forEach((listener) => {
    try {
      listener(state, prevState);
    } catch (error) {
      console.error('[PodcastCraft AI] Error en suscriptor del store:', error);
    }
  });
}

/**
 * Suscribe una función al cambio de estado.
 * @param {(currentState: typeof state, prevState?: typeof state) => void} fn
 * @returns {() => void} Función para desuscribirse
 */
function subscribe(fn) {
  if (typeof fn === 'function') {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  return () => {};
}

// Exposición pública en consola para pruebas, inspección y calificación académica
window.PodcastCraft = {
  getState,
  setState,
  subscribe,
  PROJECT_STATUS,
  TRACK_PALETTE,
  DRAG_MIME,
  PIXELS_PER_SECOND_BASE,
  createTrack,
  deleteTrack,
  calculateDropStart,
  resolveDropStart: (track, desiredStart, clipDuration) => resolveDropStart(track, desiredStart, clipDuration),
  getPlayheadTime: () => getPlayheadTime(),
  recomputeProjectDuration: () => recomputeProjectDuration(),
  getPixelsPerSecond: () => getPixelsPerSecond(),
  timeToPixels: (sec) => timeToPixels(sec),
  pixelsToTime: (px) => pixelsToTime(px),
  renderTimelineRuler: () => renderTimelineRuler(),
  seekTo: (sec) => seekTo(sec),
  startPlayheadLoop: () => startPlayheadLoop(),
  saveProjectToBackend: () => saveProjectToBackend(),
  loadProjectFromBackend: () => loadProjectFromBackend(),
  scheduleAutoSave: () => scheduleAutoSave(),
  get audioContext() { return getAudioContext(); },
  get audioBufferCache() { return audioBufferCache; },
  get activeAudioSources() { return activeAudioSources; },
  getTransportTime: () => getTransportTime(),
  startPlayback: (fromTime) => startPlayback(fromTime),
  pausePlayback: () => pausePlayback(),
  togglePlay: () => togglePlay(),
  getCurrentLanguage: () => (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'es'),
  setLanguage: (lang) => (typeof setLanguage === 'function' ? setLanguage(lang) : null),
  t: (key) => (typeof t === 'function' ? t(key) : key),
  applyTranslations: () => (typeof applyTranslations === 'function' ? applyTranslations() : null),
  transcribeSelectedClip: () => transcribeSelectedClip(),
  toggleSegmentMark: (clipId, segId) => toggleSegmentMark(clipId, segId),
  confirmSegmentCleanup: (clipId) => confirmSegmentCleanup(clipId),
  cleanAllFillers: (clipId) => cleanAllFillers(clipId),
  computeKeptRanges: (clipDuration, removedRanges) => computeKeptRanges(clipDuration, removedRanges),
  executeIntervalSubtraction: (clipId, removedRanges) => executeIntervalSubtraction(clipId, removedRanges),
  renderAiPanel: () => renderAiPanel(),
  showToast: (msg, type) => showToast(msg, type),
  renderClipToolbar: () => renderClipToolbar(),
  undo: () => undo(),
  pushUndoSnapshot: () => pushUndoSnapshot(),
  get undoStack() { return undoStack; },
  get trackGainNodes() { return trackGainNodes; },
  getTrackGain: (trackId) => trackGainNodes.get(trackId),
  getActiveClipGains: (clipId) => activeAudioSources.filter((s) => s.clipId === clipId).map((s) => s.clipGain),
  setTrackVolume: (trackId, vol) => {
    const v = clamp(vol, 0, 2);
    if (audioContext) {
      const tg = trackGainNodes.get(trackId);
      if (tg) tg.gain.setTargetAtTime(v, audioContext.currentTime, 0.01);
    }
    const nextTracks = state.tracks.map((t) => (t.id === trackId ? { ...t, volume: v } : t));
    setState({ tracks: nextTracks });
  },
  setClipVolume: (clipId, vol) => {
    const v = clamp(vol, 0, 2);
    if (audioContext) {
      for (const item of activeAudioSources) {
        if (item.clipId === clipId && item.clipGain) {
          item.clipGain.gain.setTargetAtTime(v, audioContext.currentTime, 0.01);
        }
      }
    }
    const nextTracks = state.tracks.map((t) => ({
      ...t,
      clips: (t.clips || []).map((c) => (c.id === clipId ? { ...c, volume: v } : c))
    }));
    setState({ tracks: nextTracks });
  }
};
window.renderAiPanel = renderAiPanel;


/* ==========================================================================
   4. UTILS
   ========================================================================== */

/**
 * Calcula la posición de inicio (en segundos) de un clip al soltarlo en un carril (Fase 9).
 * - Si el carril está vacío: SIEMPRE se ancla a 0 (00:00), sin importar dónde se soltó.
 * - Si el carril ya tiene clips: calcula la posición aproximada desde dropX y aplica
/**
 * Retorna la posición temporal exacta del playhead en segundos (fuente única de verdad — Fase 24).
 * Si la reproducción está activa, devuelve getTransportTime(); en pausa, state.project.currentTime.
 * @returns {number}
 */
function getPlayheadTime() {
  if (state.project && state.project.isPlaying) {
    return typeof getTransportTime === 'function' ? getTransportTime() : (state.project.currentTime || 0);
  }
  return (state.project && typeof state.project.currentTime === 'number') ? state.project.currentTime : 0;
}

/**
 * Calcula la posición de inicio para un clip en un carril a partir de un tiempo deseado,
 * resolviendo colisiones secuencialmente de modo que nunca se solape con clips existentes (Fase 24).
 * Si choca con un clip existente, se coloca justo después del final del clip con el que choca.
 * Redondeado a centésimas (dos decimales).
 * @param {object} track - Carril destino
 * @param {number} desiredStart - Tiempo de inicio propuesto (en segundos)
 * @param {number} clipDuration - Duración del clip (en segundos)
 * @returns {number} Posición de inicio final en segundos (redondeada a centésimas)
 */
function resolveDropStart(track, desiredStart, clipDuration) {
  let start = Math.max(0, Math.round(desiredStart * 100) / 100);
  const duration = typeof clipDuration === 'number' ? clipDuration : 0;
  let end = start + duration;

  const sortedClips = [...(track.clips || [])].sort((a, b) => a.start - b.start);
  for (const c of sortedClips) {
    const cStart = c.start || 0;
    const cEnd = cStart + (c.duration || 0);
    // Hay colisión si start < cEnd y end > cStart (con tolerancia a centésimas)
    if (start < cEnd - 0.001 && end > cStart + 0.001) {
      start = Math.round(cEnd * 100) / 100;
      end = start + duration;
    }
  }
  return Math.round(start * 100) / 100;
}

/**
 * Función heredada para cálculo de caída de clips, delegada a resolveDropStart (Fase 24).
 */
function calculateDropStart(track, dropXOrTime, pixelsPerSecondOrDuration, maybeClipDuration) {
  const duration = typeof maybeClipDuration === 'number'
    ? maybeClipDuration
    : (typeof pixelsPerSecondOrDuration === 'number' ? pixelsPerSecondOrDuration : 0);
  const desired = typeof dropXOrTime === 'number' && dropXOrTime > 200
    ? pixelsToTime(dropXOrTime)
    : (typeof dropXOrTime === 'number' ? dropXOrTime : getPlayheadTime());
  return resolveDropStart(track, desired, duration);
}

/**
 * Recalcula dinámicamente la duración total del proyecto a partir del tiempo final
 * (start + duration) de todos los clips colocados en todos los carriles del timeline.
 * Si no hay clips o no hay carriles, retorna 0.
 * @param {Array} [tracksList] - Lista de carriles a inspeccionar (por defecto state.tracks)
 * @returns {number} Duración total en segundos
 */
function recomputeProjectDuration(tracksList = state.tracks) {
  let maxEnd = 0;
  if (Array.isArray(tracksList)) {
    for (const track of tracksList) {
      if (Array.isArray(track.clips)) {
        for (const clip of track.clips) {
          const clipEnd = (clip.start || 0) + (clip.duration || 0);
          if (clipEnd > maxEnd) {
            maxEnd = clipEnd;
          }
        }
      }
    }
  }
  return maxEnd;
}

/**
 * Calcula la escala visual actual de la línea de tiempo (píxeles por segundo)
 * en función del nivel de zoom configurado en state.project.zoom (0–100).
 * @returns {number}
 */
function getPixelsPerSecond() {
  const zoom = typeof state.project.zoom === 'number' ? state.project.zoom : 50;
  const zoomFactor = Math.max(0.25, zoom / 50);
  return PIXELS_PER_SECOND_BASE * zoomFactor;
}

/**
 * Única fuente de verdad para conversión tiempo -> píxeles (Fase 14).
 * Retorna la coordenada X exacta en píxeles relativa al origen común (después de la franja de control de 40px).
 * @param {number} seconds - Tiempo en segundos
 * @returns {number} Posición en píxeles
 */
function timeToPixels(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return 0;
  return seconds * getPixelsPerSecond();
}

/**
 * Única fuente de verdad para conversión píxeles -> tiempo (Fase 14).
 * Convierte un desplazamiento en píxeles relativo al origen común a segundos.
 * @param {number} pixels - Posición en píxeles
 * @returns {number} Tiempo en segundos
 */
function pixelsToTime(pixels) {
  if (typeof pixels !== 'number' || isNaN(pixels) || pixels < 0) return 0;
  const pps = getPixelsPerSecond();
  return pps > 0 ? pixels / pps : 0;
}

/* ==========================================================================
   4.1 ASISTENTE DE IA (Fase 18: Transcripción real con Google Gemini)
   ========================================================================== */

/**
 * Muestra una notificación toast temporal y accesible (Fase 15).
 * @param {string} message - Texto del mensaje
 * @param {'success' | 'info' | 'warning'} [type='success']
 */
function showToast(message, type = 'success') {
  let container = $('#toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-20 right-6 z-50 flex flex-col gap-2 pointer-events-none';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'warning'
    ? 'bg-amber-600 text-white'
    : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-slate-700/50 dark:border-slate-300';

  const iconName = type === 'warning' ? 'alert-triangle' : 'check-circle';
  const iconColor = type === 'warning' ? 'text-amber-200' : 'text-emerald-400 dark:text-emerald-600';

  toast.className = `px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xl flex items-center gap-2 transform translate-y-2 opacity-0 transition-all duration-200 pointer-events-auto ${bgClass}`;
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 ${iconColor} shrink-0"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  renderIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3500);
}

/**
 * Inicia la transcripción real con Google Gemini del clip actualmente seleccionado (Fase 18).
 * Envía el libraryId, start y duration exactos al endpoint POST /api/ai/transcribe.
 */
async function transcribeSelectedClip() {
  const selectedClipId = state.selection.clipId;
  if (!selectedClipId) return;

  let targetClip = null;
  for (const track of state.tracks) {
    const found = track.clips?.find((c) => c.id === selectedClipId);
    if (found) {
      targetClip = found;
      break;
    }
  }
  if (!targetClip) return;

  // 1. Estado 'processing' inmediato para mostrar feedback visual y animación pulsante
  const nextTranscriptByClip = {
    ...state.ai.transcriptByClip,
    [selectedClipId]: {
      status: 'processing',
      segments: []
    }
  };

  setState({
    ai: {
      ...state.ai,
      transcriptByClip: nextTranscriptByClip
    }
  });

  try {
    const sourceStart = typeof targetClip.sourceOffset === 'number'
      ? targetClip.sourceOffset
      : (typeof targetClip.start === 'number' ? targetClip.start : 0);
    const payload = {
      libraryId: targetClip.libraryId || targetClip.id,
      start: sourceStart,
      duration: typeof targetClip.duration === 'number' ? targetClip.duration : 1
    };

    const res = await fetch(`${API_BASE_URL}/api/ai/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    // Verificar si el clip sigue existiendo en el proyecto al volver de la petición
    const stillExists = state.tracks.some((t) => t.clips?.some((c) => c.id === selectedClipId));
    if (!stillExists) return;

    if (!res.ok) {
      let errorMsg;
      if (res.status === 503 && data.error && data.error.includes('GEMINI_API_KEY')) {
        errorMsg = typeof t === 'function' ? t('aiPanel.notConfigured') : data.error;
      } else if (res.status === 429) {
        errorMsg = typeof t === 'function' ? t('aiPanel.rateLimited') : (data.error || 'Límite de solicitudes alcanzado.');
      } else {
        errorMsg = data.error || (typeof t === 'function' ? t('aiPanel.networkError') : 'Error al transcribir con IA.');
      }

      showToast(errorMsg, 'warning');

      // Restaurar estado a idle si falló la transcripción
      setState({
        ai: {
          ...state.ai,
          transcriptByClip: {
            ...state.ai.transcriptByClip,
            [selectedClipId]: {
              status: 'idle',
              segments: []
            }
          }
        }
      });
      return;
    }

    // Respuesta exitosa: data.segments contiene { id, text, startTime, endTime, isFiller }
    const rawSegments = Array.isArray(data.segments) ? data.segments : [];
    const formattedSegments = rawSegments.map((s, idx) => ({
      id: s.id || `seg-${selectedClipId}-${idx + 1}`,
      text: s.text,
      startTime: s.startTime,
      endTime: s.endTime,
      isFiller: Boolean(s.isFiller),
      markedForDeletion: false
    }));

    setState({
      ai: {
        ...state.ai,
        transcriptByClip: {
          ...state.ai.transcriptByClip,
          [selectedClipId]: {
            status: 'done',
            segments: formattedSegments
          }
        }
      }
    });

  } catch (err) {
    console.error('[PodcastCraft AI] Error de red al solicitar transcripción con Gemini:', err);
    showToast(typeof t === 'function' ? t('aiPanel.networkError') : 'Error de conexión con el servidor.', 'warning');

    setState({
      ai: {
        ...state.ai,
        transcriptByClip: {
          ...state.ai.transcriptByClip,
          [selectedClipId]: {
            status: 'idle',
            segments: []
          }
        }
      }
    });
  }
}

/**
 * Alterna el marcado para eliminación de una palabra en la transcripción de un clip (Fase 15).
 * @param {string} clipId
 * @param {string} segmentId
 */
function toggleSegmentMark(clipId, segmentId) {
  const clipData = state.ai.transcriptByClip?.[clipId];
  if (!clipData || !clipData.segments) return;

  const nextSegments = clipData.segments.map((seg) => {
    if (seg.id === segmentId) {
      return { ...seg, markedForDeletion: !seg.markedForDeletion };
    }
    return seg;
  });

  setState({
    ai: {
      ...state.ai,
      transcriptByClip: {
        ...state.ai.transcriptByClip,
        [clipId]: {
          ...clipData,
          segments: nextSegments
        }
      }
    }
  });
}

/**
 * Calcula los rangos de tiempo que sobreviven tras restar los rangos eliminados de un clip (Fase 19).
 * @param {number} clipDuration - Duración total del clip en segundos
 * @param {Array<{start: number, end: number}>} removedRanges - Rangos a eliminar, relativos al clip (0 = inicio del clip)
 * @returns {Array<{start: number, end: number}>} Rangos sobrevivientes ordenados
 */
function computeKeptRanges(clipDuration, removedRanges) {
  const MIN_PIECE_DURATION = 0.3; // descarta fragmentos insignificantes
  if (!removedRanges || removedRanges.length === 0) {
    return clipDuration >= MIN_PIECE_DURATION ? [{ start: 0, end: clipDuration }] : [];
  }

  // Ordenar y fusionar rangos solapados o adyacentes
  const sorted = [...removedRanges].sort((a, b) => a.start - b.start);
  const mergedRemoved = [];
  for (const r of sorted) {
    const s = Math.max(0, Math.min(clipDuration, r.start));
    const e = Math.max(0, Math.min(clipDuration, r.end));
    if (e <= s) continue;

    if (mergedRemoved.length === 0) {
      mergedRemoved.push({ start: s, end: e });
    } else {
      const prev = mergedRemoved[mergedRemoved.length - 1];
      if (s <= prev.end) {
        prev.end = Math.max(prev.end, e);
      } else {
        mergedRemoved.push({ start: s, end: e });
      }
    }
  }

  const kept = [];
  let cursor = 0;
  for (const r of mergedRemoved) {
    if (r.start - cursor >= MIN_PIECE_DURATION) {
      kept.push({ start: cursor, end: r.start });
    }
    cursor = Math.max(cursor, r.end);
  }
  if (clipDuration - cursor >= MIN_PIECE_DURATION) {
    kept.push({ start: cursor, end: clipDuration });
  }

  return kept;
}

/**
 * Ejecuta el algoritmo de corte por sustracción de intervalos sobre el clip especificado (Fase 19).
 * Reemplaza el clip original en el carril por los 0 a N pedazos resultantes colocados en cascada contigua (ripple),
 * preserva los segmentos de transcripción correspondientes ajustando sus tiempos relativos a cada nuevo clip,
 * y se integra con la pila de deshacer (pushUndoSnapshot).
 * @param {string} clipId
 * @param {Array<{start: number, end: number}>} removedRanges
 * @returns {{ success: boolean, piecesCount: number }}
 */
function executeIntervalSubtraction(clipId, removedRanges) {
  let targetTrack = null;
  let targetClip = null;
  for (const t of state.tracks) {
    const found = t.clips?.find((c) => c.id === clipId);
    if (found) {
      targetTrack = t;
      targetClip = found;
      break;
    }
  }
  if (!targetTrack || !targetClip) return { success: false, piecesCount: 0 };

  const clipDuration = typeof targetClip.duration === 'number' ? targetClip.duration : 0;
  const keptRanges = computeKeptRanges(clipDuration, removedRanges);

  // Snapshot antes de la mutación estructural (Fase 16 & 19)
  pushUndoSnapshot();

  const originalStart = targetClip.start || 0;
  const originalSourceOffset = targetClip.sourceOffset || 0;
  const originalSegments = state.ai.transcriptByClip?.[clipId]?.segments || [];

  const nextTranscriptByClip = { ...(state.ai.transcriptByClip || {}) };
  delete nextTranscriptByClip[clipId];

  const newClips = [];
  let accumulatedOffset = 0;

  for (const range of keptRanges) {
    const pieceDuration = +(range.end - range.start).toFixed(2);
    if (pieceDuration < 0.3) continue;

    const pieceId = `clip-${crypto.randomUUID()}`;
    const pieceStart = +(originalStart + accumulatedOffset).toFixed(2);
    const pieceSourceOffset = +(originalSourceOffset + range.start).toFixed(2);

    const newClip = {
      id: pieceId,
      libraryId: targetClip.libraryId,
      name: targetClip.name,
      start: pieceStart,
      duration: pieceDuration,
      sourceOffset: pieceSourceOffset,
      volume: typeof targetClip.volume === 'number' ? targetClip.volume : 1,
      objectUrl: targetClip.objectUrl
    };
    newClips.push(newClip);
    accumulatedOffset += pieceDuration;

    // 3.3 Reasignar segmentos que caen dentro de este pedazo
    const pieceSegments = [];
    for (const seg of originalSegments) {
      const segMid = (seg.startTime + seg.endTime) / 2;
      if (segMid >= range.start && segMid <= range.end) {
        pieceSegments.push({
          id: `seg-${pieceId}-${pieceSegments.length + 1}`,
          text: seg.text,
          startTime: Math.max(0, +(seg.startTime - range.start).toFixed(2)),
          endTime: Math.min(pieceDuration, +(seg.endTime - range.start).toFixed(2)),
          isFiller: Boolean(seg.isFiller),
          markedForDeletion: false
        });
      }
    }

    nextTranscriptByClip[pieceId] = {
      status: 'done',
      segments: pieceSegments
    };
  }

  // 3.4 Reemplazo en el estado (inmutable)
  const nextTrackClips = [];
  for (const c of targetTrack.clips) {
    if (c.id === clipId) {
      nextTrackClips.push(...newClips);
    } else {
      nextTrackClips.push(c);
    }
  }
  nextTrackClips.sort((a, b) => a.start - b.start);

  const nextTracks = state.tracks.map((t) => {
    if (t.id === targetTrack.id) {
      return { ...t, clips: nextTrackClips };
    }
    return t;
  });

  const nextDuration = recomputeProjectDuration(nextTracks);
  const nextSelectionClipId = newClips.length > 0 ? newClips[0].id : null;

  setState({
    tracks: nextTracks,
    selection: { clipId: nextSelectionClipId },
    project: { duration: nextDuration },
    ai: {
      ...state.ai,
      transcriptByClip: nextTranscriptByClip
    }
  });

  if (typeof schedulePlaybackDebounce === 'function') {
    schedulePlaybackDebounce(150);
  }

  return { success: true, piecesCount: newClips.length };
}

/**
 * Elimina definitivamente todos los segmentos marcados para borrado cortando el clip en el timeline (Fase 19).
 * @param {string} clipId
 */
function confirmSegmentCleanup(clipId) {
  const clipData = state.ai.transcriptByClip?.[clipId];
  if (!clipData || !clipData.segments) return;

  const markedSegments = clipData.segments.filter((s) => s.markedForDeletion);
  if (markedSegments.length === 0) return;

  const removedRanges = markedSegments.map((s) => ({
    start: s.startTime,
    end: s.endTime
  }));

  const result = executeIntervalSubtraction(clipId, removedRanges);
  if (!result.success) return;

  let msg = '';
  if (result.piecesCount === 0) {
    msg = typeof t === 'function' ? t('aiPanel.clipDeleted') : 'Se eliminó el clip por completo';
  } else if (result.piecesCount === 1) {
    msg = typeof t === 'function' ? t('aiPanel.clipTrimmed') : 'Se recortó el clip';
  } else {
    msg = typeof t === 'function'
      ? t('aiPanel.splitSuccess', { count: result.piecesCount })
      : `Se dividió el clip en ${result.piecesCount} partes`;
  }
  showToast(msg);
}

/**
 * Limpieza automática masiva: corta el clip eliminando todas las muletillas detectadas (isFiller: true) (Fase 19).
 * @param {string} clipId
 */
function cleanAllFillers(clipId) {
  const clipData = state.ai.transcriptByClip?.[clipId];
  if (!clipData || !clipData.segments) return;

  const fillerSegments = clipData.segments.filter((s) => s.isFiller);
  if (fillerSegments.length === 0) return;

  setState({
    ai: {
      ...state.ai,
      isMassCleaning: true
    }
  });

  setTimeout(() => {
    const currentClipData = state.ai.transcriptByClip?.[clipId];
    if (!currentClipData || !currentClipData.segments) {
      setState({ ai: { ...state.ai, isMassCleaning: false } });
      return;
    }

    const removedRanges = fillerSegments.map((s) => ({
      start: s.startTime,
      end: s.endTime
    }));

    const result = executeIntervalSubtraction(clipId, removedRanges);
    setState({
      ai: {
        ...state.ai,
        isMassCleaning: false
      }
    });

    if (!result.success) return;

    let msg = '';
    if (result.piecesCount === 0) {
      msg = typeof t === 'function' ? t('aiPanel.clipDeleted') : 'Se eliminó el clip por completo';
    } else if (result.piecesCount === 1) {
      msg = typeof t === 'function' ? t('aiPanel.clipTrimmed') : 'Se recortó el clip';
    } else {
      msg = typeof t === 'function'
        ? t('aiPanel.splitSuccess', { count: result.piecesCount })
        : `Se dividió el clip en ${result.piecesCount} partes`;
    }
    showToast(msg);
  }, 1500);
}

/**
 * Convierte un total de segundos a formato estandarizado HH:MM:SS.
 * @param {number} totalSeconds
 * @returns {string} Tiempo formateado "HH:MM:SS"
 */
function formatTime(totalSeconds) {
  if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00:00';
  }
  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formatea duración de bloques: mm:ss (o HH:MM:SS si supera 1 hora).
 * @param {number} totalSeconds
 * @returns {string} Duración formateada
 */
function formatDuration(totalSeconds) {
  if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }
  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const pad = (num) => String(num).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Escapa caracteres especiales en strings para inyección segura en template literals HTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Busca un audio de la biblioteca por su identificador único.
 * @param {string} id
 * @returns {object | null}
 */
function getLibraryItem(id) {
  return state.library.find((item) => item.id === id) || null;
}

/**
 * Restringe un valor numérico entre un mínimo y un máximo.
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

/**
 * Selector simplificado de elemento del DOM.
 * @param {string} selector
 * @returns {HTMLElement | null}
 */
function $(selector) {
  return document.querySelector(selector);
}

/**
 * Selector simplificado de múltiples elementos del DOM.
 * @param {string} selector
 * @returns {HTMLElement[]}
 */
function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}


/* ==========================================================================
   5. TRACK MANAGEMENT & UNDO (Sprint 4 — 2, Fase 16)
   ========================================================================== */

/**
 * Pila de snapshots profundos de carriles para deshacer acciones estructurales (Fase 16).
 * Alcance acotado: sólo sesión, máximo 20 pasos.
 * @type {Array<Array<object>>}
 */
const undoStack = [];
const MAX_UNDO_STEPS = 20;

/**
 * Guarda un snapshot profundo del estado de carriles (tracks) en la pila de deshacer (Fase 16).
 */
function pushUndoSnapshot() {
  try {
    undoStack.push(JSON.parse(JSON.stringify(state.tracks)));
    if (undoStack.length > MAX_UNDO_STEPS) {
      undoStack.shift();
    }
    updateUndoButtonState();
  } catch (err) {
    console.warn('[PodcastCraft AI] Error guardando snapshot de deshacer:', err);
  }
}

/**
 * Sincroniza el estado visual y accesible del botón de deshacer (#btn-undo).
 */
function updateUndoButtonState() {
  const btnUndo = $('#btn-undo');
  if (!btnUndo) return;
  const canUndo = undoStack.length > 0;
  btnUndo.disabled = !canUndo;
  if (canUndo) {
    btnUndo.removeAttribute('aria-disabled');
    btnUndo.classList.remove('opacity-40', 'cursor-not-allowed');
  } else {
    btnUndo.setAttribute('aria-disabled', 'true');
    btnUndo.classList.add('opacity-40', 'cursor-not-allowed');
  }
}

/**
 * Deshace la última acción estructural del timeline restaurando el snapshot previo (Fase 16).
 */
function undo() {
  if (undoStack.length === 0) return;
  const previousTracks = undoStack.pop();
  updateUndoButtonState();

  // Limpiar selección de clip si ya no existe en el estado restaurado
  let nextClipId = state.selection.clipId;
  if (nextClipId) {
    const exists = previousTracks.some((t) => t.clips && t.clips.some((c) => c.id === nextClipId));
    if (!exists) {
      nextClipId = null;
    }
  }

  const nextDuration = recomputeProjectDuration(previousTracks);
  const remainingClips = previousTracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);

  if (remainingClips === 0) {
    if (typeof stopAllAudioSources === 'function') {
      stopAllAudioSources();
    }
    stopPlayheadLoop();
  } else if (state.project.isPlaying && typeof schedulePlaybackDebounce === 'function') {
    schedulePlaybackDebounce(150);
  }

  setState({
    tracks: previousTracks,
    selection: { ...state.selection, clipId: nextClipId },
    project: {
      ...state.project,
      duration: nextDuration,
      currentTime: Math.min(state.project.currentTime, nextDuration)
    }
  });

  // Sincronizar ganancias en vivo con Web Audio API tras deshacer (Fase 23)
  if (audioContext) {
    for (const t of previousTracks) {
      const tg = trackGainNodes.get(t.id);
      if (tg) {
        const tVol = typeof t.volume === 'number' ? t.volume : 1;
        tg.gain.setTargetAtTime(tVol, audioContext.currentTime, 0.01);
      }
    }
    for (const item of activeAudioSources) {
      const trk = previousTracks.find((t) => t.id === item.trackId);
      const clp = trk?.clips?.find((c) => c.id === item.clipId);
      if (clp && item.clipGain) {
        const cVol = typeof clp.volume === 'number' ? clp.volume : 1;
        item.clipGain.gain.setTargetAtTime(cVol, audioContext.currentTime, 0.01);
      }
    }
  }

  const toastMsg = typeof t === 'function' ? t('timeline.undoToast') : 'Acción deshecha (Ctrl+Z)';
  showToast(toastMsg, 'info');
  console.info(`[PodcastCraft AI] Deshacer ejecutado. Pasos restantes en pila: ${undoStack.length}`);
}

/**
 * Crea un nuevo carril dinámico con color rotativo (Fase 13.5: sin nombres de carril).
 * @returns {object} El nuevo carril creado
 */
function createTrack() {
  pushUndoSnapshot();

  const newTrack = {
    id: `track-${crypto.randomUUID()}`,
    volume: 1,
    clips: []
  };

  setState({
    tracks: [...state.tracks, newTrack]
  });

  console.info('[PodcastCraft AI] Carril creado:', newTrack);
  return newTrack;
}

/**
 * Elimina un carril. Si contiene clips, solicita confirmación con window.confirm.
 * @param {string} trackId
 */
function deleteTrack(trackId) {
  const track = state.tracks.find((t) => t.id === trackId);
  if (!track) return;

  if (track.clips && track.clips.length > 0) {
    const confirmTemplate = typeof t === 'function'
      ? t('timeline.deleteTrackConfirm')
      : 'Este carril tiene {count} clip(s). ¿Eliminarlo de todas formas?';
    const confirmMsg = confirmTemplate.replace('{count}', track.clips.length);
    if (!window.confirm(confirmMsg)) {
      return;
    }
  }

  pushUndoSnapshot();

  const nextTracks = state.tracks.filter((t) => t.id !== trackId);

  // Limpiar y desconectar nodo de ganancia Web Audio del carril eliminado (Fase 23)
  const tg = trackGainNodes.get(trackId);
  if (tg) {
    try {
      tg.disconnect();
    } catch (_) {}
    trackGainNodes.delete(trackId);
  }

  // Limpiar selección de clip si pertenecía al carril eliminado
  let nextClipId = state.selection.clipId;
  if (track.clips && track.clips.some((c) => c.id === nextClipId)) {
    nextClipId = null;
  }

  const nextDuration = recomputeProjectDuration(nextTracks);
  const remainingClips = nextTracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);

  if (remainingClips === 0) {
    if (typeof stopAllAudioSources === 'function') {
      stopAllAudioSources();
    }
    stopPlayheadLoop();
  } else if (state.project.isPlaying && typeof schedulePlaybackDebounce === 'function') {
    schedulePlaybackDebounce(150);
  }

  // Limpiar transcripciones de clips pertenecientes al carril eliminado (Fase 15)
  const nextTranscriptByClip = { ...(state.ai.transcriptByClip || {}) };
  if (track.clips) {
    track.clips.forEach((c) => {
      delete nextTranscriptByClip[c.id];
    });
  }

  setState({
    tracks: nextTracks,
    selection: {
      ...state.selection,
      clipId: nextClipId
    },
    ai: {
      ...state.ai,
      transcriptByClip: nextTranscriptByClip
    },
    project: {
      duration: nextDuration,
      isPlaying: remainingClips === 0 ? false : state.project.isPlaying,
      currentTime: remainingClips === 0 ? 0 : Math.min(state.project.currentTime, nextDuration)
    }
  });

  if (remainingClips === 0) {
    const playheadEl = $('#timeline-playhead');
    if (playheadEl) {
      playheadEl.style.transform = 'translateX(0px)';
    }
  }

  console.info(`[PodcastCraft AI] Carril ${trackId} eliminado.`);
}


/* ==========================================================================
   6. RENDER
   ========================================================================== */

/**
 * Renderiza los elementos correspondientes a la barra superior (#topbar).
 */
function renderTopbar() {
  const projectTitle = $('#project-title');
  if (projectTitle) {
    const isUntitled = !state.project.title || state.project.title === 'Untitled Project' || state.project.title === 'Proyecto sin título';
    const displayTitle = isUntitled ? (typeof t === 'function' ? t('topbar.untitledProject') : state.project.title) : state.project.title;
    projectTitle.textContent = displayTitle;
    projectTitle.setAttribute('title', displayTitle);
  }

  const projectStatus = $('#project-status');
  if (projectStatus) {
    const isSaved = state.project.status === 'saved';
    const statusLabel = typeof t === 'function'
      ? (isSaved ? t('app.badge.saved') : t('app.badge.draft'))
      : (isSaved ? 'Guardado' : 'Borrador');
    const statusConfig = PROJECT_STATUS[state.project.status] || PROJECT_STATUS.draft;
    projectStatus.className = `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 transition-colors duration-150 ${statusConfig.className}`;
    projectStatus.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full ${statusConfig.dotClass} ${state.project.status === 'draft' ? 'animate-pulse' : ''}"></span>
      <span>${statusLabel}</span>
    `;
  }

  const totalDuration = $('#total-duration');
  if (totalDuration) {
    totalDuration.textContent = formatTime(state.project.duration);
  }
}

/**
 * Renderiza los controles de transporte (#transport) y tiempos numéricos.
 */
function renderTransport() {
  const currentTime = $('#current-time');
  if (currentTime) {
    currentTime.textContent = formatTime(state.project.currentTime);
  }

  const durationLabel = $('#duration-label');
  if (durationLabel) {
    durationLabel.textContent = formatTime(state.project.duration);
  }

  // Sincronización del playhead con fuente única de verdad temporal (Web Audio API - Fase 22)
  const playheadEl = $('#timeline-playhead');
  if (playheadEl) {
    const currentSec = typeof getTransportTime === 'function'
      ? getTransportTime()
      : (state.project.currentTime || 0);
    playheadEl.style.transform = `translateX(${timeToPixels(currentSec)}px)`;
  }

  // Sincronización de accesibilidad en regla de tiempo (#timeline-ruler)
  const rulerEl = $('#timeline-ruler');
  if (rulerEl) {
    rulerEl.setAttribute('aria-valuemax', (state.project.duration || 0).toString());
    rulerEl.setAttribute('aria-valuenow', Math.round(state.project.currentTime || 0).toString());
  }

  // Comprobar presencia de clips en el timeline (Sprint 4 — 5.1 contextual)
  const totalClips = state.tracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);
  const hasClips = totalClips > 0;

  // Botón Play / Pausa contextual con etiquetas traducidas dinámicamente
  const btnPlay = $('#btn-play');
  if (btnPlay) {
    if (!hasClips) {
      btnPlay.setAttribute('disabled', 'true');
      btnPlay.setAttribute('aria-disabled', 'true');
      btnPlay.setAttribute('aria-label', typeof t === 'function' ? t('transport.playDisabledAria') : 'Reproducir (sin audio cargado)');
      btnPlay.setAttribute('title', typeof t === 'function' ? t('transport.playDisabledTitle') : 'Reproducir (sin audio cargado)');
      btnPlay.className = 'w-9 h-9 rounded-full flex items-center justify-center bg-violet-600 text-white shadow-md outline-none transition-all duration-150 opacity-40 cursor-not-allowed';
      btnPlay.innerHTML = '<i data-lucide="play" class="w-4 h-4 fill-white ml-0.5"></i>';
    } else {
      btnPlay.removeAttribute('disabled');
      btnPlay.setAttribute('aria-disabled', 'false');
      btnPlay.className = 'w-9 h-9 rounded-full flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white shadow-md glow-ai active:scale-95 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 outline-none transition-all duration-150 cursor-pointer';

      if (state.project.isPlaying) {
        btnPlay.innerHTML = '<i data-lucide="pause" class="w-4 h-4 fill-white"></i>';
        btnPlay.setAttribute('aria-label', typeof t === 'function' ? t('transport.pauseAria') : 'Pausar');
        btnPlay.setAttribute('title', typeof t === 'function' ? t('transport.pauseTitle') : 'Pausar (Espacio)');
      } else {
        btnPlay.innerHTML = '<i data-lucide="play" class="w-4 h-4 fill-white ml-0.5"></i>';
        btnPlay.setAttribute('aria-label', typeof t === 'function' ? t('transport.playAria') : 'Reproducir');
        btnPlay.setAttribute('title', typeof t === 'function' ? t('transport.playTitle') : 'Reproducir (Espacio)');
      }
    }
  }

  // Botones fijos de transporte (tooltips y aria-labels dinámicos)
  const btnRewind = $('#btn-rewind');
  if (btnRewind) {
    btnRewind.setAttribute('aria-label', typeof t === 'function' ? t('transport.rewindAria') : 'Retroceder 5 segundos');
    btnRewind.setAttribute('title', typeof t === 'function' ? t('transport.rewindTitle') : 'Retroceder 5s (J)');
  }
  const btnForward = $('#btn-forward');
  if (btnForward) {
    btnForward.setAttribute('aria-label', typeof t === 'function' ? t('transport.forwardAria') : 'Avanzar 5 segundos');
    btnForward.setAttribute('title', typeof t === 'function' ? t('transport.forwardTitle') : 'Avanzar 5s (L)');
  }

  // Información del clip en reproducción activa (#now-playing-name, #now-playing-meta)
  const nowPlayingName = $('#now-playing-name');
  const nowPlayingMeta = $('#now-playing-meta');
  if (nowPlayingName && nowPlayingMeta) {
    let activeClip = null;
    if (state.selection.clipId) {
      for (const t of state.tracks) {
        const found = (t.clips || []).find((c) => c.id === state.selection.clipId);
        if (found) {
          activeClip = found;
          break;
        }
      }
    }

    if (activeClip) {
      nowPlayingName.textContent = activeClip.name;
      nowPlayingName.setAttribute('title', activeClip.name);
      nowPlayingMeta.textContent = `${formatDuration(activeClip.duration)} · MP3`;
    } else if (hasClips) {
      const mixTemplate = typeof t === 'function' ? t('transport.mixOfClips') : 'Mezcla de {count} clips';
      const mixLabel = mixTemplate.replace('{count}', totalClips);
      nowPlayingName.textContent = mixLabel;
      nowPlayingName.setAttribute('title', mixLabel);
      nowPlayingMeta.textContent = `${formatDuration(state.project.duration)} · Multitrack`;
    } else {
      const emptyLabel = typeof t === 'function' ? t('transport.noClip') : 'Ningún clip en la línea de tiempo';
      nowPlayingName.textContent = emptyLabel;
      nowPlayingName.setAttribute('title', emptyLabel);
      nowPlayingMeta.textContent = '—';
    }
  }

  // Botón Mute / Unmute
  const btnMute = $('#btn-mute');
  if (btnMute) {
    if (state.project.isMuted) {
      btnMute.innerHTML = '<i data-lucide="volume-x" class="w-4 h-4"></i>';
      btnMute.setAttribute('aria-label', typeof t === 'function' ? t('transport.unmuteAria') : 'Activar sonido');
      btnMute.setAttribute('title', typeof t === 'function' ? t('transport.unmuteTitle') : 'Activar sonido (M)');
    } else {
      btnMute.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4"></i>';
      btnMute.setAttribute('aria-label', typeof t === 'function' ? t('transport.muteAria') : 'Silenciar audio');
      btnMute.setAttribute('title', typeof t === 'function' ? t('transport.muteTitle') : 'Silenciar audio (M)');
    }
  }

  // Slider de volumen
  const volumeSlider = $('#volume-slider');
  if (volumeSlider) {
    const effectiveVolume = state.project.isMuted ? 0 : state.project.volume;
    volumeSlider.value = effectiveVolume;
    volumeSlider.style.setProperty('--range-progress', `${effectiveVolume}%`);
  }

  // Slider de zoom y valor numérico
  const zoomSlider = $('#zoom-slider');
  if (zoomSlider) {
    zoomSlider.value = state.project.zoom;
    zoomSlider.style.setProperty('--range-progress', `${state.project.zoom}%`);
  }

  const zoomValue = $('#zoom-value');
  if (zoomValue) {
    zoomValue.textContent = `${state.project.zoom}%`;
  }
}

/**
 * Renderiza el contador de ítems en la cabecera de la biblioteca con pluralización correcta.
 */
function renderLibraryCount() {
  const libraryCount = $('#library-count');
  if (libraryCount) {
    const count = state.library.length;
    const text = typeof t === 'function'
      ? (count === 1 ? t('library.countSingle') : t('library.countPlural').replace('{count}', count))
      : (count === 1 ? '1 audio' : `${count} audios`);
    libraryCount.textContent = text;
  }
}

/**
 * Renderiza la lista de tarjetas de audio (#library-list) con estilo neutro (Sprint 4).
 */
function renderLibraryList() {
  const listContainer = $('#library-list');
  if (!listContainer) return;

  if (state.library.length === 0) {
    listContainer.className = 'flex-1 min-h-0 p-3 overflow-y-auto flex flex-col';
    const emptyTitle = typeof t === 'function' ? t('library.emptyTitle') : 'Tu biblioteca aparecerá aquí';
    const emptyDesc = typeof t === 'function' ? t('library.emptyDesc') : 'Importa archivos MP3 desde tu computador para estructurar tu episodio.';
    listContainer.innerHTML = `
      <div id="library-empty" class="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-xl theme-empty-box">
        <div class="w-12 h-12 rounded-full theme-pill border flex items-center justify-center theme-text-secondary mb-3 shadow-inner">
          <i data-lucide="file-audio" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xs font-semibold theme-text-primary mb-1">${emptyTitle}</h3>
        <p class="text-[11px] theme-text-muted leading-relaxed max-w-[190px]">
          ${emptyDesc}
        </p>
      </div>
    `;
    return;
  }

  listContainer.className = 'flex-1 min-h-0 p-3 overflow-y-auto space-y-2';
  const durationLabel = typeof t === 'function' ? t('library.durationLabel') : 'duración';
  const dragToTrack = typeof t === 'function' ? t('library.dragToTrack') : 'Arrastra a un carril';
  const cardDragTitle = typeof t === 'function' ? t('library.cardDragTitle') : 'Arrastra a cualquier carril del timeline';

  const cardsHtml = state.library.map((item) => {
    const isSelected = state.selection.libraryId === item.id;
    const formattedDuration = formatDuration(item.duration);
    const borderBgClasses = isSelected
      ? 'lib-card-selected'
      : 'lib-card-default';

    return `
      <article
        id="lib-card-${item.id}"
        data-library-id="${item.id}"
        draggable="true"
        tabindex="0"
        role="button"
        aria-pressed="${isSelected ? 'true' : 'false'}"
        aria-label="${escapeHtml(item.name)}, ${durationLabel} ${formattedDuration}. ${dragToTrack}"
        title="${cardDragTitle}"
        class="group relative min-h-[58px] rounded-lg border ${borderBgClasses} active:cursor-grabbing cursor-grab flex items-center gap-3 px-3 py-2 select-none transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <!-- Ícono neutro 32x32 -->
        <div class="w-8 h-8 rounded-md border theme-pill flex items-center justify-center shrink-0 pointer-events-none">
          <i data-lucide="file-audio" class="w-4 h-4 theme-text-secondary"></i>
        </div>

        <!-- Nombre y tipo -->
        <div class="flex-1 min-w-0 flex flex-col justify-center pointer-events-none">
          <span class="text-xs font-medium theme-text-primary truncate" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          <span class="text-[10px] font-mono uppercase tracking-wider theme-text-muted">MP3</span>
        </div>

        <!-- Duración y Grip -->
        <div class="flex items-center gap-2 shrink-0 pointer-events-none">
          <span class="font-mono tabular-nums text-[11px] theme-text-muted">${formattedDuration}</span>
          <i data-lucide="grip-vertical" class="w-4 h-4 text-slate-400 group-hover:theme-text-primary transition-colors"></i>
        </div>
      </article>
    `;
  }).join('');

  listContainer.innerHTML = cardsHtml;
}

/**
 * Renderiza la barra de herramientas contextual de clip (#clip-toolbar) (Fase 23).
 * Si hay un clip seleccionado, muestra su nombre y habilita el slider de volumen (0–200%).
 * Si no hay clip seleccionado, la barra mantiene su altura física para no mover el layout,
 * deshabilita el slider con aria-disabled y muestra el mensaje guía.
 */
function renderClipToolbar() {
  const toolbar = $('#clip-toolbar');
  if (!toolbar) return;

  const titleEl = $('#clip-toolbar-title');
  const groupEl = $('#clip-toolbar-volume-group');
  const sliderEl = $('#clip-volume-slider');
  const valEl = $('#clip-volume-value');

  let selectedClip = null;
  const clipId = state.selection?.clipId;
  if (clipId) {
    for (const track of state.tracks) {
      const found = (track.clips || []).find((c) => c.id === clipId);
      if (found) {
        selectedClip = found;
        break;
      }
    }
  }

  if (selectedClip) {
    if (titleEl) {
      titleEl.textContent = selectedClip.name;
      titleEl.classList.remove('theme-text-muted', 'italic');
      titleEl.classList.add('theme-text-primary', 'font-semibold');
      titleEl.removeAttribute('data-i18n');
      titleEl.title = selectedClip.name;
    }
    if (groupEl) {
      groupEl.classList.remove('opacity-50', 'pointer-events-none');
    }
    const cVol = typeof selectedClip.volume === 'number' ? selectedClip.volume : 1;
    const cPercent = Math.round(cVol * 100);
    if (sliderEl) {
      sliderEl.disabled = false;
      sliderEl.setAttribute('aria-disabled', 'false');
      sliderEl.value = cPercent;
    }
    if (valEl) {
      valEl.textContent = `${cPercent}%`;
    }
  } else {
    if (titleEl) {
      const placeholderText = typeof t === 'function'
        ? t('clipToolbar.noClipSelected')
        : 'Selecciona un clip para ajustar su volumen';
      titleEl.textContent = placeholderText;
      titleEl.classList.add('theme-text-muted', 'italic');
      titleEl.classList.remove('theme-text-primary', 'font-semibold');
      titleEl.setAttribute('data-i18n', 'clipToolbar.noClipSelected');
      titleEl.removeAttribute('title');
    }
    if (groupEl) {
      groupEl.classList.add('opacity-50', 'pointer-events-none');
    }
    if (sliderEl) {
      sliderEl.disabled = true;
      sliderEl.setAttribute('aria-disabled', 'true');
      sliderEl.value = 100;
    }
    if (valEl) {
      valEl.textContent = '100%';
    }
  }
}

/**
 * Renderiza dinámicamente las marcas de tiempo de la regla (#timeline-ruler-scale)
 * adaptando la granularidad de las marcas al nivel de zoom actual y a la duración del proyecto.
 * Fase 14: Todas las marcas se posicionan con timeToPixels(t), compartiendo exactamente
 * la misma escala temporal que el playhead y los clips.
 */
function renderTimelineRuler() {
  const scaleEl = $('#timeline-ruler-scale');
  if (!scaleEl) return;

  const pps = getPixelsPerSecond();
  const visibleWidth = scaleEl.clientWidth || (scaleEl.parentElement?.clientWidth ? scaleEl.parentElement.clientWidth - 140 : 800);
  const visibleSeconds = pps > 0 ? visibleWidth / pps : 200;
  const projectDur = state.project.duration || 0;
  // La regla se extiende a lo largo de toda la ventana visible o hasta el fin del audio
  const maxSeconds = Math.max(projectDur, visibleSeconds, 60);

  // Intervalos estándar legibles (en segundos) estilo DAW
  const NICE_INTERVALS = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600, 1200, 1800, 3600];
  const minPixelGap = 65; // al menos 65px entre marcas para evitar solapamientos
  let interval = NICE_INTERVALS.find((sec) => sec * pps >= minPixelGap);
  if (!interval) {
    interval = NICE_INTERVALS[NICE_INTERVALS.length - 1];
  }

  const ticks = [];
  for (let t = 0; t <= maxSeconds + interval; t += interval) {
    const px = Math.round(timeToPixels(t));
    if (px > visibleWidth + 300) break; // límite prudencial de renderizado
    const label = formatTime(t);
    const isOrigin = t === 0;

    ticks.push(`
      <div
        class="timeline-ruler-tick absolute top-0 bottom-0 pointer-events-none select-none text-[9px] font-mono theme-text-muted"
        style="left: ${px}px;"
      >
        <div class="w-[1px] h-1.5 bg-current opacity-40"></div>
        <span
          class="absolute top-2 tabular-nums font-mono leading-none opacity-85 whitespace-nowrap"
          style="${isOrigin ? 'left: 2px;' : 'left: 0px; transform: translateX(-50%);'}"
        >${label}</span>
        <div class="absolute bottom-0 w-[1px] h-1 bg-current opacity-20"></div>
      </div>
    `);
  }

  scaleEl.innerHTML = ticks.join('');
}

/**
 * Renderiza los carriles dinámicos (0 a N) en el timeline (#timeline-tracks).
 * Sprint 4: Estado vacío general si tracks.length === 0, o carriles con asas de recorte y clips coloreados.
 */
function renderTimelineTracks() {
  const container = $('#timeline-tracks');
  if (!container) return;

  // Estado vacío 1: Cero carriles creados
  if (state.tracks.length === 0) {
    container.className = 'flex-1 min-h-0 p-4 lg:p-6 overflow-y-auto flex flex-col justify-center';
    const emptyTitle = typeof t === 'function' ? t('timeline.emptyTracksTitle') : 'Aún no tienes carriles';
    const emptyDesc = typeof t === 'function' ? t('timeline.emptyTracksDesc') : 'Crea un carril para empezar a construir tu episodio y arrastrar archivos de audio.';
    const createFirstAria = typeof t === 'function' ? t('timeline.createFirstTrackAria') : 'Crear primer carril';

    container.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl theme-empty-box max-w-xl mx-auto w-full my-auto">
        <div class="w-14 h-14 rounded-2xl theme-pill border flex items-center justify-center theme-text-secondary mb-3 shadow-inner">
          <i data-lucide="layers" class="w-7 h-7"></i>
        </div>
        <h3 class="text-sm font-semibold theme-text-primary mb-1">${emptyTitle}</h3>
        <p class="text-xs theme-text-muted max-w-sm leading-relaxed mb-4">
          ${emptyDesc}
        </p>
        <button id="btn-empty-add-track" type="button" aria-label="${createFirstAria}" title="${createFirstAria}" class="theme-btn-export inline-flex items-center justify-center w-10 h-10 rounded-xl active:scale-95 shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
          <i data-lucide="plus" class="w-5 h-5"></i>
        </button>
      </div>
    `;
    return;
  }

  container.className = 'flex-1 min-h-0 py-3 overflow-y-auto space-y-3.5 flex flex-col';

  const splitText = typeof t === 'function' ? t('timeline.doubleClickToSplit') : 'Doble clic para dividir';
  const trimStartText = typeof t === 'function' ? t('timeline.dragToTrimStart') : 'Arrastra para recortar inicio';
  const trimEndText = typeof t === 'function' ? t('timeline.dragToTrimEnd') : 'Arrastra para recortar final';
  const clipFromText = typeof t === 'function' ? t('timeline.clipFrom') : 'de';
  const clipToText = typeof t === 'function' ? t('timeline.clipTo') : 'a';
  const deleteTrackAria = typeof t === 'function' ? t('timeline.deleteTrackAria') : 'Eliminar carril';
  const deleteTrackTitle = typeof t === 'function' ? t('timeline.deleteTrackTitle') : 'Eliminar carril';
  const emptyLaneText = typeof t === 'function' ? t('timeline.emptyLane') : 'Carril vacío — Arrastra un audio aquí';

  const tracksHtml = state.tracks.map((track, trackIndex) => {
    const trackPos = trackIndex + 1;
    const trackVol = typeof track.volume === 'number' ? track.volume : 1;
    const trackVolPercent = Math.round(trackVol * 100);
    const trackVolumeAria = typeof t === 'function'
      ? t('timeline.trackVolumeAria', { index: trackPos })
      : `Volumen del carril ${trackPos}`;
    const trackVolumeTitle = typeof t === 'function'
      ? t('timeline.trackVolumeTitle', { index: trackPos })
      : `Volumen del carril ${trackPos}`;
    const clips = track.clips || [];

    const clipsHtml = clips.map((clip) => {
      const leftPx = Math.round(timeToPixels(clip.start || 0));
      const widthPx = Math.max(32, Math.round(timeToPixels(clip.duration || 0)));
      const isSelected = state.selection.clipId === clip.id;
      const formattedDuration = formatDuration(clip.duration);
      const startFormatted = formatDuration(clip.start);
      const endFormatted = formatDuration((clip.start || 0) + (clip.duration || 0));
      const fullAriaLabel = `${clip.name}, ${clipFromText} ${startFormatted} ${clipToText} ${endFormatted}`;

      return `
        <div
          id="timeline-clip-${clip.id}"
          data-clip-id="${clip.id}"
          data-track-id="${track.id}"
          role="button"
          tabindex="0"
          aria-label="${escapeHtml(fullAriaLabel)}"
          title="${escapeHtml(clip.name)} (${formattedDuration}) — ${splitText}"
          class="timeline-clip absolute top-1.5 bottom-1.5 rounded-md border flex items-center px-2 gap-1 cursor-pointer select-none transition-all duration-100 ${isSelected ? 'is-selected' : ''}"
          style="left: ${leftPx}px; width: ${widthPx}px;"
        >
          <!-- Asa de recorte izquierda -->
          <div
            class="clip-handle-left"
            data-handle="left"
            data-clip-id="${clip.id}"
            data-track-id="${track.id}"
            title="${trimStartText}"
          ></div>

          <!-- Nombre y duración -->
          <span class="text-xs font-semibold truncate theme-text-primary flex-1 min-w-0 ml-1.5 pointer-events-none">${escapeHtml(clip.name)}</span>
          <span class="text-[10px] font-mono theme-text-secondary shrink-0 opacity-90 tabular-nums mr-1.5 pointer-events-none">${formattedDuration}</span>

          <!-- Asa de recorte derecha -->
          <div
            class="clip-handle-right"
            data-handle="right"
            data-clip-id="${clip.id}"
            data-track-id="${track.id}"
            title="${trimEndText}"
          ></div>
        </div>
      `;
    }).join('');

    return `
      <div class="timeline-row flex items-stretch pr-4 group/track" data-track-id="${track.id}">
        <!-- Franja de control de ancho fijo con papelera y slider de volumen (Fase 23) -->
        <div class="timeline-control-strip shrink-0 flex items-center justify-between px-2 gap-1.5 select-none" style="width: var(--track-control-strip-width, 140px);">
          <!-- Botón eliminar carril -->
          <button
            type="button"
            id="track-delete-${track.id}"
            data-delete-track="${track.id}"
            aria-label="${deleteTrackAria}"
            title="${deleteTrackTitle}"
            class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 theme-text-muted hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>

          <!-- Slider compacto de volumen de carril (0–200%, default 100%) -->
          <div class="flex items-center gap-1 flex-1 min-w-0">
            <input
              type="range"
              id="track-volume-${track.id}"
              data-track-volume="${track.id}"
              min="0"
              max="200"
              step="1"
              value="${trackVolPercent}"
              aria-label="${escapeHtml(trackVolumeAria)}"
              title="${escapeHtml(trackVolumeTitle)}"
              class="track-volume-slider w-full min-w-[44px] h-1.5 accent-sky-600 rounded-lg appearance-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
            <span
              id="track-volume-val-${track.id}"
              data-track-volume-val="${track.id}"
              class="text-[10px] font-mono font-medium theme-text-secondary shrink-0 tabular-nums w-8 text-right"
            >${trackVolPercent}%</span>
          </div>
        </div>

        <!-- Zona de Carril / Drop zone -->
        <div
          data-track-id="${track.id}"
          class="timeline-lane flex-1 min-w-0 h-16 relative rounded-lg border transition-all duration-150 overflow-x-auto overflow-y-hidden"
        >
          ${clips.length === 0
            ? `<div class="h-full flex items-center justify-center text-xs theme-text-muted italic select-none pointer-events-none px-4">
                 <span>${emptyLaneText}</span>
               </div>`
            : clipsHtml
          }
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = tracksHtml;
}

/**
 * Renderiza el panel de Asistente de IA (#col-ai-panel) en función del clip seleccionado
 * y el estado de su transcripción en state.ai.transcriptByClip (Fase 15).
 */
function renderAiPanel() {
  const btnTranscribe = $('#btn-transcribe-clip');
  const btnTranscribeText = $('#btn-transcribe-text');
  const btnConfirmCleanup = $('#btn-confirm-cleanup');
  const btnCleanAll = $('#btn-ai-clean-all');
  const btnCleanAllText = $('#btn-ai-clean-all-text');
  const transcriptContainer = $('#ai-transcript');

  if (!transcriptContainer) return;

  const selectedClipId = state.selection.clipId;
  let targetClip = null;
  if (selectedClipId) {
    for (const track of state.tracks) {
      const c = track.clips?.find((item) => item.id === selectedClipId);
      if (c) {
        targetClip = c;
        break;
      }
    }
  }

  // 1. Sin clip seleccionado
  if (!targetClip) {
    if (btnTranscribe) {
      btnTranscribe.disabled = true;
      btnTranscribe.setAttribute('aria-disabled', 'true');
      if (btnTranscribeText) btnTranscribeText.textContent = typeof t === 'function' ? t('aiPanel.transcribe') : 'Transcribir';
    }
    if (btnConfirmCleanup) {
      btnConfirmCleanup.classList.add('hidden');
    }
    if (btnCleanAll) {
      btnCleanAll.disabled = true;
      btnCleanAll.setAttribute('aria-disabled', 'true');
      if (btnCleanAllText) btnCleanAllText.textContent = typeof t === 'function' ? t('aiPanel.ctaBtn') : 'Limpiar Audio con IA';
    }

    transcriptContainer.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-xl theme-empty-box">
        <div class="w-12 h-12 rounded-full border flex items-center justify-center theme-ai-icon-wrapper mb-3 shadow-sm">
          <i data-lucide="message-square-text" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xs font-semibold theme-text-primary mb-1">${typeof t === 'function' ? t('aiPanel.transcriptEmptyTitle') : 'La transcripción aparecerá aquí'}</h3>
        <p class="text-[11px] theme-text-secondary leading-relaxed max-w-[210px]">
          ${typeof t === 'function' ? t('aiPanel.transcriptEmptyDesc') : 'El modelo transcribirá tus archivos de audio y resaltará muletillas y silencios automáticamente.'}
        </p>
        <span class="mt-3 text-[11px] font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full text-center">
          ${typeof t === 'function' ? t('aiPanel.emptyStateHint') : 'Selecciona un clip en la línea de tiempo para comenzar'}
        </span>
      </div>
    `;
    renderIcons();
    return;
  }

  // 2. Con clip seleccionado: consultar estado
  const clipData = state.ai.transcriptByClip?.[targetClip.id];
  const status = clipData?.status || 'idle';
  const segments = clipData?.segments || [];
  const markedCount = segments.filter((s) => s.markedForDeletion).length;
  const fillerCount = segments.filter((s) => s.isFiller).length;

  // Botón Transcribir / Volver a transcribir
  if (btnTranscribe) {
    if (status === 'processing') {
      btnTranscribe.disabled = true;
      btnTranscribe.setAttribute('aria-disabled', 'true');
      if (btnTranscribeText) btnTranscribeText.textContent = typeof t === 'function' ? (t('aiPanel.transcribingReal') || t('aiPanel.processing')) : 'Transcribiendo con IA...';
    } else {
      btnTranscribe.disabled = false;
      btnTranscribe.removeAttribute('aria-disabled');
      const label = status === 'done'
        ? (typeof t === 'function' ? t('aiPanel.retranscribe') : 'Volver a transcribir')
        : (typeof t === 'function' ? t('aiPanel.transcribe') : 'Transcribir');
      if (btnTranscribeText) btnTranscribeText.textContent = label;
    }
  }

  // Botón Confirmar borrado manual (corte por segmentos)
  if (btnConfirmCleanup) {
    if (status === 'done' && markedCount > 0) {
      btnConfirmCleanup.classList.remove('hidden');
      const tooltip = typeof t === 'function'
        ? (t('aiPanel.confirmCleanupSegments', { count: markedCount }) || `${t('aiPanel.confirmCleanup')} (${markedCount})`)
        : `Cortar audio (${markedCount})`;
      btnConfirmCleanup.title = tooltip;
      btnConfirmCleanup.setAttribute('aria-label', tooltip);
    } else {
      btnConfirmCleanup.classList.add('hidden');
    }
  }

  // Botón Limpieza masiva con IA
  if (btnCleanAll) {
    if (state.ai.isMassCleaning) {
      btnCleanAll.disabled = true;
      btnCleanAll.setAttribute('aria-disabled', 'true');
      if (btnCleanAllText) btnCleanAllText.textContent = typeof t === 'function' ? t('aiPanel.processing') : 'Procesando...';
    } else if (status === 'done' && fillerCount > 0) {
      btnCleanAll.disabled = false;
      btnCleanAll.removeAttribute('aria-disabled');
      const label = typeof t === 'function' ? t('aiPanel.cleanAllWithCount', { count: fillerCount }) : `Limpiar Audio con IA (${fillerCount} detectadas)`;
      if (btnCleanAllText) btnCleanAllText.textContent = label;
    } else {
      btnCleanAll.disabled = true;
      btnCleanAll.setAttribute('aria-disabled', 'true');
      if (btnCleanAllText) btnCleanAllText.textContent = typeof t === 'function' ? t('aiPanel.ctaBtn') : 'Limpiar Audio con IA';
    }
  }

  // Contenido de la transcripción
  if (status === 'idle') {
    transcriptContainer.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-xl theme-empty-box">
        <div class="w-12 h-12 rounded-full border flex items-center justify-center theme-ai-icon-wrapper mb-3 shadow-sm">
          <i data-lucide="message-square-text" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xs font-semibold theme-text-primary mb-1">${typeof t === 'function' ? t('aiPanel.transcriptEmptyTitle') : 'La transcripción aparecerá aquí'}</h3>
        <p class="text-[11px] theme-text-secondary leading-relaxed max-w-[210px]">
          ${typeof t === 'function' ? t('aiPanel.transcriptEmptyDesc') : 'El modelo transcribirá tus archivos de audio y resaltará muletillas y silencios automáticamente.'}
        </p>
        <span class="mt-3 text-[11px] font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full text-center">
          ${typeof t === 'function' ? t('aiPanel.selectedClipHint') : 'Clip seleccionado. Haz clic en «Transcribir» para comenzar.'}
        </span>
      </div>
    `;
  } else if (status === 'processing') {
    transcriptContainer.innerHTML = `
      <div id="ai-transcript-loading" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div class="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 shadow-lg glow-ai animate-ai-pulse">
          <i data-lucide="sparkles" class="w-7 h-7"></i>
        </div>
        <h4 class="text-xs font-semibold theme-text-primary mb-1 animate-pulse">
          ${typeof t === 'function' ? (t('aiPanel.transcribingReal') || t('aiPanel.processing')) : 'Transcribiendo con IA...'}
        </h4>
        <p class="text-[11px] theme-text-muted">
          ${escapeHtml(targetClip.name)} (${formatDuration(targetClip.duration)})
        </p>
      </div>
    `;
  } else if (status === 'error') {
    const errorMsg = clipData?.errorMessage ? (typeof t === 'function' ? t(clipData.errorMessage) : clipData.errorMessage) : (typeof t === 'function' ? t('aiPanel.networkError') : 'Error al transcribir');
    transcriptContainer.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-red-500/20 rounded-xl theme-empty-box">
        <div class="w-12 h-12 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-500 mb-3 shadow-sm">
          <i data-lucide="alert-triangle" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xs font-semibold text-red-500 mb-1">${typeof t === 'function' ? t('common.error') : 'Error'}</h3>
        <p class="text-[11px] theme-text-secondary leading-relaxed max-w-[210px]">
          ${escapeHtml(errorMsg)}
        </p>
        <span class="mt-3 text-[11px] font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full text-center">
          ${typeof t === 'function' ? t('aiPanel.selectedClipHint') : 'Haz clic en «Transcribir» para reintentar'}
        </span>
      </div>
    `;
  } else if (status === 'done') {
    const summaryFillersText = fillerCount > 0
      ? (typeof t === 'function' ? t('aiPanel.fillersCount', { count: fillerCount }) : `${fillerCount} muletillas detectadas`)
      : (typeof t === 'function' ? t('aiPanel.noFillers') : 'Sin muletillas detectadas');

    const chipsHtml = segments.map((seg) => {
      let classes = 'ai-word-chip ';
      if (seg.isFiller) {
        classes += 'ai-word-filler ';
      }
      if (seg.markedForDeletion) {
        classes += 'ai-word-marked ';
      }

      const wordAria = seg.isFiller
        ? (typeof t === 'function' ? t('aiPanel.fillerSegmentAria', { text: seg.text }) : `Muletilla: ${seg.text}`)
        : (typeof t === 'function' ? t('aiPanel.segmentAria', { text: seg.text }) : `Segmento: ${seg.text}`);

      const stateAria = seg.markedForDeletion
        ? (typeof t === 'function' ? t('aiPanel.markedAria') : 'Marcada para eliminar')
        : (typeof t === 'function' ? t('aiPanel.notMarkedAria') : 'No marcada');

      const fullAria = `${wordAria}, ${stateAria}`;

      return `
        <span
          id="seg-${seg.id}"
          data-segment-id="${seg.id}"
          role="button"
          tabindex="0"
          aria-pressed="${seg.markedForDeletion ? 'true' : 'false'}"
          aria-label="${escapeHtml(fullAria)}"
          class="${classes.trim()} inline-block my-1"
        >${escapeHtml(seg.text)}</span>
      `;
    }).join(' ');

    transcriptContainer.innerHTML = `
      <div id="ai-transcript-segments" class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between text-[11px] font-medium pb-2 border-b theme-text-secondary">
          <span class="truncate max-w-[170px] font-semibold theme-text-primary">${escapeHtml(targetClip.name)}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full ${fillerCount > 0 ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30' : 'theme-text-muted'}">
            ${summaryFillersText}
          </span>
        </div>
        <div class="leading-relaxed p-1 flex flex-wrap gap-1.5 items-center">
          ${chipsHtml || `<span class="italic text-xs theme-text-muted">${typeof t === 'function' ? t('aiPanel.noWordsDetected') : 'Clip vacío o sin palabras detectadas.'}</span>`}
        </div>
      </div>
    `;
  }

  renderIcons();
}

/**
 * ÚNICO punto de invocación de Lucide Icons en el ciclo de vida.
 */
function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Ciclo completo de renderizado sincronizado con el Store central.
 * @param {typeof state} [currentState]
 * @param {typeof state} [prevState]
 */
function renderAll(currentState = state, prevState) {
  const isInitial = !prevState;

  const projectChanged = isInitial || (
    currentState.project !== prevState.project
  );

  const libraryChanged = isInitial || (
    currentState.library !== prevState.library ||
    currentState.selection.libraryId !== prevState.selection.libraryId
  );

  const tracksChanged = isInitial || (
    currentState.tracks !== prevState.tracks ||
    currentState.selection.clipId !== prevState?.selection?.clipId ||
    currentState.project.zoom !== prevState?.project?.zoom
  );

  const aiChanged = isInitial || (
    currentState.ai !== prevState?.ai ||
    currentState.selection.clipId !== prevState?.selection?.clipId ||
    currentState.tracks !== prevState?.tracks
  );

  if (projectChanged) {
    renderTopbar();
    renderTransport();
  }

  if (libraryChanged) {
    renderLibraryList();
    renderLibraryCount();
  }

  if (tracksChanged || projectChanged) {
    renderTimelineRuler();
    renderTimelineTracks();
    renderTransport();
    renderClipToolbar();
  }

  if (aiChanged) {
    renderAiPanel();
  }

  renderIcons();

  // Detección de cambios persistentes para autoguardado en backend (Fase 13)
  if (!isInitial) {
    const dataChanged = (
      currentState.tracks !== prevState?.tracks ||
      currentState.library !== prevState?.library ||
      currentState.project.title !== prevState?.project?.title ||
      (currentState.project.status !== prevState?.project?.status && currentState.project.status === 'draft')
    );

    if (dataChanged) {
      scheduleAutoSave();
    }
  }
}

/* ==========================================================================
   5.1 THEME MANAGEMENT (Fase A: Claro por Defecto / Oscuro)
   ========================================================================== */

/**
 * Obtiene el tema activo actual ('light' o 'dark').
 * Si no está configurado, retorna 'light' como valor por defecto contractual.
 * @returns {'light' | 'dark'}
 */
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Aplica el tema a <html>, actualiza el botón de toggle e icono Lucide,
 * y persiste la preferencia en localStorage.
 * @param {'light' | 'dark'} theme
 */
function applyTheme(theme) {
  const finalTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', finalTheme);

  try {
    localStorage.setItem('podcastcraft-theme', finalTheme);
  } catch (err) {
    console.warn('[PodcastCraft AI] No se pudo guardar la preferencia de tema en localStorage:', err);
  }

  ['btn-theme-toggle', 'auth-theme-toggle'].forEach((id) => {
    const toggleBtn = document.getElementById(id);
    if (toggleBtn) {
      const isDark = finalTheme === 'dark';
      const label = isDark
        ? (typeof t === 'function' ? t('theme.switchToLight') : 'Cambiar a modo claro')
        : (typeof t === 'function' ? t('theme.switchToDark') : 'Cambiar a modo oscuro');
      toggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', label);
      toggleBtn.setAttribute('title', label);
      toggleBtn.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-4 h-4"></i>`;
    }
  });
  renderIcons();
}

/**
 * Alterna entre tema claro y tema oscuro.
 */
function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}


/* ==========================================================================
   6.0 LOCAL AUTHENTICATION & LOCK SCREEN (Fase 17)
   ========================================================================== */

const authState = {
  isConfigured: false,
  isAuthenticated: false,
  currentUser: null,
  isChecking: true,
  offline: false
};

window.PodcastCraftAuth = authState;

let appHydrated = false;

/**
 * Consulta el estado de configuración de la autenticación local en el backend.
 * @returns {Promise<boolean>} Devuelve true si la petición fue exitosa.
 */
async function checkAuthStatus() {
  authState.isChecking = true;
  const errorBanner = $('#auth-error-banner');
  if (errorBanner) errorBanner.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/status`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }

    const data = await res.json();
    authState.isConfigured = Boolean(data.configured);
    authState.offline = false;
    authState.isChecking = false;
    renderAuthScreen();
    return true;
  } catch (err) {
    console.warn('[PodcastCraft AI] Backend de autenticación no disponible:', err);
    authState.offline = true;
    authState.isChecking = false;
    renderAuthScreen();
    return false;
  }
}

/**
 * Renderiza los textos, estados e inputs de la pantalla de bloqueo.
 */
function renderAuthScreen() {
  const lockScreen = $('#auth-lock-screen');
  if (!lockScreen) return;

  const authForm = $('#auth-form');
  const offlineBanner = $('#auth-offline-banner');
  const errorBanner = $('#auth-error-banner');
  const titleEl = $('#auth-title');
  const subtitleEl = $('#auth-subtitle');
  const submitTextEl = $('#auth-submit-text');
  const submitIconEl = $('#auth-submit-icon');

  if (authState.offline) {
    if (authForm) authForm.classList.add('hidden');
    if (errorBanner) errorBanner.classList.add('hidden');
    if (offlineBanner) offlineBanner.classList.remove('hidden');
    renderIcons();
    return;
  }

  // Backend conectado y activo
  if (offlineBanner) offlineBanner.classList.add('hidden');
  if (authForm) authForm.classList.remove('hidden');

  if (!authState.isConfigured) {
    if (titleEl) titleEl.textContent = typeof t === 'function' ? t('auth.setupTitle') : 'Configuración Inicial';
    if (subtitleEl) subtitleEl.textContent = typeof t === 'function' ? t('auth.setupSubtitle') : 'Crea tu usuario y contraseña de acceso local.';
    if (submitTextEl) submitTextEl.textContent = typeof t === 'function' ? t('auth.createAccount') : 'Crear cuenta';
    if (submitIconEl) submitIconEl.setAttribute('data-lucide', 'user-plus');
  } else {
    if (titleEl) titleEl.textContent = typeof t === 'function' ? t('auth.loginTitle') : 'Pantalla de Bloqueo';
    if (subtitleEl) subtitleEl.textContent = typeof t === 'function' ? t('auth.loginSubtitle') : 'Ingresa tus credenciales para acceder al editor.';
    if (submitTextEl) submitTextEl.textContent = typeof t === 'function' ? t('auth.login') : 'Iniciar sesión';
    if (submitIconEl) submitIconEl.setAttribute('data-lucide', 'log-in');
  }

  renderIcons();
}

/**
 * Muestra un mensaje de error en la pantalla de bloqueo.
 * @param {string} message
 */
function showAuthError(message) {
  const errorBanner = $('#auth-error-banner');
  const errorText = $('#auth-error-text');
  if (errorBanner && errorText) {
    errorText.textContent = message;
    errorBanner.classList.remove('hidden');
    renderIcons();
  }
}

/**
 * Procesa el envío del formulario de login o de configuración inicial.
 * @param {Event} e
 */
async function handleAuthSubmit(e) {
  e.preventDefault();
  const errorBanner = $('#auth-error-banner');
  if (errorBanner) errorBanner.classList.add('hidden');

  const usernameInput = $('#auth-username');
  const passwordInput = $('#auth-password');
  const submitBtn = $('#auth-submit-btn');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!username) {
    showAuthError(typeof t === 'function' ? t('auth.usernameRequired') : 'Debes ingresar un nombre de usuario.');
    if (usernameInput) usernameInput.focus();
    return;
  }

  if (!password || password.length < 6) {
    showAuthError(typeof t === 'function' ? t('auth.passwordTooShort') : 'La contraseña debe tener al menos 6 caracteres.');
    if (passwordInput) passwordInput.focus();
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-70', 'cursor-wait');
  }

  const endpoint = !authState.isConfigured ? '/api/auth/setup' : '/api/auth/login';

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const defaultErr = !authState.isConfigured
        ? (data.error || 'Error al crear la cuenta.')
        : (typeof t === 'function' ? t('auth.invalidCredentials') : 'Credenciales incorrectas.');
      showAuthError(data.error || defaultErr);
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
      }
      return;
    }

    // Éxito: marcamos autenticación y entramos a la app
    authState.isConfigured = true;
    await onAuthSuccess(data.username || username);
  } catch (err) {
    console.error('[PodcastCraft AI] Error de red en autenticación:', err);
    showAuthError(typeof t === 'function' ? t('auth.connectingError') : 'No se pudo conectar con el servidor local para iniciar sesión.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-70', 'cursor-wait');
    }
  }
}

/**
 * Transición tras login exitoso: oculta lock screen y muestra el workspace.
 * @param {string} username
 */
async function onAuthSuccess(username) {
  authState.isAuthenticated = true;
  authState.currentUser = username;

  const lockScreen = $('#auth-lock-screen');
  const topbar = $('#topbar');
  const workspace = $('#workspace');
  const transport = $('#transport');
  const passwordInput = $('#auth-password');

  if (passwordInput) passwordInput.value = '';
  if (lockScreen) lockScreen.classList.add('hidden');
  if (topbar) topbar.classList.remove('hidden');
  if (workspace) workspace.classList.remove('hidden');
  if (transport) transport.classList.remove('hidden');

  // Si aún no se hidrató el proyecto desde el backend, cargarlo ahora
  if (!appHydrated) {
    await loadProjectFromBackend();
    appHydrated = true;
  }

  renderAll();
  updateUndoButtonState();
  renderTimelineRuler();
  renderIcons();
  console.info(`[PodcastCraft AI] Usuario "${username}" autenticado exitosamente.`);
}

/**
 * Cierre de sesión voluntario (bloqueo local de pantalla sin reiniciar el backend ni perder estado).
 */
function logout() {
  if (state.project.isPlaying) {
    if (typeof pausePlayback === 'function') {
      pausePlayback();
    } else {
      if (typeof stopAllAudioSources === 'function') {
        stopAllAudioSources();
      }
      if (typeof stopPlayheadLoop === 'function') {
        stopPlayheadLoop();
      }
      setState({ project: { isPlaying: false } });
    }
  }

  authState.isAuthenticated = false;
  authState.currentUser = null;

  const lockScreen = $('#auth-lock-screen');
  const topbar = $('#topbar');
  const workspace = $('#workspace');
  const transport = $('#transport');
  const passwordInput = $('#auth-password');
  const errorBanner = $('#auth-error-banner');

  if (topbar) topbar.classList.add('hidden');
  if (workspace) workspace.classList.add('hidden');
  if (transport) transport.classList.add('hidden');

  if (passwordInput) passwordInput.value = '';
  if (errorBanner) errorBanner.classList.add('hidden');

  if (lockScreen) {
    lockScreen.classList.remove('hidden');
    renderAuthScreen();
    if (passwordInput) passwordInput.focus();
  }

  console.info('[PodcastCraft AI] Sesión cerrada. Pantalla de bloqueo activada.');
}

/**
 * Vincula los eventos específicos de la pantalla de bloqueo.
 */
function bindAuthEvents() {
  const authForm = $('#auth-form');
  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
  }

  const retryBtn = $('#auth-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', async () => {
      retryBtn.classList.add('animate-spin');
      await checkAuthStatus();
      retryBtn.classList.remove('animate-spin');
    });
  }

  const authThemeToggle = $('#auth-theme-toggle');
  if (authThemeToggle) {
    authThemeToggle.addEventListener('click', toggleTheme);
  }

  const authLangToggle = $('#auth-language-toggle');
  if (authLangToggle) {
    authLangToggle.addEventListener('click', () => {
      const current = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'es';
      const nextLang = current === 'es' ? 'en' : 'es';
      if (typeof setLanguage === 'function') {
        setLanguage(nextLang);
      }
      if (typeof applyTranslations === 'function') {
        applyTranslations();
      }
    });
  }
}


/* ==========================================================================
   6.1 PERSISTENCE & BACKEND API (Sprint 6)
   ========================================================================== */


let saveDebounceTimer = null;
let isSaving = false;

/**
 * Programa el guardado automático en el backend con un debounce de 1.5s.
 * Marca visualmente el proyecto en estado 'Borrador' de inmediato mientras
 * el debounce está pendiente.
 */
function scheduleAutoSave() {
  if (state.project.status !== 'draft') {
    state.project.status = 'draft';
    renderTopbar();
  }

  if (saveDebounceTimer !== null) {
    clearTimeout(saveDebounceTimer);
  }
  saveDebounceTimer = setTimeout(async () => {
    saveDebounceTimer = null;
    await saveProjectToBackend();
  }, 1500);
}

/**
 * Serializa y envía el estado del proyecto al backend vía PUT /api/project.
 */
async function saveProjectToBackend() {
  if (isSaving) {
    scheduleAutoSave();
    return;
  }
  isSaving = true;

  try {
    const payload = {
      project: {
        title: state.project.title,
        status: 'saved'
      },
      library: state.library.map((item) => ({
        id: item.id,
        name: item.name,
        duration: item.duration,
        url: item.url || (item.objectUrl ? item.objectUrl.replace(API_BASE_URL, '') : '')
      })),
      tracks: state.tracks.map((t) => ({
        id: t.id,
        colorIndex: t.colorIndex,
        volume: typeof t.volume === 'number' ? t.volume : 1,
        clips: (t.clips || []).map((c) => ({
          id: c.id,
          libraryId: c.libraryId,
          name: c.name,
          start: c.start,
          duration: c.duration,
          sourceOffset: typeof c.sourceOffset === 'number' ? c.sourceOffset : 0,
          volume: typeof c.volume === 'number' ? c.volume : 1
        }))
      }))
    };

    const res = await fetch(`${API_BASE_URL}/api/project`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    // Solo actualizar a 'saved' si no entraron nuevos cambios durante la llamada HTTP
    if (saveDebounceTimer === null) {
      setState({ project: { status: 'saved' } });
    }
    console.info('[PodcastCraft AI] Proyecto guardado exitosamente en backend.');
  } catch (err) {
    console.warn('[PodcastCraft AI] Error al persistir proyecto en backend:', err);
    state.project.status = 'draft';
    renderTopbar();
    const saveErrorMsg = typeof t === 'function'
      ? t('topbar.feedbackSaveError')
      : 'No se pudo guardar en el servidor local. Verifica que el backend esté corriendo.';
    showImportFeedback(saveErrorMsg);
  } finally {
    isSaving = false;
  }
}

/**
 * Carga el estado guardado del proyecto desde el backend vía GET /api/project.
 * Si el backend no está disponible, cae de vuelta silenciosamente al estado inicial local.
 */
async function loadProjectFromBackend() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${API_BASE_URL}/api/project`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || typeof data !== 'object') return;

    if (data.project?.title) {
      state.project.title = data.project.title;
    }
    state.project.status = data.project?.status || 'draft';

    if (Array.isArray(data.library)) {
      state.library = data.library.map((item) => ({
        id: item.id,
        name: item.name,
        duration: typeof item.duration === 'number' ? item.duration : 0,
        url: item.url,
        objectUrl: item.url ? `${API_BASE_URL}${item.url}` : null,
        icon: 'file-audio',
        isImported: true
      }));
    }

    if (Array.isArray(data.tracks)) {
      state.tracks = data.tracks.map((t) => ({
        id: t.id,
        colorIndex: typeof t.colorIndex === 'number' ? t.colorIndex : 0,
        volume: typeof t.volume === 'number' ? t.volume : 1,
        clips: Array.isArray(t.clips)
          ? t.clips.map((c) => {
              const libItem = state.library.find((l) => l.id === c.libraryId);
              return {
                id: c.id,
                libraryId: c.libraryId,
                name: c.name || (libItem ? libItem.name : 'Clip'),
                start: typeof c.start === 'number' ? c.start : 0,
                duration: typeof c.duration === 'number' ? c.duration : 0,
                sourceOffset: typeof c.sourceOffset === 'number' ? c.sourceOffset : 0,
                volume: typeof c.volume === 'number' ? c.volume : 1,
                objectUrl: libItem ? libItem.objectUrl : null
              };
            })
          : []
      }));

      // Recomputar duración total del proyecto a partir de los clips cargados
      state.project.duration = recomputeProjectDuration(state.tracks);


      // Precarga en segundo plano de todos los buffers decodificados en memoria (Fase 22)
      if (typeof preloadAllLibraryBuffers === 'function') {
        preloadAllLibraryBuffers();
      }
    }

    console.info('[PodcastCraft AI] Proyecto cargado exitosamente desde backend.');
  } catch (err) {
    console.warn('[PodcastCraft AI] Servidor local no disponible o inaccesible. Modo de sesión local activo:', err.message);
    state.project.title = 'Untitled Project';
    state.project.status = 'draft';
    state.library = [];
    state.tracks = [];
    state.project.duration = 0;
    const offlineMsg = typeof t === 'function'
      ? t('topbar.feedbackServerOffline')
      : 'Servidor local no detectado. Los cambios se mantendrán solo durante esta sesión.';
    showImportFeedback(offlineMsg);
  }
}


/* ==========================================================================
   7. AUDIO ENGINE & TRANSPORT EVENTS (Web Audio API — Fase 22)
   ========================================================================== */

/**
 * Instancia singleton de AudioContext para la estación de trabajo (Web Audio API).
 */
let audioContext = null;

/**
 * Nodo maestro de ganancia conectado directamente a audioContext.destination.
 */
let masterGain = null;

/**
 * Caché en memoria de AudioBuffer por libraryId: Map<string, AudioBuffer>.
 */
const audioBufferCache = new Map();

/**
 * Promesas en vuelo de carga/decodificación por libraryId para evitar solicitudes duplicadas.
 */
const audioBufferLoadingPromises = new Map();

/**
 * Fuentes activas en reproducción: Array<{ source, clipGain, trackGain, clipId, trackId }>.
 */
let activeAudioSources = [];

/**
 * Nodos de ganancia por carril: Map<trackId, GainNode>.
 */
const trackGainNodes = new Map();

/**
 * Variables del reloj de transporte (Fase 22):
 * - transportStartPos: segundos del timeline al dar Play o seek.
 * - transportStartCtxTime: audioContext.currentTime al dar Play o seek.
 * - LEAD_TIME: margen de anticipación de 50ms para programar hardware audio clock sin jitter.
 */
let transportStartPos = 0;
let transportStartCtxTime = 0;
const LEAD_TIME = 0.05;

/**
 * Identificador activo de requestAnimationFrame para el bucle de sincronización del playhead.
 */
let playheadRafId = null;

/**
 * Timer de debounce para reprogramación fluida tras cambios estructurales en caliente.
 */
let rescheduleDebounceTimer = null;

/**
 * Temporizador de respaldo para detección de fin de reproducción garantizado.
 */
let playbackEndTimer = null;

/**
 * Obtiene o inicializa perezosamente el AudioContext y el nodo masterGain.
 * @returns {AudioContext}
 */
function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtx();
    masterGain = audioContext.createGain();
    const initialVol = state.project.isMuted ? 0 : ((state.project.volume ?? 100) / 100);
    masterGain.gain.setValueAtTime(initialVol, audioContext.currentTime);
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

/**
 * Muestra u oculta el indicador de preparación de buffers en la barra de transporte.
 * @param {boolean} show
 */
function showAudioPreparing(show) {
  const el = $('#audio-loading-status');
  if (el) {
    if (show) {
      el.textContent = typeof t === 'function' ? t('transport.preparingAudio') : 'Preparando audio…';
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }
}

/**
 * Carga y decodifica un archivo de audio a AudioBuffer mediante caché por libraryId.
 * @param {string} libraryId
 * @returns {Promise<AudioBuffer>}
 */
async function loadAudioBuffer(libraryId) {
  if (audioBufferCache.has(libraryId)) {
    return audioBufferCache.get(libraryId);
  }
  if (audioBufferLoadingPromises.has(libraryId)) {
    return audioBufferLoadingPromises.get(libraryId);
  }

  const libItem = state.library.find((item) => item.id === libraryId);
  if (!libItem || !libItem.objectUrl) {
    throw new Error(`Ítem de biblioteca no encontrado para ID: ${libraryId}`);
  }

  const promise = (async () => {
    try {
      const ctx = getAudioContext();
      const res = await fetch(libItem.objectUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} al descargar audio: ${libItem.objectUrl}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioBufferCache.set(libraryId, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.error(`[PodcastCraft AI] Error al decodificar audio de biblioteca (${libraryId}):`, err);
      throw err;
    } finally {
      audioBufferLoadingPromises.delete(libraryId);
    }
  })();

  audioBufferLoadingPromises.set(libraryId, promise);
  return promise;
}

/**
 * Precarga en segundo plano todos los audios de la biblioteca sin congelar la interfaz.
 */
function preloadAllLibraryBuffers() {
  if (!state.library || state.library.length === 0) return;
  for (const item of state.library) {
    if (item.id && !audioBufferCache.has(item.id)) {
      loadAudioBuffer(item.id).catch((err) => {
        console.warn(`[PodcastCraft AI] Precarga en segundo plano omitida para ${item.id}:`, err.message);
      });
    }
  }
}

/**
 * Sincroniza el volumen maestro y estado de silencio en tiempo real con setTargetAtTime.
 */
function syncMasterVolume() {
  if (!audioContext || !masterGain) return;
  const targetVol = state.project.isMuted ? 0 : ((state.project.volume ?? 100) / 100);
  masterGain.gain.setTargetAtTime(targetVol, audioContext.currentTime, 0.01);
}

/**
 * Detiene y desconecta todas las fuentes de audio activas del AudioContext.
 */
function stopAllAudioSources() {
  for (const item of activeAudioSources) {
    try {
      item.source.stop();
      item.source.disconnect();
    } catch (_) {}
    try {
      item.clipGain.disconnect();
    } catch (_) {}
  }
  activeAudioSources = [];
  if (playbackEndTimer !== null) {
    clearTimeout(playbackEndTimer);
    playbackEndTimer = null;
  }
}

/**
 * Calcula la posición temporal actual del transporte en segundos absolutos de la línea de tiempo.
 * getTransportTime() = transportStartPos + (ctx.currentTime - transportStartCtxTime - lead).
 * @returns {number}
 */
function getTransportTime() {
  if (!state.project.isPlaying || !audioContext) {
    return state.project.currentTime || 0;
  }
  const elapsed = audioContext.currentTime - transportStartCtxTime - LEAD_TIME;
  return transportStartPos + Math.max(0, elapsed);
}

/**
 * Programa todos los clips de todos los carriles en el AudioContext desde fromTime.
 * Cadena por clip: source -> clipGain (clip.volume ?? 1) -> trackGain (track.volume ?? 1) -> masterGain -> destination.
 * Sin redondeo de start/duration/sourceOffset para garantizar empalme sin huecos.
 * @param {number} fromTime
 */
function scheduleAudioClips(fromTime) {
  const ctx = getAudioContext();
  const lead = LEAD_TIME;

  for (const track of state.tracks) {
    if (!track.clips || track.clips.length === 0) continue;

    // Obtener o crear nodo de ganancia para este carril
    let trackGain = trackGainNodes.get(track.id);
    if (!trackGain) {
      trackGain = ctx.createGain();
      trackGain.connect(masterGain);
      trackGainNodes.set(track.id, trackGain);
    }
    const tVol = typeof track.volume === 'number' ? track.volume : 1;
    trackGain.gain.setValueAtTime(tVol, ctx.currentTime);

    for (const clip of track.clips) {
      const clipStart = clip.start || 0;
      const clipDuration = clip.duration || 0;
      const clipSourceOffset = typeof clip.sourceOffset === 'number' ? clip.sourceOffset : 0;
      const clipEnd = clipStart + clipDuration;

      // Programar solo clips cuyo final sea mayor que fromTime
      if (clipEnd <= fromTime) continue;

      const buffer = audioBufferCache.get(clip.libraryId);
      if (!buffer) continue;

      const skip = Math.max(0, fromTime - clipStart);
      const when = ctx.currentTime + lead + Math.max(0, clipStart - fromTime);
      const offset = clipSourceOffset + skip;
      const dur = clipDuration - skip;

      if (dur <= 0) continue;

      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const clipGain = ctx.createGain();
      const cVol = typeof clip.volume === 'number' ? clip.volume : 1;
      clipGain.gain.setValueAtTime(cVol, ctx.currentTime);

      src.connect(clipGain);
      clipGain.connect(trackGain);

      try {
        src.start(when, offset, dur);
      } catch (err) {
        console.warn(`[PodcastCraft AI] Error al programar reproducción de clip ${clip.id}:`, err);
        continue;
      }

      const activeRecord = {
        source: src,
        clipGain: clipGain,
        trackGain: trackGain,
        clipId: clip.id,
        trackId: track.id
      };
      activeAudioSources.push(activeRecord);

      src.onended = () => {
        const idx = activeAudioSources.indexOf(activeRecord);
        if (idx !== -1) {
          activeAudioSources.splice(idx, 1);
        }
      };
    }
  }
}

/**
 * Inicia el bucle de animación del playhead a 60 FPS mediante rAF leyendo getTransportTime().
 */
function startPlayheadLoop() {
  if (playheadRafId !== null) return;
  const playheadEl = $('#timeline-playhead');
  const currentTimeEl = $('#current-time');

  function tick() {
    if (!state.project.isPlaying) {
      playheadRafId = null;
      return;
    }
    const currentSec = getTransportTime();
    const duration = state.project.duration || 0;

    // Al llegar a la duración total del proyecto: detener todo y dejar el playhead al final
    if (duration > 0 && currentSec >= duration) {
      stopAllAudioSources();
      stopPlayheadLoop();
      setState({ project: { isPlaying: false, currentTime: duration } });
      if (playheadEl) {
        playheadEl.style.transform = `translateX(${timeToPixels(duration)}px)`;
      }
      if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(duration);
      }
      return;
    }

    if (playheadEl) {
      playheadEl.style.transform = `translateX(${timeToPixels(currentSec)}px)`;
    }
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(currentSec);
    }

    playheadRafId = requestAnimationFrame(tick);
  }

  playheadRafId = requestAnimationFrame(tick);
}

/**
 * Detiene y cancela de forma inmediata el bucle de animación del playhead.
 */
function stopPlayheadLoop() {
  if (playheadRafId !== null) {
    cancelAnimationFrame(playheadRafId);
    playheadRafId = null;
  }
}

/**
 * Inicia la reproducción continua en Web Audio API desde fromTime o la posición actual del store.
 * @param {number} [explicitFromTime]
 */
async function startPlayback(explicitFromTime) {
  const totalClips = state.tracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);
  if (totalClips === 0) return;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (err) {
      console.warn('[PodcastCraft AI] Error al reanudar AudioContext:', err);
    }
  }

  let fromTime = typeof explicitFromTime === 'number' ? explicitFromTime : (state.project.currentTime || 0);
  const duration = state.project.duration || 0;
  // Si el playhead está al final o muy cerca, reiniciar desde 0
  if (duration > 0 && fromTime >= duration - 0.01) {
    fromTime = 0;
    setState({ project: { currentTime: 0 } });
  }

  // Verificar si faltan buffers por decodificar en memoria
  const neededLibraryIds = new Set();
  for (const t of state.tracks) {
    for (const c of (t.clips || [])) {
      if (c.libraryId) neededLibraryIds.add(c.libraryId);
    }
  }

  const missingIds = Array.from(neededLibraryIds).filter((id) => !audioBufferCache.has(id));
  if (missingIds.length > 0) {
    showAudioPreparing(true);
    try {
      await Promise.all(missingIds.map((id) => loadAudioBuffer(id)));
    } catch (err) {
      console.error('[PodcastCraft AI] Error al decodificar buffers requeridos:', err);
      showAudioPreparing(false);
      const errMsg = typeof t === 'function' ? t('transport.audioDecodeError') : 'Error al decodificar audio de la biblioteca';
      showToast(errMsg, 'error');
      return;
    } finally {
      showAudioPreparing(false);
    }
  }

  stopAllAudioSources();

  transportStartPos = fromTime;
  transportStartCtxTime = ctx.currentTime;

  scheduleAudioClips(fromTime);

  setState({ project: { isPlaying: true, currentTime: fromTime } });
  startPlayheadLoop();

  // Temporizador de respaldo para fin de reproducción
  clearTimeout(playbackEndTimer);
  const remainingSec = duration - fromTime;
  if (duration > 0 && remainingSec > 0) {
    playbackEndTimer = setTimeout(() => {
      if (!state.project.isPlaying) return;
      stopAllAudioSources();
      stopPlayheadLoop();
      setState({ project: { isPlaying: false, currentTime: duration } });
      const playheadEl = $('#timeline-playhead');
      if (playheadEl) {
        playheadEl.style.transform = `translateX(${timeToPixels(duration)}px)`;
      }
      const currentTimeEl = $('#current-time');
      if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(duration);
      }
    }, Math.max(10, Math.round((remainingSec + LEAD_TIME) * 1000)));
  }
}

/**
 * Pausa la reproducción de audio, congela el playhead y desconecta todas las fuentes activas.
 */
function pausePlayback() {
  const currentPos = getTransportTime();
  stopAllAudioSources();
  stopPlayheadLoop();
  setState({ project: { isPlaying: false, currentTime: currentPos } });
  const playheadEl = $('#timeline-playhead');
  if (playheadEl) {
    playheadEl.style.transform = `translateX(${timeToPixels(currentPos)}px)`;
  }
  const currentTimeEl = $('#current-time');
  if (currentTimeEl) {
    currentTimeEl.textContent = formatTime(currentPos);
  }
}

/**
 * Alterna entre Play y Pausa según el estado actual.
 */
async function togglePlay() {
  const totalClips = state.tracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);
  if (totalClips === 0) return;

  if (state.project.isPlaying) {
    pausePlayback();
  } else {
    await startPlayback();
  }
}

/**
 * Reposiciona la línea de tiempo (seek / scrub).
 * Mientras suena: detiene fuentes y reprograma de inmediato desde la nueva posición.
 * En pausa: desplaza el playhead y actualiza el contador.
 * @param {number} targetSeconds
 */
function seekTo(targetSeconds) {
  const maxDuration = state.project.duration > 0 ? state.project.duration : Infinity;
  const seconds = clamp(targetSeconds, 0, maxDuration);

  if (state.project.isPlaying) {
    stopAllAudioSources();
    const ctx = getAudioContext();
    transportStartPos = seconds;
    transportStartCtxTime = ctx.currentTime;
    scheduleAudioClips(seconds);
    setState({ project: { currentTime: seconds } });

    clearTimeout(playbackEndTimer);
    const remainingSec = maxDuration - seconds;
    if (maxDuration > 0 && isFinite(maxDuration) && remainingSec > 0) {
      playbackEndTimer = setTimeout(() => {
        if (!state.project.isPlaying) return;
        stopAllAudioSources();
        stopPlayheadLoop();
        setState({ project: { isPlaying: false, currentTime: maxDuration } });
        const playheadEl = $('#timeline-playhead');
        if (playheadEl) {
          playheadEl.style.transform = `translateX(${timeToPixels(maxDuration)}px)`;
        }
        const currentTimeEl = $('#current-time');
        if (currentTimeEl) {
          currentTimeEl.textContent = formatTime(maxDuration);
        }
      }, Math.max(10, Math.round((remainingSec + LEAD_TIME) * 1000)));
    }
  } else {
    setState({ project: { currentTime: seconds } });
  }

  const playheadEl = $('#timeline-playhead');
  if (playheadEl) {
    playheadEl.style.transform = `translateX(${timeToPixels(seconds)}px)`;
  }
  const currentTimeEl = $('#current-time');
  if (currentTimeEl) {
    currentTimeEl.textContent = formatTime(seconds);
  }

  const rulerEl = $('#timeline-ruler');
  if (rulerEl) {
    rulerEl.setAttribute('aria-valuenow', Math.round(seconds).toString());
    rulerEl.setAttribute('aria-valuemax', (state.project.duration || 0).toString());
  }
}

/**
 * Reprograma la reproducción en caliente con debounce (150ms) tras cambios estructurales en el timeline.
 * @param {number} [delay=150]
 */
function schedulePlaybackDebounce(delay = 150) {
  if (!state.project.isPlaying) return;
  clearTimeout(rescheduleDebounceTimer);
  rescheduleDebounceTimer = setTimeout(() => {
    if (!state.project.isPlaying) return;
    const currentPos = getTransportTime();
    stopAllAudioSources();
    const ctx = getAudioContext();
    transportStartPos = currentPos;
    transportStartCtxTime = ctx.currentTime;
    scheduleAudioClips(currentPos);

    clearTimeout(playbackEndTimer);
    const dur = state.project.duration || 0;
    const remainingSec = dur - currentPos;
    if (dur > 0 && remainingSec > 0) {
      playbackEndTimer = setTimeout(() => {
        if (!state.project.isPlaying) return;
        stopAllAudioSources();
        stopPlayheadLoop();
        setState({ project: { isPlaying: false, currentTime: dur } });
        const playheadEl = $('#timeline-playhead');
        if (playheadEl) {
          playheadEl.style.transform = `translateX(${timeToPixels(dur)}px)`;
        }
        const currentTimeEl = $('#current-time');
        if (currentTimeEl) {
          currentTimeEl.textContent = formatTime(dur);
        }
      }, Math.max(10, Math.round((remainingSec + LEAD_TIME) * 1000)));
    }
  }, delay);
}

/**
 * Conecta los controles de transporte.
 */
function bindTransportEvents() {
  const btnPlay = $('#btn-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', async () => {
      await togglePlay();
    });
  }

  const btnRewind = $('#btn-rewind');
  if (btnRewind) {
    btnRewind.addEventListener('click', () => {
      const nextTime = getTransportTime() - 5;
      seekTo(nextTime);
    });
  }

  const btnForward = $('#btn-forward');
  if (btnForward) {
    btnForward.addEventListener('click', () => {
      const nextTime = getTransportTime() + 5;
      seekTo(nextTime);
    });
  }

  const volumeSlider = $('#volume-slider');
  if (volumeSlider) {
    const updateVolumeFromInput = (e) => {
      const newVol = clamp(parseInt(e.target.value, 10) || 0, 0, 100);
      setState({
        project: {
          volume: newVol,
          isMuted: newVol === 0
        }
      });
      syncMasterVolume();
    };
    volumeSlider.addEventListener('input', updateVolumeFromInput);
    volumeSlider.addEventListener('change', updateVolumeFromInput);
  }

  const btnMute = $('#btn-mute');
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      const nextMuted = !state.project.isMuted;
      setState({ project: { isMuted: nextMuted } });
      syncMasterVolume();
    });
  }
}

/**
 * Conecta los controles de la barra superior.
 */
function bindTopbarEvents() {
  const zoomSlider = $('#zoom-slider');
  if (zoomSlider) {
    const updateZoomFromInput = (e) => {
      const newZoom = clamp(parseInt(e.target.value, 10) || 0, 0, 100);
      setState({ project: { zoom: newZoom } });
    };
    zoomSlider.addEventListener('input', updateZoomFromInput);
    zoomSlider.addEventListener('change', updateZoomFromInput);
  }

  const btnAiAnalysis = $('#btn-ai-analysis');
  if (btnAiAnalysis) {
    btnAiAnalysis.addEventListener('click', () => {
      console.info('[PodcastCraft AI] Análisis de IA solicitado.');
    });
  }

  const btnExport = $('#btn-export');
  if (btnExport) {
    btnExport.addEventListener('click', async () => {
      await saveProjectToBackend();
    });
  }

  const themeToggleBtn = $('#btn-theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  const langToggleBtn = $('#btn-language-toggle');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      const current = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'es';
      const nextLang = current === 'es' ? 'en' : 'es';
      if (typeof setLanguage === 'function') {
        setLanguage(nextLang);
      }
      if (typeof applyTranslations === 'function') {
        applyTranslations();
      }
    });
  }

  const btnLogout = $('#btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout();
    });
  }
}


/* ==========================================================================
   8. MP3 IMPORT & LIBRARY EVENTS (Sprint 4 — 3)
   ========================================================================== */

let feedbackTimeout = null;

function showImportFeedback(msg) {
  const feedbackEl = $('#import-feedback');
  if (!feedbackEl) return;

  clearTimeout(feedbackTimeout);
  feedbackEl.textContent = msg;
  feedbackEl.classList.remove('hidden');

  feedbackTimeout = setTimeout(() => {
    feedbackEl.classList.add('hidden');
  }, 3500);
}

/**
 * Conecta la importación exclusiva de archivos MP3.
 */
function bindImportAudioEvents() {
  const btnImport = $('#btn-import-audio');
  const fileInput = $('#audio-file-input');

  if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const validFiles = [];
      let rejectedCount = 0;

      for (const file of files) {
        const isMp3 = file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3');
        if (isMp3) {
          validFiles.push(file);
        } else {
          rejectedCount++;
        }
      }

      if (rejectedCount > 0) {
        const feedbackMsg = typeof t === 'function'
          ? (rejectedCount === 1 ? t('library.feedbackOnlyMp3') : t('library.feedbackNonMp3Ignored').replace('{count}', rejectedCount))
          : (rejectedCount === 1 ? 'Solo se permiten archivos MP3' : `${rejectedCount} archivo(s) no eran MP3 y fueron ignorados`);
        showImportFeedback(feedbackMsg);
      }

      if (validFiles.length === 0) {
        fileInput.value = '';
        return;
      }

      const newItems = [];
      for (const file of validFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const res = await fetch(`${API_BASE_URL}/api/audio`, {
            method: 'POST',
            body: formData
          });

          if (!res.ok || res.status !== 201) {
            const errData = await res.json().catch(() => ({}));
            const serverErr = new Error(errData.error || `Error HTTP ${res.status}`);
            serverErr.isServerError = true;
            throw serverErr;
          }

          const audioData = await res.json();
          const backendAudioUrl = `${API_BASE_URL}${audioData.url}`;
          const audio = new Audio(backendAudioUrl);

          const duration = await new Promise((resolve) => {
            const onLoaded = () => {
              cleanup();
              let dur = audio.duration;
              if (!isFinite(dur) || isNaN(dur)) {
                dur = 0;
              }
              resolve(Math.round(dur));
            };
            const onError = () => {
              cleanup();
              resolve(0);
            };
            const timer = setTimeout(() => {
              cleanup();
              resolve(0);
            }, 4000);

            function cleanup() {
              clearTimeout(timer);
              audio.removeEventListener('loadedmetadata', onLoaded);
              audio.removeEventListener('error', onError);
            }

            audio.addEventListener('loadedmetadata', onLoaded);
            audio.addEventListener('error', onError);
          });

          newItems.push({
            id: audioData.id,
            name: audioData.name,
            duration: duration,
            url: audioData.url,
            objectUrl: backendAudioUrl,
            icon: 'file-audio',
            isImported: true
          });
        } catch (uploadErr) {
          console.error('[PodcastCraft AI] Error subiendo archivo MP3 al backend:', uploadErr);
          let errMsg;
          if (uploadErr.isServerError) {
            errMsg = typeof t === 'function'
              ? t('library.uploadError')
              : 'Ocurrió un error al procesar el archivo en el servidor local.';
          } else {
            errMsg = typeof t === 'function'
              ? t('library.backendUnreachable')
              : 'No se pudo conectar con el servidor local. Verifica que el backend esté corriendo.';
          }
          showImportFeedback(errMsg);
        }
      }

      if (newItems.length > 0) {
        setState({
          library: [...state.library, ...newItems]
        });
        // Precarga en segundo plano de buffers de audio en memoria (Fase 22)
        for (const item of newItems) {
          if (typeof loadAudioBuffer === 'function') {
            loadAudioBuffer(item.id).catch(() => {});
          }
        }
        console.info(`[PodcastCraft AI] ${newItems.length} archivo(s) MP3 subido(s) y procesado(s) exitosamente.`);
      }

      fileInput.value = '';
    });
  }

  // Delegación de selección en la biblioteca
  const listContainer = $('#library-list');
  if (listContainer) {
    listContainer.addEventListener('click', (e) => {
      const card = e.target.closest('[data-library-id]');
      if (!card) {
        if (state.selection.libraryId !== null) {
          setState({ selection: { libraryId: null } });
        }
        return;
      }

      const id = card.dataset.libraryId;
      const nextId = state.selection.libraryId === id ? null : id;
      setState({ selection: { libraryId: nextId } });
    });

    listContainer.addEventListener('dragstart', (e) => {
      const card = e.target.closest('[data-library-id]');
      if (!card) return;

      const id = card.dataset.libraryId;
      const item = getLibraryItem(id);
      if (!item) return;

      const payload = {
        libraryId: item.id,
        name: item.name,
        duration: item.duration
      };

      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
      e.dataTransfer.setData('text/plain', item.name);

      card.classList.add('is-dragging');
      setState({ ui: { draggingLibraryId: id } });
    });

    listContainer.addEventListener('dragend', (e) => {
      const card = e.target.closest('[data-library-id]');
      if (card) {
        card.classList.remove('is-dragging');
      } else {
        $$('.is-dragging').forEach((c) => c.classList.remove('is-dragging'));
      }
      setState({ ui: { draggingLibraryId: null } });
    });
  }
}


/* ==========================================================================
   9. TIMELINE & CLIP INTERACTIONS (Sprint 4 — 2, 4, 5, 6, 7)
   ========================================================================== */

// Sesión activa de recorte (Trim)
let activeTrim = null;

/**
 * Conecta todos los eventos del Timeline: creación de carriles, drag & drop genérico,
 * recorte por asas, división por doble clic, renombrado in situ y borrado.
 */
function bindTimelineEvents() {
  // 0. Scrubbing en regla de tiempo (#timeline-ruler) — Sprint 5
  const ruler = $('#timeline-ruler');
  if (ruler) {
    ruler.addEventListener('click', (e) => {
      const scaleEl = $('#timeline-ruler-scale') || ruler;
      const rect = scaleEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      let seconds = pixelsToTime(Math.max(0, clickX));
      const maxDuration = state.project.duration > 0 ? state.project.duration : Infinity;
      seconds = clamp(seconds, 0, maxDuration);
      seekTo(seconds);
    });

    ruler.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const delta = e.key === 'ArrowLeft' ? -5 : 5;
        const maxDur = state.project.duration > 0 ? state.project.duration : Infinity;
        const nextTime = clamp(state.project.currentTime + delta, 0, maxDur);
        seekTo(nextTime);
      }
    });
  }

  // 1. Botón de agregar carril en cabecera
  const btnAddTrack = $('#btn-add-track');
  if (btnAddTrack) {
    btnAddTrack.addEventListener('click', () => {
      createTrack();
    });
  }

  // Botón de deshacer en cabecera (Fase 16)
  const btnUndo = $('#btn-undo');
  if (btnUndo) {
    btnUndo.addEventListener('click', () => {
      undo();
    });
  }

  const timelineContainer = $('#timeline-tracks');
  if (!timelineContainer) return;

  // Botón de agregar carril dentro del estado vacío
  timelineContainer.addEventListener('click', (e) => {
    const emptyBtn = e.target.closest('#btn-empty-add-track');
    if (emptyBtn) {
      createTrack();
      return;
    }

    // Botón de eliminar carril
    const deleteBtn = e.target.closest('[data-delete-track]');
    if (deleteBtn) {
      const trackId = deleteBtn.dataset.deleteTrack;
      deleteTrack(trackId);
      return;
    }

    // Clic en clip para selección y alineación de reproducción (Fase 9)
    const clipEl = e.target.closest('[data-clip-id]');
    if (clipEl && !e.target.closest('[data-handle]')) {
      const clipId = clipEl.dataset.clipId;
      const nextId = state.selection.clipId === clipId ? null : clipId;
      setState({ selection: { clipId: nextId } });

      if (nextId) {
        const trackId = clipEl.dataset.trackId;
        const track = state.tracks.find((t) => t.id === trackId);
        const clip = track ? track.clips.find((c) => c.id === clipId) : null;
        if (clip) {
          const rect = clipEl.getBoundingClientRect();
          const clickOffsetPx = e.clientX - rect.left;
          const clickOffsetSec = Math.max(0, pixelsToTime(clickOffsetPx));
          const targetSec = clip.start + clickOffsetSec;
          seekTo(targetSec);
        }
      }
      return;
    }

    // Clic en área vacía del timeline deselecciona (evitando deseleccionar al interactuar con la franja de control)
    if (!e.target.closest('[data-clip-id]') && !e.target.closest('.timeline-control-strip')) {
      if (state.selection.clipId !== null) {
        setState({ selection: { clipId: null } });
      }
    }
  });

  // Estado de gestos continuos de volumen para un solo snapshot de deshacer (Fase 23)
  const activeTrackVolumeGestures = new Set();
  let isClipVolumeGesturing = false;

  // Escuchar inicio de gesto de volumen en carriles para tomar snapshot previo
  timelineContainer.addEventListener('pointerdown', (e) => {
    const slider = e.target.closest('[data-track-volume]');
    if (slider) {
      const trackId = slider.dataset.trackVolume;
      if (!activeTrackVolumeGestures.has(trackId)) {
        pushUndoSnapshot();
        activeTrackVolumeGestures.add(trackId);
      }
    }
  });

  timelineContainer.addEventListener('keydown', (e) => {
    const slider = e.target.closest('[data-track-volume]');
    if (slider && (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown')) {
      const trackId = slider.dataset.trackVolume;
      if (!activeTrackVolumeGestures.has(trackId)) {
        pushUndoSnapshot();
        activeTrackVolumeGestures.add(trackId);
      }
    }
  });

  // Modificación continua de volumen de carril en vivo sin setState
  timelineContainer.addEventListener('input', (e) => {
    const slider = e.target.closest('[data-track-volume]');
    if (slider) {
      const trackId = slider.dataset.trackVolume;
      if (!activeTrackVolumeGestures.has(trackId)) {
        pushUndoSnapshot();
        activeTrackVolumeGestures.add(trackId);
      }
      const rawVal = parseInt(slider.value, 10) || 0;
      const v = clamp(rawVal / 100, 0, 2);

      const valEl = $(`#track-volume-val-${trackId}`);
      if (valEl) {
        valEl.textContent = `${Math.round(v * 100)}%`;
      }

      const trk = state.tracks.find((t) => t.id === trackId);
      if (trk) {
        trk.volume = v;
      }

      if (audioContext) {
        const tgNode = trackGainNodes.get(trackId);
        if (tgNode) {
          tgNode.gain.setTargetAtTime(v, audioContext.currentTime, 0.01);
        }
      }
    }
  });

  // Confirmación al soltar el slider de carril: un único setState
  timelineContainer.addEventListener('change', (e) => {
    const slider = e.target.closest('[data-track-volume]');
    if (slider) {
      const trackId = slider.dataset.trackVolume;
      activeTrackVolumeGestures.delete(trackId);
      const rawVal = parseInt(slider.value, 10) || 0;
      const v = clamp(rawVal / 100, 0, 2);

      const nextTracks = state.tracks.map((t) => (t.id === trackId ? { ...t, volume: v } : t));
      setState({ tracks: nextTracks });
    }
  });

  // 2. División (Split) de clip por doble clic (Sprint 4 — 7.2) y reseteo de volumen a 100% (Fase 23)
  timelineContainer.addEventListener('dblclick', (e) => {
    // Doble clic en slider de carril: restablece 100%
    const trackVolSlider = e.target.closest('[data-track-volume]');
    if (trackVolSlider) {
      const trackId = trackVolSlider.dataset.trackVolume;
      pushUndoSnapshot();
      activeTrackVolumeGestures.delete(trackId);

      if (audioContext) {
        const tgNode = trackGainNodes.get(trackId);
        if (tgNode) {
          tgNode.gain.setTargetAtTime(1, audioContext.currentTime, 0.01);
        }
      }

      const nextTracks = state.tracks.map((t) => (t.id === trackId ? { ...t, volume: 1 } : t));
      setState({ tracks: nextTracks });
      return;
    }
    const clipEl = e.target.closest('[data-clip-id]');
    if (clipEl && !e.target.closest('[data-handle]')) {
      const clipId = clipEl.dataset.clipId;
      const trackId = clipEl.dataset.trackId;

      const track = state.tracks.find((t) => t.id === trackId);
      if (!track) return;
      const clip = track.clips.find((c) => c.id === clipId);
      if (!clip) return;

      const rect = clipEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const splitSec = Math.round(pixelsToTime(clickX));

      // Restricción: ambas mitades resultantes deben tener al menos 1 segundo
      if (splitSec >= 1 && (clip.duration - splitSec) >= 1) {
        pushUndoSnapshot();

        const clip1 = {
          ...clip,
          duration: splitSec,
          sourceOffset: clip.sourceOffset || 0,
          volume: typeof clip.volume === 'number' ? clip.volume : 1
        };
        const clip2 = {
          ...clip,
          id: `clip-${crypto.randomUUID()}`,
          start: clip.start + splitSec,
          duration: clip.duration - splitSec,
          sourceOffset: (clip.sourceOffset || 0) + splitSec,
          volume: typeof clip.volume === 'number' ? clip.volume : 1
        };

        const nextClips = [];
        for (const c of track.clips) {
          if (c.id === clipId) {
            nextClips.push(clip1, clip2);
          } else {
            nextClips.push(c);
          }
        }

        const nextTracks = state.tracks.map((t) => (t.id === trackId ? { ...t, clips: nextClips } : t));
        const nextDuration = recomputeProjectDuration(nextTracks);

        // Limpiar entrada de transcripción del clip original dividido (Fase 15)
        const nextTranscriptByClip = { ...(state.ai.transcriptByClip || {}) };
        delete nextTranscriptByClip[clipId];

        setState({
          tracks: nextTracks,
          selection: { clipId: clip2.id },
          project: { duration: nextDuration },
          ai: {
            ...state.ai,
            transcriptByClip: nextTranscriptByClip
          }
        });

        if (typeof schedulePlaybackDebounce === 'function') {
          schedulePlaybackDebounce(150);
        }

        console.info(`[PodcastCraft AI] Clip dividido en dos mitades (${splitSec}s y ${clip2.duration}s).`);
      }
    }
  });

  // 4. Drag & Drop genérico sobre carriles
  timelineContainer.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
    const lane = e.target.closest('.timeline-lane');
    if (!lane) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    lane.classList.add('lane-dragover');
  });

  timelineContainer.addEventListener('dragleave', (e) => {
    const lane = e.target.closest('.timeline-lane');
    if (lane && !lane.contains(e.relatedTarget)) {
      lane.classList.remove('lane-dragover');
    }
  });

  timelineContainer.addEventListener('drop', (e) => {
    const lane = e.target.closest('.timeline-lane');
    if (!lane) return;

    lane.classList.remove('lane-dragover');
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
    e.preventDefault();

    let payload;
    try {
      payload = JSON.parse(e.dataTransfer.getData(DRAG_MIME));
    } catch (err) {
      console.warn('[PodcastCraft AI] Error parseando datos de arrastre:', err);
      return;
    }

    if (!payload || !payload.libraryId) return;

    const trackId = lane.dataset.trackId;
    const track = state.tracks.find((t) => t.id === trackId);
    if (!track) return;

    // Fase 24: Colocar al soltar en la posición del playhead (getPlayheadTime) con resolución de colisiones
    const playheadTime = getPlayheadTime();
    const duration = typeof payload.duration === 'number' ? payload.duration : 0;
    const start = resolveDropStart(track, playheadTime, duration);

    const libItem = getLibraryItem(payload.libraryId);
    const objectUrl = libItem ? (libItem.objectUrl ?? null) : null;

    pushUndoSnapshot('Añadir clip');

    const newClip = {
      id: `clip-${crypto.randomUUID()}`,
      libraryId: payload.libraryId,
      name: payload.name,
      duration: duration,
      start: start,
      sourceOffset: 0,
      volume: 1,
      objectUrl: objectUrl
    };

    const nextTracks = state.tracks.map((t) => {
      if (t.id === track.id) {
        return {
          ...t,
          clips: [...t.clips, newClip].sort((a, b) => a.start - b.start)
        };
      }
      return t;
    });

    const nextDuration = recomputeProjectDuration(nextTracks);

    setState({
      tracks: nextTracks,
      project: { duration: nextDuration },
      ui: { draggingLibraryId: null },
      selection: { clipId: newClip.id }
    });

    if (typeof schedulePlaybackDebounce === 'function') {
      schedulePlaybackDebounce(150);
    }

    console.info(`[PodcastCraft AI] Clip añadido al carril ${track.id}:`, newClip);
  });

  // 5. Recorte de bordes con asas (Sprint 4 — 7.1 Pointer Events)
  timelineContainer.addEventListener('pointerdown', (e) => {
    const handleEl = e.target.closest('[data-handle]');
    if (!handleEl) return;

    e.preventDefault();
    e.stopPropagation();

    const handleType = handleEl.dataset.handle; // 'left' | 'right'
    const clipId = handleEl.dataset.clipId;
    const trackId = handleEl.dataset.trackId;

    const track = state.tracks.find((t) => t.id === trackId);
    if (!track) return;
    const clip = track.clips.find((c) => c.id === clipId);
    if (!clip) return;

    const clipEl = $(`#timeline-clip-${clipId}`);
    if (!clipEl) return;

    // Calcular límites basados en clips vecinos en el mismo carril
    const sorted = [...track.clips].sort((a, b) => a.start - b.start);
    const clipIndex = sorted.findIndex((c) => c.id === clipId);
    const prevClip = clipIndex > 0 ? sorted[clipIndex - 1] : null;
    const nextClip = clipIndex < sorted.length - 1 ? sorted[clipIndex + 1] : null;

    activeTrim = {
      handleType,
      clipId,
      trackId,
      initialX: e.clientX,
      initialStart: clip.start,
      initialDuration: clip.duration,
      prevClipEnd: prevClip ? prevClip.start + prevClip.duration : 0,
      nextClipStart: nextClip ? nextClip.start : Infinity,
      clipEl,
      pendingStart: clip.start,
      pendingDuration: clip.duration
    };

    handleEl.setPointerCapture(e.pointerId);
    document.body.classList.add('is-trimming');

    const onPointerMove = (ev) => {
      if (!activeTrim) return;

      const deltaX = ev.clientX - activeTrim.initialX;
      const deltaSec = pixelsToTime(deltaX);

      if (activeTrim.handleType === 'right') {
        let newDuration = Math.round(activeTrim.initialDuration + deltaSec);
        newDuration = Math.max(1, newDuration);

        // No invadir clip vecino derecho
        if (activeTrim.nextClipStart !== Infinity) {
          const maxAllowed = activeTrim.nextClipStart - activeTrim.initialStart;
          newDuration = Math.min(newDuration, Math.max(1, maxAllowed));
        }

        activeTrim.pendingDuration = newDuration;
        activeTrim.clipEl.style.width = Math.max(30, Math.round(timeToPixels(newDuration))) + 'px';
      } else if (activeTrim.handleType === 'left') {
        let newStart = Math.round(activeTrim.initialStart + deltaSec);
        newStart = Math.max(0, newStart);

        // No invadir clip vecino izquierdo
        if (activeTrim.prevClipEnd > 0) {
          newStart = Math.max(newStart, activeTrim.prevClipEnd);
        }

        // Duración mínima de 1 segundo
        const maxStart = (activeTrim.initialStart + activeTrim.initialDuration) - 1;
        newStart = Math.min(newStart, maxStart);

        const newDuration = (activeTrim.initialStart + activeTrim.initialDuration) - newStart;

        activeTrim.pendingStart = newStart;
        activeTrim.pendingDuration = newDuration;

        activeTrim.clipEl.style.left = Math.round(timeToPixels(newStart)) + 'px';
        activeTrim.clipEl.style.width = Math.max(30, Math.round(timeToPixels(newDuration))) + 'px';
      }
    };

    const onPointerUp = (ev) => {
      if (handleEl.hasPointerCapture && handleEl.hasPointerCapture(ev.pointerId)) {
        try {
          handleEl.releasePointerCapture(ev.pointerId);
        } catch (_) {}
      }
      handleEl.removeEventListener('pointermove', onPointerMove);
      handleEl.removeEventListener('pointerup', onPointerUp);
      handleEl.removeEventListener('pointercancel', onPointerCancel);
      document.body.classList.remove('is-trimming');

      if (!activeTrim) return;

      const { trackId: tId, clipId: cId, pendingStart, pendingDuration, initialStart, initialDuration, handleType } = activeTrim;
      activeTrim = null;

      // Solo si hubo cambio real en inicio o duración, guardar en historial de deshacer (Fase 16)
      if (pendingStart !== initialStart || pendingDuration !== initialDuration) {
        pushUndoSnapshot();
      }

      // Actualizar estado central con una sola mutación
      const nextTracks = state.tracks.map((t) => {
        if (t.id === tId) {
          return {
            ...t,
            clips: t.clips.map((c) => {
              if (c.id === cId) {
                const currentOffset = c.sourceOffset || 0;
                const newSourceOffset = handleType === 'left'
                  ? Math.max(0, currentOffset + (pendingStart - initialStart))
                  : currentOffset;
                return { ...c, start: pendingStart, duration: pendingDuration, sourceOffset: newSourceOffset };
              }
              return c;
            }).sort((a, b) => a.start - b.start)
          };
        }
        return t;
      });

      const nextDuration = recomputeProjectDuration(nextTracks);

      setState({
        tracks: nextTracks,
        project: { duration: nextDuration }
      });

      if (typeof schedulePlaybackDebounce === 'function') {
        schedulePlaybackDebounce(150);
      }

      console.info(`[PodcastCraft AI] Recorte confirmado: start=${pendingStart}s, dur=${pendingDuration}s`);
    };

    const onPointerCancel = (ev) => {
      if (ev && handleEl.hasPointerCapture && handleEl.hasPointerCapture(ev.pointerId)) {
        try {
          handleEl.releasePointerCapture(ev.pointerId);
        } catch (_) {}
      }
      handleEl.removeEventListener('pointermove', onPointerMove);
      handleEl.removeEventListener('pointerup', onPointerUp);
      handleEl.removeEventListener('pointercancel', onPointerCancel);
      document.body.classList.remove('is-trimming');
      activeTrim = null;
      renderTimelineTracks();
      renderIcons();
    };

    handleEl.addEventListener('pointermove', onPointerMove);
    handleEl.addEventListener('pointerup', onPointerUp);
    handleEl.addEventListener('pointercancel', onPointerCancel);
  });

  // 6. Controles de volumen de clip (#clip-toolbar) — Fase 23
  const clipSlider = $('#clip-volume-slider');
  if (clipSlider) {
    clipSlider.addEventListener('pointerdown', () => {
      if (state.selection.clipId && !isClipVolumeGesturing) {
        pushUndoSnapshot();
        isClipVolumeGesturing = true;
      }
    });

    clipSlider.addEventListener('keydown', (e) => {
      if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
        if (state.selection.clipId && !isClipVolumeGesturing) {
          pushUndoSnapshot();
          isClipVolumeGesturing = true;
        }
      }
    });

    clipSlider.addEventListener('input', (e) => {
      const clipId = state.selection.clipId;
      if (!clipId) return;

      if (!isClipVolumeGesturing) {
        pushUndoSnapshot();
        isClipVolumeGesturing = true;
      }

      const rawVal = parseInt(e.target.value, 10) || 0;
      const v = clamp(rawVal / 100, 0, 2);

      const valEl = $('#clip-volume-value');
      if (valEl) {
        valEl.textContent = `${Math.round(v * 100)}%`;
      }

      for (const track of state.tracks) {
        const found = (track.clips || []).find((c) => c.id === clipId);
        if (found) {
          found.volume = v;
          break;
        }
      }

      if (audioContext) {
        for (const item of activeAudioSources) {
          if (item.clipId === clipId && item.clipGain) {
            item.clipGain.gain.setTargetAtTime(v, audioContext.currentTime, 0.01);
          }
        }
      }
    });

    clipSlider.addEventListener('change', (e) => {
      const clipId = state.selection.clipId;
      if (!clipId) return;
      isClipVolumeGesturing = false;

      const rawVal = parseInt(e.target.value, 10) || 0;
      const v = clamp(rawVal / 100, 0, 2);

      const nextTracks = state.tracks.map((t) => ({
        ...t,
        clips: (t.clips || []).map((c) => (c.id === clipId ? { ...c, volume: v } : c))
      }));
      setState({ tracks: nextTracks });
    });

    clipSlider.addEventListener('dblclick', () => {
      const clipId = state.selection.clipId;
      if (!clipId) return;
      pushUndoSnapshot();
      isClipVolumeGesturing = false;

      if (audioContext) {
        for (const item of activeAudioSources) {
          if (item.clipId === clipId && item.clipGain) {
            item.clipGain.gain.setTargetAtTime(1, audioContext.currentTime, 0.01);
          }
        }
      }

      const nextTracks = state.tracks.map((t) => ({
        ...t,
        clips: (t.clips || []).map((c) => (c.id === clipId ? { ...c, volume: 1 } : c))
      }));
      setState({ tracks: nextTracks });
    });
  }

  // Limpiar banderas de gesto al soltar puntero globalmente
  window.addEventListener('pointerup', () => {
    isClipVolumeGesturing = false;
    activeTrackVolumeGestures.clear();
  });

  // 6. Atajos de teclado globales (Sprint 4 — 6, Fase 15, Fase 16)
  document.addEventListener('keydown', (e) => {
    // Guardia de campo editable: si el usuario está en un input, textarea o contentEditable
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    const isEditable = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable);

    // Atajo: Ctrl+Z / Cmd+Z para deshacer acción estructural del timeline (Fase 16)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
      if (isEditable) {
        // En campos de texto, dejar pasar el undo nativo del navegador
        return;
      }
      e.preventDefault();
      undo();
      return;
    }

    // Para el resto de los atajos, si el foco está en un campo editable, ignorar
    if (isEditable) {
      return;
    }

    // Guardia Fase 15: si el foco está dentro de #ai-transcript sobre una palabra enfocada, Delete/Backspace alterna su marcado
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const activeWordEl = document.activeElement ? document.activeElement.closest('#ai-transcript [data-segment-id]') : null;
      if (activeWordEl && state.selection.clipId) {
        e.preventDefault();
        const segId = activeWordEl.dataset.segmentId;
        toggleSegmentMark(state.selection.clipId, segId);
        return;
      }
    }

    // Atajo: Delete / Backspace para eliminar clip seleccionado del timeline
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selection.clipId) {
      e.preventDefault();
      const clipIdToDelete = state.selection.clipId;

      let found = false;
      const nextTracks = state.tracks.map((t) => {
        const filtered = t.clips.filter((c) => c.id !== clipIdToDelete);
        if (filtered.length !== t.clips.length) {
          found = true;
          return { ...t, clips: filtered };
        }
        return t;
      });

      if (found) {
        pushUndoSnapshot();

        const nextDuration = recomputeProjectDuration(nextTracks);
        const remainingClips = nextTracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);

        if (remainingClips === 0) {
          if (typeof stopAllAudioSources === 'function') {
            stopAllAudioSources();
          }
          stopPlayheadLoop();
        } else if (state.project.isPlaying && typeof schedulePlaybackDebounce === 'function') {
          schedulePlaybackDebounce(150);
        }

        const nextTranscriptByClip = { ...(state.ai.transcriptByClip || {}) };
        delete nextTranscriptByClip[clipIdToDelete];

        setState({
          tracks: nextTracks,
          selection: { ...state.selection, clipId: null },
          ai: {
            ...state.ai,
            transcriptByClip: nextTranscriptByClip
          },
          project: {
            duration: nextDuration,
            isPlaying: remainingClips === 0 ? false : state.project.isPlaying,
            currentTime: remainingClips === 0 ? 0 : Math.min(state.project.currentTime, nextDuration)
          }
        });

        if (remainingClips === 0) {
          const playheadEl = $('#timeline-playhead');
          if (playheadEl) {
            playheadEl.style.transform = 'translateX(0px)';
          }
        }

        console.info(`[PodcastCraft AI] Clip ${clipIdToDelete} eliminado del timeline.`);
      }
    }

    // Atajo de teclado: Espacio para reproducir / pausar (Sprint 5)
    if (e.code === 'Space' && !e.repeat) {
      const activeBtnPlay = $('#btn-play');
      if (activeBtnPlay && !activeBtnPlay.disabled && activeBtnPlay.getAttribute('aria-disabled') !== 'true') {
        e.preventDefault();
        activeBtnPlay.click();
      }
    }

    // Atajos de navegación DAW: J (retroceder 5s) / L (avanzar 5s) / M (silenciar) (Fase 16)
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === 'j' || e.key === 'J') {
        const btnRewind = $('#btn-rewind');
        if (btnRewind) {
          e.preventDefault();
          btnRewind.click();
        }
      } else if (e.key === 'l' || e.key === 'L') {
        const btnForward = $('#btn-forward');
        if (btnForward) {
          e.preventDefault();
          btnForward.click();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        const btnMute = $('#btn-mute');
        if (btnMute) {
          e.preventDefault();
          btnMute.click();
        }
      }
    }
  });
}

/**
 * Guardia global de escritorio:
 * Previene arrastrar archivos del explorador de Windows fuera de zonas válidas.
 */
function bindGlobalDragGuard() {
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
  });
}

/**
 * Guardia de resolución de pantalla: muestra advertencia si el viewport es menor a 1280px.
 */
function bindViewportGuard() {
  const warningOverlay = $('#viewport-warning');
  if (!warningOverlay) return;

  const checkViewport = () => {
    const isUnderMinResolution = window.innerWidth < MIN_VIEWPORT_WIDTH;
    if (isUnderMinResolution) {
      warningOverlay.classList.remove('hidden');
      warningOverlay.classList.add('flex');
    } else {
      warningOverlay.classList.add('hidden');
      warningOverlay.classList.remove('flex');
    }
  };

  window.addEventListener('resize', checkViewport);
  checkViewport();
}

/**
 * Vincula los eventos del Panel de IA (Fase 15).
 */
function bindAiPanelEvents() {
  const btnTranscribe = $('#btn-transcribe-clip');
  if (btnTranscribe) {
    btnTranscribe.addEventListener('click', () => {
      if (btnTranscribe.disabled || btnTranscribe.getAttribute('aria-disabled') === 'true') return;
      transcribeSelectedClip();
    });
  }

  const btnConfirmCleanup = $('#btn-confirm-cleanup');
  if (btnConfirmCleanup) {
    btnConfirmCleanup.addEventListener('click', () => {
      if (state.selection.clipId) {
        confirmSegmentCleanup(state.selection.clipId);
      }
    });
  }

  const btnCleanAll = $('#btn-ai-clean-all');
  if (btnCleanAll) {
    btnCleanAll.addEventListener('click', () => {
      if (btnCleanAll.disabled || btnCleanAll.getAttribute('aria-disabled') === 'true') return;
      if (state.selection.clipId) {
        cleanAllFillers(state.selection.clipId);
      }
    });
  }

  const transcriptContainer = $('#ai-transcript');
  if (transcriptContainer) {
    transcriptContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-segment-id]');
      if (!chip || !state.selection.clipId) return;
      const segId = chip.dataset.segmentId;
      toggleSegmentMark(state.selection.clipId, segId);
    });

    transcriptContainer.addEventListener('keydown', (e) => {
      const chip = e.target.closest('[data-segment-id]');
      if (!chip || !state.selection.clipId) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const segId = chip.dataset.segmentId;
        toggleSegmentMark(state.selection.clipId, segId);
      }
    });
  }
}


/* ==========================================================================
   10. INIT
   ========================================================================== */

subscribe(renderAll);

document.addEventListener('DOMContentLoaded', async () => {
  // Inicialización de tema visual e icono del toggle
  applyTheme(getCurrentTheme());

  // Inicialización de internacionalización y traducciones visibles (Fase 10)
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }

  // Vinculación de escuchadores de eventos
  bindAuthEvents();
  bindTransportEvents();
  bindTopbarEvents();
  bindImportAudioEvents();
  bindTimelineEvents();
  bindAiPanelEvents();
  bindGlobalDragGuard();
  bindViewportGuard();

  // Re-renderizado reactivo de la regla ante cambios de tamaño de ventana (Fase 14)
  window.addEventListener('resize', () => {
    if (authState.isAuthenticated) {
      renderTimelineRuler();
    }
  });

  // Fase 17: Verificación de autenticación local antes de dar acceso al workspace
  await checkAuthStatus();

  console.info('[PodcastCraft AI] Fase 17 (Sistema de login local y pantalla de bloqueo) inicializado.');
});
