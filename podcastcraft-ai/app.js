/**
 * ==========================================================================
 * PodcastCraft AI — Archivo Principal de Lógica de Interfaz
 * Sprint 1: Shell de escritorio, Top Navbar, Footer de transporte, Store central
 * ==========================================================================
 */

/* ==========================================================================
   1. CONSTANTS
   ========================================================================== */

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
 * Mapa explícito de clases CSS por categoría de track (Fuente única de verdad).
 * Regla: Las clases se declaran completas como strings literales sin interpolación.
 */
const TRACK_STYLES = {
  voice: {
    lane: 'bg-sky-900/40 border-sky-500',
    clip: 'bg-sky-500/30 border-sky-400',
    text: 'text-sky-300',
    dot: 'bg-sky-500'
  },
  music: {
    lane: 'bg-amber-900/40 border-amber-500',
    clip: 'bg-amber-500/30 border-amber-400',
    text: 'text-amber-300',
    dot: 'bg-amber-500'
  },
  fx: {
    lane: 'bg-emerald-900/40 border-emerald-500',
    clip: 'bg-emerald-500/30 border-emerald-400',
    text: 'text-emerald-300',
    dot: 'bg-emerald-500'
  }
};


/* ==========================================================================
   2. STATE
   ========================================================================== */

/**
 * MOCK_LIBRARY (Sprint 2): Lista de 8 bloques de audio predefinidos que se integrarán en el siguiente sprint:
 * [
 *   { id: 'block-v1', name: 'Entrevista Principal — Voz Host', category: 'voice', duration: 180, icon: 'mic' },
 *   { id: 'block-v2', name: 'Intervención Experto — Voz Invitado', category: 'voice', duration: 420, icon: 'mic' },
 *   { id: 'block-m1', name: 'Intro Sintetizador Electrónico', category: 'music', duration: 30, icon: 'music' },
 *   { id: 'block-m2', name: 'Cortina Suave de Fondo (Lo-Fi)', category: 'music', duration: 600, icon: 'music' },
 *   { id: 'block-f1', name: 'Transición Whoosh Acelerado', category: 'fx', duration: 3, icon: 'zap' },
 *   { id: 'block-f2', name: 'Campanada de Notificación', category: 'fx', duration: 4, icon: 'bell' },
 *   { id: 'block-f3', name: 'Spot Publicitario Patrocinador', category: 'fx', duration: 45, icon: 'megaphone' },
 *   { id: 'block-f4', name: 'Outro y Créditos Finales', category: 'fx', duration: 25, icon: 'radio' }
 * ]
 */

/**
 * Estado reactivo central — Contrato base inmutable para los 7 sprints.
 */
const state = {
  project: {
    title: 'Episodio 04 — Entrevista Tech',
    status: 'draft',          // 'draft' | 'saved'
    duration: 2535,           // segundos (00:42:15)
    currentTime: 0,
    isPlaying: false,
    zoom: 50,                 // 0–100
    volume: 80,               // 0–100
    isMuted: false
  },
  library: [],                // Sprint 2: [{ id, name, category, duration, icon }]
  tracks: [
    { id: 'track-voice',  name: 'Voz Principal',   category: 'voice',  clips: [] },
    { id: 'track-music',  name: 'Música & Intro',  category: 'music',  clips: [] },
    { id: 'track-fx',     name: 'Anuncios & FX',   category: 'fx',     clips: [] }
  ],                          // Sprint 3: clip = { id, libraryId, start, duration, label }
  selection: { clipId: null },
  ai: {
    isAnalyzed: false,
    isProcessing: false,
    fillersDetected: 14,
    transcript: []            // Sprint 4: [{ id, time, text, isFiller, clipId, start, duration }]
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
 * Actualiza el estado mediante mezcla (merge) superficial por sección y notifica suscriptores.
 * @param {Partial<typeof state>} patch
 */
function setState(patch) {
  if (!patch || typeof patch !== 'object') return;

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
      listener(state);
    } catch (error) {
      console.error('[PodcastCraft AI] Error en suscriptor del store:', error);
    }
  });
}

/**
 * Suscribe una función al cambio de estado.
 * @param {(currentState: typeof state) => void} fn
 * @returns {() => void} Función para desuscribirse
 */
function subscribe(fn) {
  if (typeof fn === 'function') {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  return () => {};
}

// Exposición pública en consola para pruebas e inspección
window.PodcastCraft = {
  getState,
  setState,
  subscribe,
  TRACK_STYLES,
  PROJECT_STATUS
};


/* ==========================================================================
   4. UTILS
   ========================================================================== */

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
   5. RENDER
   ========================================================================== */

/**
 * Renderiza los elementos correspondientes a la barra superior (#topbar).
 */
function renderTopbar() {
  const projectTitle = $('#project-title');
  if (projectTitle) {
    projectTitle.textContent = state.project.title;
    projectTitle.setAttribute('title', state.project.title);
  }

  const projectStatus = $('#project-status');
  if (projectStatus) {
    const statusConfig = PROJECT_STATUS[state.project.status] || PROJECT_STATUS.draft;
    projectStatus.className = `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 transition-colors duration-150 ${statusConfig.className}`;
    projectStatus.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full ${statusConfig.dotClass} ${state.project.status === 'draft' ? 'animate-pulse' : ''}"></span>
      <span>${statusConfig.label}</span>
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

  // Botón Play / Pausa
  const btnPlay = $('#btn-play');
  if (btnPlay) {
    if (state.project.isPlaying) {
      btnPlay.innerHTML = '<i data-lucide="pause" class="w-4 h-4 fill-white"></i>';
      btnPlay.setAttribute('aria-label', 'Pausar');
      btnPlay.setAttribute('title', 'Pausar (Espacio)');
    } else {
      btnPlay.innerHTML = '<i data-lucide="play" class="w-4 h-4 fill-white ml-0.5"></i>';
      btnPlay.setAttribute('aria-label', 'Reproducir');
      btnPlay.setAttribute('title', 'Reproducir (Espacio)');
    }
  }

  // Botón Mute / Unmute
  const btnMute = $('#btn-mute');
  if (btnMute) {
    if (state.project.isMuted) {
      btnMute.innerHTML = '<i data-lucide="volume-x" class="w-4 h-4"></i>';
      btnMute.setAttribute('aria-label', 'Activar sonido');
      btnMute.setAttribute('title', 'Activar sonido (M)');
    } else {
      btnMute.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4"></i>';
      btnMute.setAttribute('aria-label', 'Silenciar audio');
      btnMute.setAttribute('title', 'Silenciar audio (M)');
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
 * Renderiza el contador de ítems en la cabecera de la biblioteca.
 */
function renderLibraryCount() {
  const libraryCount = $('#library-count');
  if (libraryCount) {
    const count = state.library.length;
    libraryCount.textContent = `${count} ítems`;
  }
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
 * Ciclo completo de renderizado de la interfaz sincronizado con el Store.
 */
function renderAll() {
  renderTopbar();
  renderTransport();
  renderLibraryCount();
  renderIcons();
}


/* ==========================================================================
   6. EVENTS
   ========================================================================== */

/**
 * Conecta los eventos de controles de transporte y audio.
 */
function bindTransportEvents() {
  // Play / Pausa
  const btnPlay = $('#btn-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      setState({
        project: {
          isPlaying: !state.project.isPlaying
        }
      });
    });
  }

  // Retroceder 5 segundos
  const btnRewind = $('#btn-rewind');
  if (btnRewind) {
    btnRewind.addEventListener('click', () => {
      const nextTime = clamp(state.project.currentTime - 5, 0, state.project.duration);
      setState({
        project: {
          currentTime: nextTime
        }
      });
    });
  }

  // Avanzar 5 segundos
  const btnForward = $('#btn-forward');
  if (btnForward) {
    btnForward.addEventListener('click', () => {
      const nextTime = clamp(state.project.currentTime + 5, 0, state.project.duration);
      setState({
        project: {
          currentTime: nextTime
        }
      });
    });
  }

  // Slider de volumen
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
    };
    volumeSlider.addEventListener('input', updateVolumeFromInput);
    volumeSlider.addEventListener('change', updateVolumeFromInput);
  }

  // Alternar Mute
  const btnMute = $('#btn-mute');
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      setState({
        project: {
          isMuted: !state.project.isMuted
        }
      });
    });
  }
}

/**
 * Conecta los eventos de la barra superior (Zoom, Exportar y Análisis IA).
 */
function bindTopbarEvents() {
  // Slider de Zoom
  const zoomSlider = $('#zoom-slider');
  if (zoomSlider) {
    const updateZoomFromInput = (e) => {
      const newZoom = clamp(parseInt(e.target.value, 10) || 0, 0, 100);
      setState({
        project: {
          zoom: newZoom
        }
      });
    };
    zoomSlider.addEventListener('input', updateZoomFromInput);
    zoomSlider.addEventListener('change', updateZoomFromInput);
  }

  // Botón de Análisis de IA
  const btnAiAnalysis = $('#btn-ai-analysis');
  if (btnAiAnalysis) {
    btnAiAnalysis.addEventListener('click', () => {
      console.info('[PodcastCraft AI] Acción: Análisis de IA solicitado.');
    });
  }

  // Botón de Exportar (Alterna Borrador <-> Guardado como demo de estado reactivo)
  const btnExport = $('#btn-export');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      console.info('[PodcastCraft AI] Acción: Exportar Podcast solicitado.');
      const nextStatus = state.project.status === 'draft' ? 'saved' : 'draft';
      setState({
        project: {
          status: nextStatus
        }
      });
    });
  }
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
  checkViewport(); // Evaluación inicial al cargar
}


/* ==========================================================================
   7. INIT
   ========================================================================== */

// Suscribir el ciclo de renderizado a cambios del Store central
subscribe(renderAll);

document.addEventListener('DOMContentLoaded', () => {
  // 1. Renderizado inicial de datos reactivos
  renderAll();

  // 2. Vinculación de escuchadores de eventos
  bindTransportEvents();
  bindTopbarEvents();
  bindViewportGuard();

  console.info('[PodcastCraft AI] Sprint 1 inicializado correctamente. Sistema listo.');
});
