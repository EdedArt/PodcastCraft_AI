/**
 * ==========================================================================
 * PodcastCraft AI — Archivo Principal de Lógica de Interfaz
 * Sprint 1: Shell de escritorio, Top Navbar, Footer de transporte, Store central
 * Sprint 2: Biblioteca de bloques, Pestañas de categoría y Fuente Drag & Drop
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
 * Mapa explícito de clases CSS por categoría de track (Fuente única de verdad cromática).
 * Regla: Las clases se declaran completas como strings literales sin interpolación dinámica.
 */
const TRACK_STYLES = {
  voice: {
    lane: 'bg-sky-900/40 border-sky-500',
    clip: 'bg-sky-500/30 border-sky-400',
    text: 'text-sky-300',
    dot: 'bg-sky-500',
    iconTile: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    accentBar: 'bg-sky-500',
    badge: 'text-sky-300'
  },
  music: {
    lane: 'bg-amber-900/40 border-amber-500',
    clip: 'bg-amber-500/30 border-amber-400',
    text: 'text-amber-300',
    dot: 'bg-amber-500',
    iconTile: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    accentBar: 'bg-amber-500',
    badge: 'text-amber-300'
  },
  fx: {
    lane: 'bg-emerald-900/40 border-emerald-500',
    clip: 'bg-emerald-500/30 border-emerald-400',
    text: 'text-emerald-300',
    dot: 'bg-emerald-500',
    iconTile: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    accentBar: 'bg-emerald-500',
    badge: 'text-emerald-300'
  }
};

/**
 * Escala base de tiempo para la línea de tiempo (píxeles por segundo a zoom 50%).
 */
const PIXELS_PER_SECOND_BASE = 4;

/**
 * MOCK_LIBRARY: Contenido de 8 bloques de audio predefinidos (Sprint 2).
 * NOTA DE PIVOTE (Sprint 3): MOCK_LIBRARY se conserva intacto en CONSTANTS pero ya no se asigna
 * por defecto a state.library. Queda disponible únicamente como semilla de prueba opcional
 * invocable manualmente desde la consola con window.PodcastCraft.loadSampleLibrary().
 */
const MOCK_LIBRARY = [
  { id: 'lib-01', name: 'Bienvenida del locutor', category: 'voice', subtype: 'voice', duration: 48, icon: 'mic' },
  { id: 'lib-02', name: 'Entrevista completa · Invitado', category: 'voice', subtype: 'voice', duration: 1260, icon: 'mic-vocal' },
  { id: 'lib-03', name: 'Intro Synthwave', category: 'music', subtype: 'music', duration: 15, icon: 'music-2' },
  { id: 'lib-04', name: 'Fondo Lo-fi Ambient', category: 'music', subtype: 'music', duration: 240, icon: 'music' },
  { id: 'lib-05', name: 'Transición Whoosh', category: 'fx', subtype: 'effect', duration: 2, icon: 'zap' },
  { id: 'lib-06', name: 'Aplausos de estudio', category: 'fx', subtype: 'effect', duration: 6, icon: 'volume-2' },
  { id: 'lib-07', name: 'Spot Sponsor · Tech Store', category: 'fx', subtype: 'ad', duration: 30, icon: 'megaphone' },
  { id: 'lib-08', name: 'Cuña institucional', category: 'fx', subtype: 'ad', duration: 15, icon: 'radio' }
];

/**
 * Configuración de pestañas de filtro para la biblioteca.
 */
const LIBRARY_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'music', label: 'Música' },
  { id: 'voice', label: 'Voz' },
  { id: 'effect', label: 'Efectos' },
  { id: 'ad', label: 'Anuncios' }
];

/**
 * Diccionario de etiquetas en español para los subtipos de bloques.
 */
const SUBTYPE_LABELS = {
  voice: 'Voz',
  music: 'Música',
  effect: 'Efecto',
  ad: 'Anuncio'
};

/**
 * Tipo MIME contractual estandarizado para Drag & Drop entre la biblioteca y el timeline.
 */
const DRAG_MIME = 'application/x-podcastcraft-block';


/* ==========================================================================
   2. STATE (Sprint 3: Clean Slate funcional)
   ========================================================================== */

/**
 * Estado reactivo central — Clean Slate: Inicia vacío y se puebla con audio real del usuario.
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
  library: [],                 // Vacío por defecto. Se llena únicamente con audio importado
  ui: {
    libraryFilter: 'all',     // 'all' | 'music' | 'voice' | 'effect' | 'ad'
    draggingLibraryId: null   // ID de bloque arrastrándose actualmente
  },
  tracks: [
    { id: 'track-voice', name: 'Voz Principal',  category: 'voice', clips: [] },
    { id: 'track-music', name: 'Música & Intro', category: 'music', clips: [] },
    { id: 'track-fx',    name: 'Anuncios & FX',  category: 'fx',    clips: [] }
  ],
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
  TRACK_STYLES,
  PROJECT_STATUS,
  MOCK_LIBRARY,
  LIBRARY_FILTERS,
  SUBTYPE_LABELS,
  DRAG_MIME,
  PIXELS_PER_SECOND_BASE,
  /**
   * Semilla opcional de prueba (Sprint 3 — 2.1):
   * Permite cargar los 8 bloques mock manualmente desde la consola sin que la app
   * los cargue sola al iniciar.
   */
  loadSampleLibrary() {
    setState({ library: [...MOCK_LIBRARY] });
    console.info('[PodcastCraft AI] Semilla MOCK_LIBRARY cargada manualmente en la biblioteca.');
  },
  recomputeProjectDuration: () => recomputeProjectDuration()
};


/* ==========================================================================
   4. UTILS
   ========================================================================== */

/**
 * Recalcula dinámicamente la duración total del proyecto a partir del tiempo final
 * (start + duration) de todos los clips colocados en todos los carriles del timeline.
 * Si no hay clips colocados, retorna 0.
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
 * Obtiene los bloques de biblioteca visibles según el filtro activo en state.ui.libraryFilter.
 * @returns {typeof state.library}
 */
function getVisibleLibrary() {
  const filter = state.ui.libraryFilter;
  if (!filter || filter === 'all') {
    return state.library;
  }
  return state.library.filter((item) => item.subtype === filter);
}

/**
 * Busca un bloque de audio de la biblioteca por su identificador único.
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

  // Comprobar presencia de clips en el timeline (Sprint 3 — 5.1)
  const totalClips = state.tracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);
  const hasClips = totalClips > 0;

  // Botón Play / Pausa contextual
  const btnPlay = $('#btn-play');
  if (btnPlay) {
    if (!hasClips) {
      btnPlay.setAttribute('disabled', 'true');
      btnPlay.setAttribute('aria-disabled', 'true');
      btnPlay.setAttribute('aria-label', 'Reproducir (sin audio cargado)');
      btnPlay.setAttribute('title', 'Reproducir (sin audio cargado)');
      btnPlay.className = 'w-9 h-9 rounded-full flex items-center justify-center bg-violet-600 text-white shadow-md outline-none transition-all duration-150 opacity-40 cursor-not-allowed';
      btnPlay.innerHTML = '<i data-lucide="play" class="w-4 h-4 fill-white ml-0.5"></i>';
    } else {
      btnPlay.removeAttribute('disabled');
      btnPlay.setAttribute('aria-disabled', 'false');
      btnPlay.className = 'w-9 h-9 rounded-full flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white shadow-md glow-ai active:scale-95 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 outline-none transition-all duration-150 cursor-pointer';

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
      const trackOrder = ['track-voice', 'track-music', 'track-fx'];
      for (const tId of trackOrder) {
        const t = state.tracks.find((x) => x.id === tId || x.category === tId.replace('track-', ''));
        if (t && t.clips.length > 0) {
          activeClip = t.clips[0];
          break;
        }
      }
    }

    if (activeClip) {
      nowPlayingName.textContent = activeClip.name;
      nowPlayingName.setAttribute('title', activeClip.name);
      const audioTag = activeClip.objectUrl ? 'Audio real' : 'Demo (sin audio)';
      nowPlayingMeta.textContent = `${formatDuration(activeClip.duration)} · ${audioTag}`;
    } else {
      nowPlayingName.textContent = 'Ningún clip en la línea de tiempo';
      nowPlayingName.setAttribute('title', 'Ningún clip en la línea de tiempo');
      nowPlayingMeta.textContent = '—';
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
 * Renderiza el contador de ítems en la cabecera de la biblioteca con pluralización correcta.
 */
function renderLibraryCount() {
  const libraryCount = $('#library-count');
  if (libraryCount) {
    const count = getVisibleLibrary().length;
    libraryCount.textContent = count === 1 ? '1 ítem' : `${count} ítems`;
  }
}

/**
 * Renderiza las pestañas de filtro de categoría (#library-tabs).
 * Regla: Sin uso de tonos violeta; active usa slate-800 con borde inferior slate-100.
 */
function renderLibraryTabs() {
  const tabsContainer = $('#library-tabs');
  if (!tabsContainer) return;

  const currentFilter = state.ui.libraryFilter;

  // Conteo reactivo por categoría/subtipo
  const counts = {
    all: state.library.length,
    music: state.library.filter((i) => i.subtype === 'music').length,
    voice: state.library.filter((i) => i.subtype === 'voice').length,
    effect: state.library.filter((i) => i.subtype === 'effect').length,
    ad: state.library.filter((i) => i.subtype === 'ad').length
  };

  const tabsHtml = LIBRARY_FILTERS.map((f) => {
    const isActive = currentFilter === f.id;
    const count = counts[f.id] ?? 0;
    const activeClasses = 'bg-slate-800 text-white border-b-2 border-slate-100 font-semibold';
    const inactiveClasses = 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium border-b-2 border-transparent';

    return `
      <button
        type="button"
        role="tab"
        id="library-tab-${f.id}"
        data-filter="${f.id}"
        aria-selected="${isActive ? 'true' : 'false'}"
        tabindex="${isActive ? '0' : '-1'}"
        class="px-2.5 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 outline-none shrink-0 ${isActive ? activeClasses : inactiveClasses}"
      >
        <span>${f.label}</span>
        <span class="font-mono text-[10px] tabular-nums ${isActive ? 'text-slate-200' : 'text-slate-500'}">${count}</span>
      </button>
    `;
  }).join('');

  tabsContainer.innerHTML = tabsHtml;
}

/**
 * Renderiza la lista de tarjetas de audio (#library-list) o los estados vacíos correspondientes.
 */
function renderLibraryList() {
  const listContainer = $('#library-list');
  if (!listContainer) return;

  // Vinculación semántica con la pestaña activa
  listContainer.setAttribute('aria-labelledby', `library-tab-${state.ui.libraryFilter}`);

  // Estado vacío 1: Biblioteca sin bloques cargados (ej. library: [])
  if (state.library.length === 0) {
    listContainer.className = 'flex-1 min-h-0 p-3 overflow-y-auto flex flex-col';
    listContainer.innerHTML = `
      <div id="library-empty" class="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-800/80 rounded-xl bg-slate-950/40">
        <div class="w-12 h-12 rounded-full bg-slate-800/70 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
          <i data-lucide="file-audio" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xs font-semibold text-slate-300 mb-1">Tu biblioteca aparecerá aquí</h3>
        <p class="text-[11px] text-slate-500 leading-relaxed max-w-[190px]">
          Organiza clips de voz, pistas de fondo y efectos para componer tu episodio.
        </p>
      </div>
    `;
    return;
  }

  const visibleItems = getVisibleLibrary();

  // Estado vacío 2: Filtro activo sin resultados
  if (visibleItems.length === 0) {
    listContainer.className = 'flex-1 min-h-0 p-3 overflow-y-auto flex flex-col';
    listContainer.innerHTML = `
      <div id="library-empty" class="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-800/80 rounded-xl bg-slate-950/40">
        <div class="w-12 h-12 rounded-full bg-slate-800/70 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
          <i data-lucide="search-x" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xs font-semibold text-slate-300 mb-1">No hay bloques en esta categoría</h3>
        <p class="text-[11px] text-slate-500 leading-relaxed max-w-[190px]">
          No se encontraron audios correspondientes al filtro seleccionado.
        </p>
      </div>
    `;
    return;
  }

  // Lista con elementos: maquetación con espacio vertical constante
  listContainer.className = 'flex-1 min-h-0 p-3 overflow-y-auto space-y-2';
  const cardsHtml = visibleItems.map((item) => {
    const style = TRACK_STYLES[item.category] || TRACK_STYLES.voice;
    const subtypeLabel = SUBTYPE_LABELS[item.subtype] || item.subtype;
    const isSelected = state.selection.libraryId === item.id;
    const formattedDuration = formatDuration(item.duration);
    const fullAriaLabel = `${subtypeLabel}: ${item.name}, duración ${formattedDuration}. Arrastra para añadir a la línea de tiempo`;

    // Regla cromática: tarjeta seleccionada usa border-slate-400 bg-slate-800 (neutro sin violeta)
    const borderBgClasses = isSelected
      ? 'border-slate-400 bg-slate-800'
      : 'border-slate-800 bg-slate-900';

    return `
      <article
        id="lib-card-${item.id}"
        data-library-id="${item.id}"
        draggable="true"
        tabindex="0"
        role="button"
        aria-pressed="${isSelected ? 'true' : 'false'}"
        aria-label="${escapeHtml(fullAriaLabel)}"
        title="Arrastra a un carril de la línea de tiempo"
        class="group relative min-h-[64px] rounded-lg border ${borderBgClasses} hover:border-slate-600 hover:bg-slate-800/60 active:cursor-grabbing cursor-grab flex items-center gap-3 px-3 py-2 select-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 outline-none"
      >
        <!-- Barra de acento izquierda de 2px según categoría -->
        <span class="absolute left-0 top-0 bottom-0 w-0.5 rounded-l ${style.accentBar} pointer-events-none" aria-hidden="true"></span>

        <!-- Ícono: Recuadro 36x36 con estilo iconTile -->
        <div class="w-9 h-9 rounded-md border flex items-center justify-center shrink-0 ${style.iconTile} pointer-events-none" aria-hidden="true">
          <i data-lucide="${item.icon}" class="w-4 h-4"></i>
        </div>

        <!-- Centro: Nombre truncado y etiqueta con badge -->
        <div class="flex-1 min-w-0 flex flex-col justify-center pointer-events-none">
          <span class="text-xs font-medium text-slate-100 truncate" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          <span class="text-[10px] uppercase tracking-wider font-semibold ${style.badge}">${subtypeLabel}</span>
        </div>

        <!-- Derecha: Duración mono y grip indicativo de arrastre -->
        <div class="flex items-center gap-2 shrink-0 pointer-events-none">
          <span class="font-mono tabular-nums text-[11px] text-slate-400">${formattedDuration}</span>
          <i data-lucide="grip-vertical" class="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" aria-hidden="true"></i>
        </div>
      </article>
    `;
  }).join('');

  listContainer.innerHTML = cardsHtml;
}

/**
 * Renderiza los clips visuales en los 3 carriles del timeline (#timeline-tracks).
 * Sprint 3 (4.6): Muestra la posición (start * pps) y ancho (duration * pps) de cada clip,
 * junto con el nombre truncado, el badge "(sin audio)" si es mock, y los estados vacíos.
 */
function renderTimelineTracks() {
  const totalClips = state.tracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);
  const allTracksEmpty = totalClips === 0;
  const pps = getPixelsPerSecond();

  const laneElements = {
    voice: $('#timeline-track-voice'),
    music: $('#timeline-track-music'),
    fx: $('#timeline-track-fx')
  };

  for (const track of state.tracks) {
    const lane = laneElements[track.category];
    if (!lane) continue;

    const clips = track.clips || [];

    if (clips.length === 0) {
      if (allTracksEmpty) {
        lane.innerHTML = `
          <div class="h-full flex items-center justify-center gap-2 text-slate-500 px-4 select-none pointer-events-none">
            <i data-lucide="film" class="w-4 h-4 text-slate-600 shrink-0"></i>
            <span class="text-xs font-medium">Arrastra bloques desde la biblioteca para empezar</span>
          </div>
        `;
      } else {
        lane.innerHTML = `
          <div class="h-full flex items-center justify-center text-slate-600 px-4 select-none pointer-events-none">
            <span class="text-xs italic">Carril vacío</span>
          </div>
        `;
      }
    } else {
      const clipsHtml = clips.map((clip) => {
        const leftPx = Math.round((clip.start || 0) * pps);
        const widthPx = Math.max(38, Math.round((clip.duration || 0) * pps));
        const isSelected = state.selection.clipId === clip.id;
        const style = TRACK_STYLES[clip.category] || TRACK_STYLES.voice;
        const hasAudio = Boolean(clip.objectUrl);
        const formattedDuration = formatDuration(clip.duration);
        const startFormatted = formatDuration(clip.start);
        const endFormatted = formatDuration((clip.start || 0) + (clip.duration || 0));
        const fullAriaLabel = `${clip.name}, de ${startFormatted} a ${endFormatted}`;

        const selectionClasses = isSelected
          ? 'ring-2 ring-white border-white shadow-lg z-20'
          : 'hover:brightness-110 z-10';

        return `
          <div
            id="timeline-clip-${clip.id}"
            data-clip-id="${clip.id}"
            data-track-id="${track.id}"
            role="button"
            tabindex="0"
            aria-label="${escapeHtml(fullAriaLabel)}"
            title="${escapeHtml(clip.name)} (${formattedDuration})"
            class="timeline-clip absolute top-1.5 bottom-1.5 rounded-md border flex items-center px-2.5 gap-2 cursor-pointer select-none transition-all duration-150 ${style.clip} ${selectionClasses}"
            style="left: ${leftPx}px; width: ${widthPx}px;"
          >
            <span class="text-xs font-semibold truncate ${style.text} flex-1 min-w-0">${escapeHtml(clip.name)}</span>
            ${!hasAudio
              ? '<span class="text-[9px] text-slate-400 font-mono shrink-0 whitespace-nowrap bg-slate-900/70 px-1 py-0.5 rounded border border-slate-700/60 leading-none">(sin audio)</span>'
              : '<span class="text-[10px] font-mono text-slate-200 shrink-0 opacity-80 tabular-nums leading-none">' + formattedDuration + '</span>'}
          </div>
        `;
      }).join('');

      lane.innerHTML = clipsHtml;
    }
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
 * Ciclo completo de renderizado sincronizado con el Store central.
 * Utiliza comparación de estado previo para evitar re-renderizados innecesarios.
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
    currentState.ui.libraryFilter !== prevState.ui.libraryFilter ||
    currentState.selection.libraryId !== prevState.selection.libraryId
  );

  const tracksChanged = isInitial || (
    currentState.tracks !== prevState.tracks ||
    currentState.selection.clipId !== prevState?.selection?.clipId ||
    currentState.project.zoom !== prevState?.project?.zoom
  );

  // CRÍTICO: Nótese que currentState.ui.draggingLibraryId NO dispara libraryChanged.
  // Durante el arrastre, cambiar draggingLibraryId NO debe destruir ni regenerar
  // el nodo de la tarjeta en el DOM, ya que de lo contrario el navegador aborta el dragstart.

  if (projectChanged) {
    renderTopbar();
    renderTransport();
  }

  if (libraryChanged) {
    renderLibraryTabs();
    renderLibraryList();
    renderLibraryCount();
  }

  if (tracksChanged) {
    renderTimelineTracks();
    renderTransport();
  }

  renderIcons();
}



/* ==========================================================================
   6. EVENTS
   ========================================================================== */

/**
 * Instancia global y única de audio para reproducción real en la estación de trabajo.
 */
const globalAudio = new Audio();

globalAudio.addEventListener('ended', () => {
  setState({ project: { isPlaying: false } });
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
 * Conecta los eventos de controles de transporte y audio (Sprint 3 — 5.2).
 */
function bindTransportEvents() {
  // Play / Pausa contextual y reproducción de audio real
  const btnPlay = $('#btn-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      const totalClips = state.tracks.reduce((acc, t) => acc + (t.clips ? t.clips.length : 0), 0);
      if (totalClips === 0) return; // Deshabilitado si no hay clips

      if (state.project.isPlaying) {
        globalAudio.pause();
        setState({
          project: { isPlaying: false }
        });
      } else {
        // Localizar clip a reproducir: clip seleccionado o primer clip en orden voice -> music -> fx
        let targetClip = null;
        if (state.selection.clipId) {
          for (const t of state.tracks) {
            const found = t.clips.find((c) => c.id === state.selection.clipId);
            if (found) {
              targetClip = found;
              break;
            }
          }
        }
        if (!targetClip) {
          const trackOrder = ['track-voice', 'track-music', 'track-fx'];
          for (const tId of trackOrder) {
            const t = state.tracks.find((x) => x.id === tId || x.category === tId.replace('track-', ''));
            if (t && t.clips.length > 0) {
              targetClip = t.clips[0];
              break;
            }
          }
        }

        if (targetClip && targetClip.objectUrl) {
          if (globalAudio.src !== targetClip.objectUrl) {
            globalAudio.src = targetClip.objectUrl;
            globalAudio.currentTime = 0;
          }
          syncGlobalAudioVolume();
          globalAudio.play().catch((err) => {
            console.warn('[PodcastCraft AI] Error en reproducción de audio real:', err);
          });
        } else {
          // Si el clip no tiene objectUrl (viene de MOCK_LIBRARY vía loadSampleLibrary()),
          // simula la reproducción como en el Sprint 1 (solo cambia el ícono y el estado, sin audio real)
          globalAudio.pause();
        }

        setState({
          project: { isPlaying: true }
        });
      }
    });
  }

  // Retroceder 5 segundos
  const btnRewind = $('#btn-rewind');
  if (btnRewind) {
    btnRewind.addEventListener('click', () => {
      const nextTime = clamp(state.project.currentTime - 5, 0, state.project.duration);
      if (globalAudio.src && !isNaN(globalAudio.currentTime)) {
        globalAudio.currentTime = Math.max(0, globalAudio.currentTime - 5);
      }
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
      if (globalAudio.src && !isNaN(globalAudio.currentTime)) {
        globalAudio.currentTime = Math.min(globalAudio.duration || 0, globalAudio.currentTime + 5);
      }
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
      syncGlobalAudioVolume();
    };
    volumeSlider.addEventListener('input', updateVolumeFromInput);
    volumeSlider.addEventListener('change', updateVolumeFromInput);
  }

  // Alternar Mute
  const btnMute = $('#btn-mute');
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      const nextMuted = !state.project.isMuted;
      setState({
        project: {
          isMuted: nextMuted
        }
      });
      syncGlobalAudioVolume();
    });
  }
}

/**
 * Conecta los eventos de importación de audio real del sistema de archivos (Sprint 3 — 3.1 & 3.2).
 */
function bindImportAudioEvents() {
  const btnImport = $('#btn-import-audio');
  const fileInput = $('#audio-file-input');

  if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newItems = [];
      for (const file of Array.from(files)) {
        const objectUrl = URL.createObjectURL(file);
        const audio = new Audio(objectUrl);

        // Esperar evento loadedmetadata para leer la duración real del archivo
        const duration = await new Promise((resolve) => {
          const onLoaded = () => {
            cleanup();
            let dur = audio.duration;
            // Fallback documentado: en ciertos formatos comprimidos o streaming, duration puede reportar Infinity o NaN
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
          }, 3000);

          function cleanup() {
            clearTimeout(timer);
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('error', onError);
          }

          audio.addEventListener('loadedmetadata', onLoaded);
          audio.addEventListener('error', onError);
        });

        // Simplificación documentada (Sprint 3): todo archivo importado entra por defecto como 'voice'
        // Regla de memoria para sprints futuros: URL.revokeObjectURL(item.objectUrl) al eliminar ítems
        const newItem = {
          id: `lib-import-${crypto.randomUUID()}`,
          name: file.name.replace(/\.[^/.]+$/, ''), // sin extensión
          category: 'voice',
          subtype: 'voice',
          duration: duration,
          icon: 'file-audio',
          objectUrl,
          isImported: true
        };
        newItems.push(newItem);
      }

      setState({
        library: [...state.library, ...newItems]
      });

      // Limpiar input.value para permitir reimportar el mismo archivo
      fileInput.value = '';
      console.info(`[PodcastCraft AI] ${newItems.length} archivo(s) de audio importado(s) a la biblioteca.`);
    });
  }
}

/**
 * Conecta los eventos del Timeline: drop zones delegadas, prevención de colisión y selección (Sprint 3 — 4.3 & 4.4).
 */
function bindTimelineEvents() {
  const timelineTracks = $('#timeline-tracks');
  if (!timelineTracks) return;

  // 1. dragover delegado sobre los carriles
  timelineTracks.addEventListener('dragover', (e) => {
    // e.preventDefault() ÚNICAMENTE si dataTransfer incluye DRAG_MIME (Sprint 3 — 4.3)
    if (!e.dataTransfer.types.includes(DRAG_MIME)) {
      return;
    }
    e.preventDefault();

    const lane = e.target.closest('#timeline-track-voice, #timeline-track-music, #timeline-track-fx');
    if (!lane) return;

    const draggingId = state.ui.draggingLibraryId;
    const draggingItem = draggingId ? getLibraryItem(draggingId) : null;
    const laneCategory = lane.dataset.category;

    // Resalta visualmente el carril activo solo si coincide la categoría
    if (draggingItem && draggingItem.category === laneCategory) {
      e.dataTransfer.dropEffect = 'copy';
      lane.classList.add(`lane-highlight-${laneCategory}`);
      lane.style.cursor = '';
    } else {
      e.dataTransfer.dropEffect = 'none';
      lane.classList.remove('lane-highlight-voice', 'lane-highlight-music', 'lane-highlight-fx');
      lane.style.cursor = 'not-allowed';
    }
  });

  // 2. dragleave delegado sobre los carriles
  timelineTracks.addEventListener('dragleave', (e) => {
    const lane = e.target.closest('#timeline-track-voice, #timeline-track-music, #timeline-track-fx');
    if (lane && !lane.contains(e.relatedTarget)) {
      lane.classList.remove('lane-highlight-voice', 'lane-highlight-music', 'lane-highlight-fx');
      lane.style.cursor = '';
    }
  });

  // 3. drop delegado sobre un carril
  timelineTracks.addEventListener('drop', (e) => {
    const lane = e.target.closest('#timeline-track-voice, #timeline-track-music, #timeline-track-fx');
    if (!lane) return;

    lane.classList.remove('lane-highlight-voice', 'lane-highlight-music', 'lane-highlight-fx');
    lane.style.cursor = '';

    if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
    e.preventDefault();

    let payload;
    try {
      payload = JSON.parse(e.dataTransfer.getData(DRAG_MIME));
    } catch (err) {
      console.warn('[PodcastCraft AI] Error parseando datos de arrastre:', err);
      return;
    }

    if (!payload || !payload.category) return;
    const destinationCategory = lane.dataset.category;

    // Validación de categoría destino: rechazo con parpadeo rojo breve de 200ms
    if (payload.category !== destinationCategory) {
      lane.classList.add('lane-reject-flash');
      setTimeout(() => {
        lane.classList.remove('lane-reject-flash');
      }, 200);
      setState({ ui: { draggingLibraryId: null } });
      return;
    }

    // Calcular posición horizontal (start) a partir de X del drop convertida a segundos
    const rect = lane.getBoundingClientRect();
    const dropX = e.clientX - rect.left + lane.scrollLeft;
    const pps = getPixelsPerSecond();
    let start = Math.max(0, Math.round(dropX / pps));
    const duration = Math.round(payload.duration || 0);
    let end = start + duration;

    // Evitar overlap simple: si se solapa con un clip existente, mover al final del clip más cercano
    const targetTrack = state.tracks.find((t) => t.category === destinationCategory);
    if (!targetTrack) return;

    const existingClips = [...targetTrack.clips].sort((a, b) => a.start - b.start);
    for (const c of existingClips) {
      const cStart = c.start || 0;
      const cEnd = cStart + (c.duration || 0);
      if (start < cEnd && end > cStart) {
        start = cEnd;
        end = start + duration;
      }
    }

    // Traer objectUrl del ítem de biblioteca original si existe
    const libItem = getLibraryItem(payload.libraryId);
    const objectUrl = libItem ? (libItem.objectUrl ?? null) : null;

    // Construir nuevo clip para el carril
    const newClip = {
      id: `clip-${crypto.randomUUID()}`,
      libraryId: payload.libraryId,
      name: payload.name,
      category: payload.category,
      duration: duration,
      start: start,
      objectUrl: objectUrl
    };

    // Actualización inmutable de tracks y recálculo de duración total
    const nextTracks = state.tracks.map((t) => {
      if (t.id === targetTrack.id) {
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
      project: {
        duration: nextDuration
      },
      ui: {
        draggingLibraryId: null
      },
      selection: {
        clipId: newClip.id
      }
    });

    console.info('[PodcastCraft AI] Clip colocado en carril:', newClip);
  });

  // 4. Delegación de selección por clic sobre clips del timeline
  timelineTracks.addEventListener('click', (e) => {
    const clipEl = e.target.closest('[data-clip-id]');
    if (clipEl) {
      const clipId = clipEl.dataset.clipId;
      const nextClipId = state.selection.clipId === clipId ? null : clipId;
      setState({ selection: { clipId: nextClipId } });
    } else {
      // Clic en área vacía del timeline deselecciona
      if (state.selection.clipId !== null) {
        setState({ selection: { clipId: null } });
      }
    }
  });

  // 5. Navegación por teclado en clips del timeline
  timelineTracks.addEventListener('keydown', (e) => {
    const clipEl = e.target.closest('[data-clip-id]');
    if (e.key === 'Enter' || e.key === ' ') {
      if (clipEl) {
        e.preventDefault();
        const clipId = clipEl.dataset.clipId;
        const nextClipId = state.selection.clipId === clipId ? null : clipId;
        setState({ selection: { clipId: nextClipId } });
      }
    } else if (e.key === 'Escape') {
      if (state.selection.clipId !== null) {
        e.preventDefault();
        setState({ selection: { clipId: null } });
      }
    }
  });
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
 * Conecta todos los eventos de la biblioteca de medios:
 * Filtro por pestañas, selección de tarjeta, navegación por teclado y fuente Drag & Drop.
 */
function bindLibraryEvents() {
  const tabsContainer = $('#library-tabs');
  const listContainer = $('#library-list');

  // 1. Delegación sobre pestañas de categorías
  if (tabsContainer) {
    // Clic en pestaña
    tabsContainer.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-filter]');
      if (!tabBtn) return;

      const filter = tabBtn.dataset.filter;
      if (filter && filter !== state.ui.libraryFilter) {
        setState({ ui: { libraryFilter: filter } });
      }
    });

    // Navegación por teclado en pestañas (patrón WAI-ARIA roving tabindex)
    tabsContainer.addEventListener('keydown', (e) => {
      const tabButtons = Array.from(tabsContainer.querySelectorAll('[role="tab"]'));
      const activeEl = document.activeElement;
      const currentIndex = tabButtons.indexOf(activeEl);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabButtons.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabButtons.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      const targetTab = tabButtons[nextIndex];
      if (targetTab) {
        const filter = targetTab.dataset.filter;
        setState({ ui: { libraryFilter: filter } });

        // Enfocar la nueva pestaña activa tras el render
        requestAnimationFrame(() => {
          const newActiveTab = $(`#library-tab-${filter}`);
          if (newActiveTab) newActiveTab.focus();
        });
      }
    });
  }

  // 2. Delegación sobre la lista de tarjetas
  if (listContainer) {
    // Selección por clic
    listContainer.addEventListener('click', (e) => {
      const card = e.target.closest('[data-library-id]');
      if (!card) {
        // Clic en el área vacía de la lista deselecciona cualquier tarjeta activa
        if (state.selection.libraryId !== null) {
          setState({ selection: { libraryId: null } });
        }
        return;
      }

      const id = card.dataset.libraryId;
      // Toggle de selección: segundo clic deselecciona
      const nextId = state.selection.libraryId === id ? null : id;
      setState({ selection: { libraryId: nextId } });
    });

    // Navegación por teclado y selección en la lista
    listContainer.addEventListener('keydown', (e) => {
      const card = e.target.closest('[data-library-id]');
      const cards = Array.from(listContainer.querySelectorAll('[data-library-id]'));
      const currentIndex = cards.indexOf(card);

      if (e.key === 'Enter' || e.key === ' ') {
        if (card) {
          e.preventDefault();
          const id = card.dataset.libraryId;
          const nextId = state.selection.libraryId === id ? null : id;
          setState({ selection: { libraryId: nextId } });
        }
      } else if (e.key === 'Escape') {
        if (state.selection.libraryId !== null) {
          e.preventDefault();
          setState({ selection: { libraryId: null } });
        }
      } else if (e.key === 'ArrowDown') {
        if (cards.length > 0) {
          e.preventDefault();
          const nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
          cards[nextIndex].focus();
        }
      } else if (e.key === 'ArrowUp') {
        if (cards.length > 0) {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
          cards[prevIndex].focus();
        }
      }
    });

    // 3. Inicio del arrastre (dragstart)
    listContainer.addEventListener('dragstart', (e) => {
      const card = e.target.closest('[data-library-id]');
      if (!card) return;

      const id = card.dataset.libraryId;
      const item = getLibraryItem(id);
      if (!item) return;

      // Payload estandarizado según contrato con Sprint 3
      const payload = {
        libraryId: item.id,
        name: item.name,
        category: item.category,
        subtype: item.subtype,
        duration: item.duration,
        icon: item.icon
      };

      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));

      // Requisito indispensable para Firefox: sin setData('text/plain') no se inicia el arrastre
      e.dataTransfer.setData('text/plain', item.name);

      // Píldora visual compacta como imagen de arrastre (ícono + nombre, fondo slate-800, borde de categoría)
      const pill = document.createElement('div');
      const borderClass = item.category === 'voice' ? 'border-sky-500' :
                          item.category === 'music' ? 'border-amber-500' :
                          'border-emerald-500';

      pill.className = `fixed -top-[9999px] -left-[9999px] z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border ${borderClass} shadow-xl pointer-events-none select-none`;

      const cardIcon = card.querySelector('svg');
      if (cardIcon) {
        const iconClone = cardIcon.cloneNode(true);
        iconClone.setAttribute('class', 'w-3.5 h-3.5 shrink-0 text-slate-200');
        pill.appendChild(iconClone);
      }

      const nameEl = document.createElement('span');
      nameEl.className = 'text-xs font-medium truncate max-w-[160px] text-slate-100';
      nameEl.textContent = item.name;
      pill.appendChild(nameEl);

      document.body.appendChild(pill);
      e.dataTransfer.setDragImage(pill, 20, 16);

      // Limpieza de la píldora en el siguiente ciclo de render
      requestAnimationFrame(() => {
        pill.remove();
      });

      // ÚNICA EXCEPCIÓN DOCUMENTADA DE MANIPULACIÓN DIRECTA DEL DOM:
      // Se aplica la clase is-dragging directamente en la tarjeta de audio sin provocar
      // un re-renderizado del contenedor. Si el DOM destruyese la tarjeta mientras se arrastra,
      // el motor del navegador cancelaría el evento de arrastre de inmediato.
      card.classList.add('is-dragging');

      // Actualizamos el estado para que el Sprint 3 pueda identificar el bloque en dragover
      setState({ ui: { draggingLibraryId: id } });

      console.info('[PodcastCraft AI] dragstart', payload);
    });

    // 4. Fin del arrastre (dragend)
    listContainer.addEventListener('dragend', (e) => {
      const card = e.target.closest('[data-library-id]');
      if (card) {
        card.classList.remove('is-dragging');
      } else {
        // Fallback defensivo por si el puntero finalizó fuera del elemento
        const draggingCards = listContainer.querySelectorAll('.is-dragging');
        draggingCards.forEach((c) => c.classList.remove('is-dragging'));
      }

      setState({ ui: { draggingLibraryId: null } });

      console.info('[PodcastCraft AI] dragend');
    });
  }
}

/**
 * Guardia global de escritorio obligatoria:
 * Previene que arrastrar y soltar un bloque o un archivo externo del sistema operativo
 * sobre cualquier punto de la ventana provoque que el navegador navegue a file:// o abra el archivo.
 * En un empaquetado de escritorio con Electron o Tauri, esta guardia es esencial para
 * evitar la pérdida del estado de la aplicación o caídas de ejecución.
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
  checkViewport(); // Evaluación inicial al cargar
}


/* ==========================================================================
   7. INIT
   ========================================================================== */

// Suscribir el ciclo de renderizado a cambios del Store central
subscribe(renderAll);

document.addEventListener('DOMContentLoaded', () => {
  // 1. Renderizado inicial de datos reactivos (Clean slate)
  renderAll();

  // 2. Vinculación de escuchadores de eventos
  bindTransportEvents();
  bindTopbarEvents();
  bindLibraryEvents();
  bindImportAudioEvents();
  bindTimelineEvents();
  bindGlobalDragGuard();
  bindViewportGuard();

  // Soporte opcional por parámetro URL (?sample=true o ?demo=true) para evaluación y testing rápido
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sample') === 'true' || urlParams.get('demo') === 'true') {
      window.PodcastCraft.loadSampleLibrary();
    }
  } catch (err) {
    // Entorno sin soporte de URLSearchParams
  }

  console.info('[PodcastCraft AI] Sprint 3 (Pivote local funcional) inicializado correctamente. Sistema listo.');
});

