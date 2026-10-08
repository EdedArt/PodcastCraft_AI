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
 * Paleta cromática rotativa para carriles dinámicos (Sprint 4).
 * Regla de oro: No incluye violet-500 puro para respetar el color reservado a IA/Play.
 */
const TRACK_PALETTE = [
  { lane: 'track-lane-sky',     clip: 'track-clip-sky',     dot: 'bg-sky-500' },
  { lane: 'track-lane-amber',   clip: 'track-clip-amber',   dot: 'bg-amber-500' },
  { lane: 'track-lane-emerald', clip: 'track-clip-emerald', dot: 'bg-emerald-500' },
  { lane: 'track-lane-fuchsia', clip: 'track-clip-fuchsia', dot: 'bg-fuchsia-500' },
  { lane: 'track-lane-rose',    clip: 'track-clip-rose',    dot: 'bg-rose-500' },
  { lane: 'track-lane-cyan',    clip: 'track-clip-cyan',    dot: 'bg-cyan-500' }
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
    isAnalyzed: false,
    isProcessing: false,
    fillersDetected: 0,
    transcript: []
  }
};

let trackCounter = 0;   // Generador de nombres por defecto "Carril 1", "Carril 2"...
let nextColorIndex = 0; // Índice rotativo de color, nunca se decrementa


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
    ai: { ...state.ai },
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
  renameTrack,
  calculateDropStart,
  recomputeProjectDuration: () => recomputeProjectDuration(),
  getPixelsPerSecond: () => getPixelsPerSecond(),
  seekTo: (sec) => seekTo(sec),
  startPlayheadLoop: () => startPlayheadLoop(),
  stopPlayheadLoop: () => stopPlayheadLoop(),
  get globalAudio() { return globalAudio; },
  get activePlayingClipStart() { return activePlayingClipStart; },
  getCurrentLanguage: () => (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'es'),
  setLanguage: (lang) => (typeof setLanguage === 'function' ? setLanguage(lang) : null),
  t: (key) => (typeof t === 'function' ? t(key) : key),
  applyTranslations: () => (typeof applyTranslations === 'function' ? applyTranslations() : null)
};


/* ==========================================================================
   4. UTILS
   ========================================================================== */

/**
 * Calcula la posición de inicio (en segundos) de un clip al soltarlo en un carril (Fase 9).
 * - Si el carril está vacío: SIEMPRE se ancla a 0 (00:00), sin importar dónde se soltó.
 * - Si el carril ya tiene clips: calcula la posición aproximada desde dropX y aplica
 *   el acomodo automático post-colisión para no pisar clips existentes.
 * @param {object} track - Carril destino
 * @param {number} dropX - Posición X del puntero en píxeles dentro del carril
 * @param {number} pixelsPerSecond - Escala actual de píxeles por segundo
 * @param {number} clipDuration - Duración del clip que se está soltando
 * @returns {number} Posición de inicio en segundos
 */
function calculateDropStart(track, dropX, pixelsPerSecond, clipDuration) {
  const sortedClips = [...(track.clips || [])].sort((a, b) => a.start - b.start);

  if (sortedClips.length === 0) {
    // Carril vacío: SIEMPRE se ancla a 0, sin importar dónde se soltó
    return 0;
  }

  // Carril con clips existentes: se mantiene el comportamiento actual
  let start = Math.max(0, Math.round(dropX / pixelsPerSecond));
  const duration = Math.round(clipDuration || 0);
  let end = start + duration;

  // Acomodo automático sin pisar clips existentes
  for (const c of sortedClips) {
    const cStart = c.start || 0;
    const cEnd = cStart + (c.duration || 0);
    if (start < cEnd && end > cStart) {
      start = cEnd;
      end = start + duration;
    }
  }

  return start;
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
   5. TRACK MANAGEMENT (Sprint 4 — 2)
   ========================================================================== */

/**
 * Crea un nuevo carril dinámico con nombre autoincremental y color rotativo.
 * @param {string} [customName]
 * @returns {object} El nuevo carril creado
 */
function createTrack(customName) {
  const newTrack = {
    id: `track-${crypto.randomUUID()}`,
    name: customName || `Carril ${++trackCounter}`,
    colorIndex: (nextColorIndex++) % TRACK_PALETTE.length,
    clips: []
  };

  setState({
    tracks: [...state.tracks, newTrack]
  });

  console.info('[PodcastCraft AI] Carril creado:', newTrack);
  return newTrack;
}

/**
 * Renombra un carril existente. Si el nombre es vacío, se mantiene el previo.
 * @param {string} trackId
 * @param {string} newName
 */
function renameTrack(trackId, newName) {
  const trimmed = (newName || '').trim();
  if (!trimmed) return;

  const nextTracks = state.tracks.map((t) => {
    if (t.id === trackId) {
      return { ...t, name: trimmed };
    }
    return t;
  });

  setState({ tracks: nextTracks });
  console.info(`[PodcastCraft AI] Carril ${trackId} renombrado a: ${trimmed}`);
}

/**
 * Elimina un carril. Si contiene clips, solicita confirmación con window.confirm.
 * @param {string} trackId
 */
function deleteTrack(trackId) {
  const track = state.tracks.find((t) => t.id === trackId);
  if (!track) return;

  if (track.clips && track.clips.length > 0) {
    const confirmMsg = `Este carril tiene ${track.clips.length} clip(s). ¿Eliminarlo de todas formas?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
  }

  const nextTracks = state.tracks.filter((t) => t.id !== trackId);

  // Limpiar selección de clip si pertenecía al carril eliminado
  let nextClipId = state.selection.clipId;
  if (track.clips && track.clips.some((c) => c.id === nextClipId)) {
    nextClipId = null;
  }

  const nextDuration = recomputeProjectDuration(nextTracks);
  const remainingClips = nextTracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);

  if (remainingClips === 0) {
    if (typeof globalAudio !== 'undefined' && globalAudio) {
      globalAudio.pause();
      globalAudio.src = '';
    }
    stopPlayheadLoop();
    activePlayingClipStart = 0;
    activePlayingClipDuration = 0;
  }

  setState({
    tracks: nextTracks,
    selection: {
      ...state.selection,
      clipId: nextClipId
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

  // Sincronización del playhead cuando no está reproduciendo activamente (Sprint 5)
  const playheadEl = $('#timeline-playhead');
  if (playheadEl && !state.project.isPlaying) {
    const pps = getPixelsPerSecond();
    playheadEl.style.transform = `translateX(${(state.project.currentTime || 0) * pps}px)`;
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
        const found = t.clips.find((c) => c.id === state.selection.clipId);
        if (found) {
          activeClip = found;
          break;
        }
      }
    }
    if (!activeClip && hasClips) {
      for (const t of state.tracks) {
        if (t.clips && t.clips.length > 0) {
          activeClip = t.clips[0];
          break;
        }
      }
    }

    if (activeClip) {
      nowPlayingName.textContent = activeClip.name;
      nowPlayingName.setAttribute('title', activeClip.name);
      nowPlayingMeta.textContent = `${formatDuration(activeClip.duration)} · MP3`;
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
    libraryCount.textContent = count === 1 ? '1 audio' : `${count} audios`;
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
    listContainer.innerHTML = `
      <div id="library-empty" class="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-xl theme-empty-box">
        <div class="w-12 h-12 rounded-full theme-pill border flex items-center justify-center theme-text-secondary mb-3 shadow-inner">
          <i data-lucide="file-audio" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xs font-semibold theme-text-primary mb-1">Tu biblioteca aparecerá aquí</h3>
        <p class="text-[11px] theme-text-muted leading-relaxed max-w-[190px]">
          Importa archivos MP3 desde tu computador para estructurar tu episodio.
        </p>
      </div>
    `;
    return;
  }

  listContainer.className = 'flex-1 min-h-0 p-3 overflow-y-auto space-y-2';
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
        aria-label="${escapeHtml(item.name)}, duración ${formattedDuration}. Arrastra a un carril"
        title="Arrastra a cualquier carril del timeline"
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
 * Renderiza los carriles dinámicos (0 a N) en el timeline (#timeline-tracks).
 * Sprint 4: Estado vacío general si tracks.length === 0, o carriles con asas de recorte y clips coloreados.
 */
function renderTimelineTracks() {
  const container = $('#timeline-tracks');
  if (!container) return;

  // Estado vacío 1: Cero carriles creados
  if (state.tracks.length === 0) {
    container.className = 'flex-1 min-h-0 p-4 lg:p-6 overflow-y-auto flex flex-col justify-center';
    container.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl theme-empty-box max-w-xl mx-auto w-full my-auto">
        <div class="w-14 h-14 rounded-2xl theme-pill border flex items-center justify-center theme-text-secondary mb-3 shadow-inner">
          <i data-lucide="layers" class="w-7 h-7"></i>
        </div>
        <h3 class="text-sm font-semibold theme-text-primary mb-1">Aún no tienes carriles</h3>
        <p class="text-xs theme-text-muted max-w-sm leading-relaxed mb-4">
          Crea un carril para empezar a construir tu episodio y arrastrar archivos de audio.
        </p>
        <button id="btn-empty-add-track" type="button" aria-label="Crear primer carril" class="theme-btn-export inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold active:scale-95 shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Crear Primer Carril</span>
        </button>
      </div>
    `;
    return;
  }

  container.className = 'flex-1 min-h-0 p-4 lg:p-6 overflow-y-auto space-y-3.5 flex flex-col';
  const pps = getPixelsPerSecond();

  const tracksHtml = state.tracks.map((track) => {
    const palette = TRACK_PALETTE[track.colorIndex % TRACK_PALETTE.length];
    const clips = track.clips || [];

    const clipsHtml = clips.map((clip) => {
      const leftPx = Math.round((clip.start || 0) * pps);
      const widthPx = Math.max(32, Math.round((clip.duration || 0) * pps));
      const isSelected = state.selection.clipId === clip.id;
      const formattedDuration = formatDuration(clip.duration);
      const startFormatted = formatDuration(clip.start);
      const endFormatted = formatDuration((clip.start || 0) + (clip.duration || 0));
      const fullAriaLabel = `${clip.name}, de ${startFormatted} a ${endFormatted}`;

      return `
        <div
          id="timeline-clip-${clip.id}"
          data-clip-id="${clip.id}"
          data-track-id="${track.id}"
          role="button"
          tabindex="0"
          aria-label="${escapeHtml(fullAriaLabel)}"
          title="${escapeHtml(clip.name)} (${formattedDuration}) — Doble clic para dividir"
          class="timeline-clip absolute top-1.5 bottom-1.5 rounded-md border flex items-center px-2 gap-1 cursor-pointer select-none transition-all duration-100 ${palette.clip} ${isSelected ? 'is-selected' : ''}"
          style="left: ${leftPx}px; width: ${widthPx}px;"
        >
          <!-- Asa de recorte izquierda -->
          <div
            class="clip-handle-left"
            data-handle="left"
            data-clip-id="${clip.id}"
            data-track-id="${track.id}"
            title="Arrastra para recortar inicio"
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
            title="Arrastra para recortar final"
          ></div>
        </div>
      `;
    }).join('');

    return `
      <div class="timeline-row flex items-stretch gap-3 group/track" data-track-id="${track.id}">
        <!-- Cabecera del Carril -->
        <div class="w-40 lg:w-44 shrink-0 flex items-center justify-between px-3 py-2 theme-panel border rounded-lg select-none gap-2">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="w-2.5 h-2.5 rounded-full ${palette.dot} shrink-0"></span>
            <span
              id="track-name-${track.id}"
              class="track-title text-xs font-semibold theme-text-primary truncate cursor-text hover:text-violet-600 dark:hover:text-violet-400"
              title="Doble clic para renombrar"
              data-track-id="${track.id}"
            >${escapeHtml(track.name)}</span>
          </div>
          <button
            type="button"
            id="track-delete-${track.id}"
            data-delete-track="${track.id}"
            aria-label="Eliminar carril ${escapeHtml(track.name)}"
            title="Eliminar carril"
            class="w-6 h-6 rounded flex items-center justify-center theme-text-muted hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-colors"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Zona de Carril / Drop zone -->
        <div
          data-track-id="${track.id}"
          class="timeline-lane flex-1 min-w-0 h-16 relative rounded-lg border transition-all duration-150 overflow-x-auto overflow-y-hidden ${palette.lane}"
        >
          ${clips.length === 0
            ? `<div class="h-full flex items-center justify-center text-xs theme-text-muted italic select-none pointer-events-none px-4">
                 <span>Carril vacío — Arrastra un audio aquí</span>
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

  if (projectChanged) {
    renderTopbar();
    renderTransport();
  }

  if (libraryChanged) {
    renderLibraryList();
    renderLibraryCount();
  }

  if (tracksChanged) {
    renderTimelineTracks();
    renderTransport();
  }

  renderIcons();

  // Detección de cambios persistentes para autoguardado en backend (Sprint 6)
  if (!isInitial) {
    const dataChanged = (
      currentState.tracks !== prevState?.tracks ||
      currentState.library !== prevState?.library ||
      currentState.project.title !== prevState?.project?.title
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

  const toggleBtn = $('#btn-theme-toggle');
  if (toggleBtn) {
    const isDark = finalTheme === 'dark';
    const label = isDark
      ? (typeof t === 'function' ? t('theme.switchToLight') : 'Cambiar a modo claro')
      : (typeof t === 'function' ? t('theme.switchToDark') : 'Cambiar a modo oscuro');
    toggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', label);
    toggleBtn.setAttribute('title', label);
    toggleBtn.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-4 h-4"></i>`;
    renderIcons();
  }
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
   6.1 PERSISTENCE & BACKEND API (Sprint 6)
   ========================================================================== */

let saveDebounceTimer = null;
let isSaving = false;

/**
 * Programa el guardado automático en el backend con un debounce de 1.5s.
 * Marca visualmente el proyecto en estado 'Borrador' de inmediato.
 */
function scheduleAutoSave() {
  if (state.project.status !== 'draft') {
    state.project.status = 'draft';
    renderTopbar();
  }

  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(async () => {
    await saveProjectToBackend();
  }, 1500);
}

/**
 * Serializa y envía el estado del proyecto al backend vía PUT /api/project.
 */
async function saveProjectToBackend() {
  if (isSaving) return;
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
        name: t.name,
        colorIndex: t.colorIndex,
        clips: t.clips.map((c) => ({
          id: c.id,
          libraryId: c.libraryId,
          name: c.name,
          start: c.start,
          duration: c.duration
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

    state.project.status = 'saved';
    renderTopbar();
    console.info('[PodcastCraft AI] Proyecto guardado exitosamente en backend.');
  } catch (err) {
    console.warn('[PodcastCraft AI] Error al persistir proyecto en backend:', err);
    showImportFeedback('No se pudo guardar en el servidor local. Verifica que el backend esté corriendo.');
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
    state.project.status = data.project?.status || 'saved';

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
        name: t.name || 'Carril',
        colorIndex: typeof t.colorIndex === 'number' ? t.colorIndex : 0,
        clips: Array.isArray(t.clips)
          ? t.clips.map((c) => {
              const libItem = state.library.find((l) => l.id === c.libraryId);
              return {
                id: c.id,
                libraryId: c.libraryId,
                name: c.name,
                start: typeof c.start === 'number' ? c.start : 0,
                duration: typeof c.duration === 'number' ? c.duration : 0,
                objectUrl: libItem ? libItem.objectUrl : null
              };
            })
          : []
      }));

      // Recomputar duración total del proyecto a partir de los clips cargados
      state.project.duration = recomputeProjectDuration(state.tracks);

      // Ajustar contadores para evitar colisión con nuevos carriles
      if (state.tracks.length > 0) {
        trackCounter = Math.max(state.tracks.length, trackCounter);
        const maxColor = Math.max(...state.tracks.map((t) => t.colorIndex || 0));
        nextColorIndex = Math.max(maxColor + 1, nextColorIndex);
      }
    }

    console.info('[PodcastCraft AI] Proyecto cargado exitosamente desde backend.');
  } catch (err) {
    console.warn('[PodcastCraft AI] Servidor local no disponible o inaccesible. Modo de sesión local activo:', err.message);
    showImportFeedback('Servidor local no detectado. Los cambios se mantendrán solo durante esta sesión.');
  }
}


/* ==========================================================================
   7. AUDIO ENGINE & TRANSPORT EVENTS
   ========================================================================== */

/**
 * Instancia global y única de audio para reproducción real en la estación de trabajo.
 * Decisión Sprint 5 (0.2): Un solo audio activo a la vez (globalAudio).
 */
const globalAudio = new Audio();

/**
 * Marca temporal de inicio (en segundos absolutos de la línea de tiempo)
 * del clip actualmente cargado y reproduciéndose en globalAudio (Fase 9).
 */
let activePlayingClipStart = 0;

/**
 * Duración contractual (en segundos) del clip activo en reproducción (Fase 9).
 */
let activePlayingClipDuration = 0;

/**
 * Identificador activo de requestAnimationFrame para el bucle de sincronización del playhead.
 * EXCEPCIÓN AL STORE (3ª del proyecto, tras is-dragging y pointermove de recorte):
 * Actualiza el DOM directamente a 60 FPS leyendo globalAudio.currentTime sin pasar por
 * setState ni renderAll() en cada frame.
 */
let playheadRafId = null;

/**
 * Inicia el bucle de animación del playhead a 60 FPS si el audio está en reproducción.
 * Fase 9: Calcula la posición absoluta del playhead como (activePlayingClipStart + audioElapsed).
 */
function startPlayheadLoop() {
  if (playheadRafId !== null) return; // ya corriendo, evita loops duplicados
  const playheadEl = $('#timeline-playhead');
  const currentTimeEl = $('#current-time');

  function tick() {
    if (!state.project.isPlaying) {
      playheadRafId = null;
      return; // detiene el loop solo, no necesita cancelAnimationFrame explícito aquí
    }
    const audioElapsed = globalAudio.currentTime || 0;

    // Respetar duración efectiva del clip si fue recortado o dividido (Fase 9)
    if (activePlayingClipDuration > 0 && audioElapsed >= activePlayingClipDuration) {
      globalAudio.pause();
      stopPlayheadLoop();
      setState({ project: { isPlaying: false, currentTime: activePlayingClipStart } });
      const px = activePlayingClipStart * getPixelsPerSecond();
      if (playheadEl) {
        playheadEl.style.transform = `translateX(${px}px)`;
      }
      if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(activePlayingClipStart);
      }
      return;
    }

    const absoluteSeconds = activePlayingClipStart + audioElapsed;
    const px = absoluteSeconds * getPixelsPerSecond();

    if (playheadEl) {
      playheadEl.style.transform = `translateX(${px}px)`;
    }
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(absoluteSeconds);
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
 * Reposiciona de forma unificada el audio real, el store y la representación visual en el DOM.
 * Utilizado por el scrubbing de la regla de tiempo, clics en clips y botones de salto temporal.
 * Fase 9:
 * 1. Identifica qué clip (con audio real) cubre ese punto absoluto del timeline:
 *    clip.start <= seconds < clip.start + clip.duration.
 * 2. Si encuentra un clip: sincroniza globalAudio.src, actualiza activePlayingClipStart = clip.start,
 *    y fija globalAudio.currentTime = seconds - clip.start.
 * 3. Si el punto de scrub cae sobre una zona vacía sin clips: detiene globalAudio (pausa)
 *    si estaba sonando, pero igual mueve el playhead visualmente a esa posición absoluta.
 * @param {number} targetSeconds
 */
function seekTo(targetSeconds) {
  const maxDuration = state.project.duration > 0 ? state.project.duration : Infinity;
  const seconds = clamp(targetSeconds, 0, maxDuration);
  const pps = getPixelsPerSecond();

  // 1. Identificar si algún clip cubre esta posición absoluta del timeline
  let coveringClip = null;
  for (const t of state.tracks) {
    if (!t.clips) continue;
    for (const c of t.clips) {
      const cStart = c.start || 0;
      const cEnd = cStart + (c.duration || 0);
      if (seconds >= cStart && seconds < cEnd) {
        coveringClip = c;
        break;
      }
    }
    if (coveringClip) break;
  }

  // 2. Sincronizar el audio real según si cae en un clip o en zona vacía
  if (coveringClip && coveringClip.objectUrl) {
    activePlayingClipStart = coveringClip.start || 0;
    activePlayingClipDuration = coveringClip.duration || 0;
    const clipOffset = Math.max(0, seconds - activePlayingClipStart);

    if (globalAudio.src !== coveringClip.objectUrl) {
      globalAudio.src = coveringClip.objectUrl;
      globalAudio.currentTime = clipOffset;
      if (state.project.isPlaying) {
        syncGlobalAudioVolume();
        globalAudio.play().catch((err) => console.warn('[PodcastCraft AI] Seek play error:', err));
      }
    } else {
      try {
        globalAudio.currentTime = clipOffset;
      } catch (_) {}
    }

    if (state.selection.clipId !== coveringClip.id) {
      setState({ selection: { clipId: coveringClip.id } });
    }
  } else {
    // Zona vacía del timeline: decisión contractual Fase 9 (3.3):
    // Detener la reproducción de audio si estaba activa y mantener posición del playhead
    if (state.project.isPlaying) {
      globalAudio.pause();
      stopPlayheadLoop();
      setState({ project: { isPlaying: false } });
    }
  }

  // 3. Actualización puntual del store (evento discreto, nunca en bucle continuo)
  setState({ project: { currentTime: seconds } });

  // 4. Reposicionar el playhead de inmediato sin esperar al siguiente frame
  const playheadEl = $('#timeline-playhead');
  if (playheadEl) {
    playheadEl.style.transform = `translateX(${seconds * pps}px)`;
  }
  const currentTimeEl = $('#current-time');
  if (currentTimeEl) {
    currentTimeEl.textContent = formatTime(seconds);
  }

  // 5. Sincronizar accesibilidad de la regla
  const rulerEl = $('#timeline-ruler');
  if (rulerEl) {
    rulerEl.setAttribute('aria-valuenow', Math.round(seconds).toString());
    rulerEl.setAttribute('aria-valuemax', (state.project.duration || 0).toString());
  }
}

globalAudio.addEventListener('ended', () => {
  stopPlayheadLoop();
  setState({ project: { isPlaying: false, currentTime: activePlayingClipStart } });
  const playheadEl = $('#timeline-playhead');
  if (playheadEl) {
    playheadEl.style.transform = `translateX(${activePlayingClipStart * getPixelsPerSecond()}px)`;
  }
  const currentTimeEl = $('#current-time');
  if (currentTimeEl) {
    currentTimeEl.textContent = formatTime(activePlayingClipStart);
  }
});

/**
 * Sincroniza el volumen y estado de silencio en el elemento de audio global.
 */
function syncGlobalAudioVolume() {
  if (globalAudio) {
    globalAudio.volume = state.project.isMuted ? 0 : (state.project.volume / 100);
    globalAudio.muted = state.project.isMuted;
  }
}

/**
 * Conecta los controles de transporte.
 */
function bindTransportEvents() {
  const btnPlay = $('#btn-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      const totalClips = state.tracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);
      if (totalClips === 0) return;

      if (state.project.isPlaying) {
        globalAudio.pause();
        stopPlayheadLoop();
        const currentAbsolute = activePlayingClipStart + (globalAudio.currentTime || 0);
        setState({ project: { isPlaying: false, currentTime: currentAbsolute } });
      } else {
        // Encontrar clip a reproducir (seleccionado o el primero en la línea de tiempo)
        let targetClip = null;
        if (state.selection.clipId) {
          for (const t of state.tracks) {
            const found = t.clips.find((c) => c.id === state.selection.clipId);
            if (found) { targetClip = found; break; }
          }
        }
        if (!targetClip) {
          for (const t of state.tracks) {
            if (t.clips && t.clips.length > 0) {
              targetClip = t.clips[0];
              break;
            }
          }
        }

        if (targetClip && targetClip.objectUrl) {
          activePlayingClipStart = targetClip.start || 0;
          activePlayingClipDuration = targetClip.duration || 0;

          // Determinar offset en segundos dentro del archivo de audio
          const currentTimelineTime = state.project.currentTime || 0;
          let clipAudioOffset = 0;
          if (currentTimelineTime >= activePlayingClipStart && currentTimelineTime < (activePlayingClipStart + targetClip.duration)) {
            clipAudioOffset = currentTimelineTime - activePlayingClipStart;
          } else {
            // El playhead estaba fuera de los límites de este clip; arrancar desde su inicio exacto
            clipAudioOffset = 0;
            setState({ project: { currentTime: activePlayingClipStart } });
            const playheadEl = $('#timeline-playhead');
            if (playheadEl) {
              playheadEl.style.transform = `translateX(${activePlayingClipStart * getPixelsPerSecond()}px)`;
            }
            const currentTimeEl = $('#current-time');
            if (currentTimeEl) {
              currentTimeEl.textContent = formatTime(activePlayingClipStart);
            }
          }

          if (globalAudio.src !== targetClip.objectUrl) {
            globalAudio.src = targetClip.objectUrl;
            globalAudio.currentTime = clipAudioOffset;
          } else if (Math.abs((globalAudio.currentTime || 0) - clipAudioOffset) > 0.05) {
            try {
              globalAudio.currentTime = clipAudioOffset;
            } catch (_) {}
          }

          syncGlobalAudioVolume();
          const playPromise = globalAudio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setState({ project: { isPlaying: true } });
                startPlayheadLoop();
              })
              .catch((err) => {
                console.warn('[PodcastCraft AI] Error en reproducción de audio real:', err);
                stopPlayheadLoop();
                setState({ project: { isPlaying: false } });
              });
          }
        }
      }
    });
  }

  const btnRewind = $('#btn-rewind');
  if (btnRewind) {
    btnRewind.addEventListener('click', () => {
      const nextTime = state.project.currentTime - 5;
      seekTo(nextTime);
    });
  }

  const btnForward = $('#btn-forward');
  if (btnForward) {
    btnForward.addEventListener('click', () => {
      const nextTime = state.project.currentTime + 5;
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
      syncGlobalAudioVolume();
    };
    volumeSlider.addEventListener('input', updateVolumeFromInput);
    volumeSlider.addEventListener('change', updateVolumeFromInput);
  }

  const btnMute = $('#btn-mute');
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      const nextMuted = !state.project.isMuted;
      setState({ project: { isMuted: nextMuted } });
      syncGlobalAudioVolume();
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
        showImportFeedback(
          rejectedCount === 1
            ? 'Solo se permiten archivos MP3'
            : `${rejectedCount} archivo(s) no eran MP3 y fueron ignorados`
        );
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

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Error HTTP ${res.status}`);
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
          showImportFeedback('No se pudo conectar con el servidor local. Verifica que el backend esté corriendo.');
        }
      }

      if (newItems.length > 0) {
        setState({
          library: [...state.library, ...newItems]
        });
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
      const rect = ruler.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pps = getPixelsPerSecond();
      let seconds = clickX / pps;
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
          const pps = getPixelsPerSecond();
          const clickOffsetSec = Math.max(0, clickOffsetPx / pps);
          const targetSec = clip.start + clickOffsetSec;
          seekTo(targetSec);
        }
      }
      return;
    }

    // Clic en área vacía del timeline deselecciona
    if (!e.target.closest('[data-clip-id]') && !e.target.closest('.track-title')) {
      if (state.selection.clipId !== null) {
        setState({ selection: { clipId: null } });
      }
    }
  });

  // 2. Renombrar carril con doble clic in situ
  timelineContainer.addEventListener('dblclick', (e) => {
    // Si el doble clic es en el título del carril
    const titleEl = e.target.closest('.track-title');
    if (titleEl) {
      const trackId = titleEl.dataset.trackId;
      const track = state.tracks.find((t) => t.id === trackId);
      if (!track) return;

      const currentName = track.name;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'track-rename-input';
      input.value = currentName;

      titleEl.replaceWith(input);
      input.focus();
      input.select();

      let committed = false;
      const finishRename = (save) => {
        if (committed) return;
        committed = true;
        if (save) {
          renameTrack(trackId, input.value);
        } else {
          renderTimelineTracks();
          renderIcons();
        }
      };

      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          finishRename(true);
        } else if (ev.key === 'Escape') {
          ev.preventDefault();
          finishRename(false);
        }
      });

      input.addEventListener('blur', () => {
        finishRename(true);
      });

      return;
    }

    // 3. División (Split) de clip por doble clic (Sprint 4 — 7.2)
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
      const pps = getPixelsPerSecond();
      const splitSec = Math.round(clickX / pps);

      // Restricción: ambas mitades resultantes deben tener al menos 1 segundo
      if (splitSec >= 1 && (clip.duration - splitSec) >= 1) {
        const clip1 = {
          ...clip,
          duration: splitSec
        };
        const clip2 = {
          ...clip,
          id: `clip-${crypto.randomUUID()}`,
          start: clip.start + splitSec,
          duration: clip.duration - splitSec
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

        setState({
          tracks: nextTracks,
          selection: { clipId: clip2.id },
          project: { duration: nextDuration }
        });

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

    // Calcular posición X convertida a segundos con anclaje a 00:00 en carriles vacíos (Fase 9)
    const rect = lane.getBoundingClientRect();
    const dropX = e.clientX - rect.left + lane.scrollLeft;
    const pps = getPixelsPerSecond();
    const duration = Math.round(payload.duration || 0);

    const start = calculateDropStart(track, dropX, pps, duration);

    const libItem = getLibraryItem(payload.libraryId);
    const objectUrl = libItem ? (libItem.objectUrl ?? null) : null;

    const newClip = {
      id: `clip-${crypto.randomUUID()}`,
      libraryId: payload.libraryId,
      name: payload.name,
      duration: duration,
      start: start,
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

    console.info(`[PodcastCraft AI] Clip añadido al carril "${track.name}":`, newClip);
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
      pps: getPixelsPerSecond(),
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
      const deltaSec = deltaX / activeTrim.pps;

      if (activeTrim.handleType === 'right') {
        let newDuration = Math.round(activeTrim.initialDuration + deltaSec);
        newDuration = Math.max(1, newDuration);

        // No invadir clip vecino derecho
        if (activeTrim.nextClipStart !== Infinity) {
          const maxAllowed = activeTrim.nextClipStart - activeTrim.initialStart;
          newDuration = Math.min(newDuration, Math.max(1, maxAllowed));
        }

        activeTrim.pendingDuration = newDuration;
        activeTrim.clipEl.style.width = Math.max(30, Math.round(newDuration * activeTrim.pps)) + 'px';
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

        activeTrim.clipEl.style.left = Math.round(newStart * activeTrim.pps) + 'px';
        activeTrim.clipEl.style.width = Math.max(30, Math.round(newDuration * activeTrim.pps)) + 'px';
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

      const { trackId: tId, clipId: cId, pendingStart, pendingDuration } = activeTrim;
      activeTrim = null;

      // Actualizar estado central con una sola mutación
      const nextTracks = state.tracks.map((t) => {
        if (t.id === tId) {
          return {
            ...t,
            clips: t.clips.map((c) => {
              if (c.id === cId) {
                return { ...c, start: pendingStart, duration: pendingDuration };
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

  // 6. Borrado de clip con Delete / Backspace (Sprint 4 — 6)
  document.addEventListener('keydown', (e) => {
    // Guardia: si el usuario está escribiendo en un input o editable, ignorar
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable)) {
      return;
    }

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
        const nextDuration = recomputeProjectDuration(nextTracks);
        const remainingClips = nextTracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);

        if (remainingClips === 0) {
          if (typeof globalAudio !== 'undefined' && globalAudio) {
            globalAudio.pause();
            globalAudio.src = '';
          }
          stopPlayheadLoop();
          activePlayingClipStart = 0;
          activePlayingClipDuration = 0;
        }

        setState({
          tracks: nextTracks,
          selection: { ...state.selection, clipId: null },
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


/* ==========================================================================
   10. INIT
   ========================================================================== */

subscribe(renderAll);

document.addEventListener('DOMContentLoaded', async () => {
  // Inicialización de tema visual e icono del toggle
  applyTheme(getCurrentTheme());

  // Carga previa e hidratación del estado persistido desde el backend (Sprint 6)
  await loadProjectFromBackend();

  // Renderizado inicial (con datos del backend o clean slate si está desconectado)
  renderAll();

  // Inicialización de internacionalización y traducciones visibles (Fase 10)
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }

  // Vinculación de escuchadores de eventos
  bindTransportEvents();
  bindTopbarEvents();
  bindImportAudioEvents();
  bindTimelineEvents();
  bindGlobalDragGuard();
  bindViewportGuard();

  console.info('[PodcastCraft AI] Sprint 6 (Reestructuración Frontend/Backend + Persistencia Real) inicializado.');
});
