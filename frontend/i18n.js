/* ==========================================================================
   PodcastCraft AI — Módulo de Internacionalización (i18n)
   Fase 10: Infraestructura i18n (Español / Inglés)
   ========================================================================== */

/**
 * Diccionarios centralizados de traducción para la interfaz de usuario.
 * Estructura extensible para cubrir todos los componentes de la estación de trabajo.
 */
const I18N = {
  es: {
    // Aplicación y Barra Superior (Topbar)
    'app.title': 'PodcastCraft AI — Editor Profesional de Podcasts con IA',
    'app.badge.draft': 'Borrador',
    'app.badge.saved': 'Guardado',
    'topbar.ariaLabel': 'Barra superior de herramientas',
    'topbar.untitledProject': 'Proyecto sin título',
    'topbar.duration': 'Duración total',
    'topbar.aiAnalysis': 'Análisis de IA',
    'topbar.aiAnalysisAria': 'Iniciar análisis inteligente con IA',
    'topbar.aiAnalysisTitle': 'Análisis de IA',
    'topbar.export': 'Exportar Podcast',
    'topbar.exportAria': 'Exportar podcast final',
    'topbar.exportTitle': 'Exportar Podcast',
    'theme.switchToDark': 'Cambiar a modo oscuro',
    'theme.switchToLight': 'Cambiar a modo claro',
    'settings.languageToggleAria': 'Cambiar a inglés',

    // Barra de Transporte y Reproducción (Transport)
    'transport.ariaLabel': 'Controles de transporte y reproducción',
    'transport.noClip': 'Ningún clip en la línea de tiempo',
    'transport.rewindAria': 'Retroceder 5 segundos',
    'transport.rewindTitle': 'Retroceder 5s (J)',
    'transport.playDisabledAria': 'Reproducir (sin audio cargado)',
    'transport.playDisabledTitle': 'Reproducir (sin audio cargado)',
    'transport.playAria': 'Reproducir',
    'transport.playTitle': 'Reproducir (Espacio)',
    'transport.pauseAria': 'Pausar',
    'transport.pauseTitle': 'Pausar (Espacio)',
    'transport.forwardAria': 'Avanzar 5 segundos',
    'transport.forwardTitle': 'Avanzar 5s (L)',
    'transport.muteAria': 'Silenciar audio',
    'transport.muteTitle': 'Silenciar audio (M)',
    'transport.unmuteAria': 'Activar sonido',
    'transport.unmuteTitle': 'Activar sonido (M)',
    'transport.volumeAria': 'Control de volumen de reproducción',
    'transport.volumeTitle': 'Volumen',

    // Biblioteca de Medios (Library)
    'library.asideAria': 'Biblioteca de bloques de audio',
    'library.title': 'Biblioteca',
    'library.countSingle': '1 audio',
    'library.countPlural': '{count} audios',
    'library.importAria': 'Importar archivos MP3 desde tu computador',
    'library.importTitle': 'Importar archivos MP3',
    'library.importBtn': 'Importar MP3',
    'library.listAria': 'Audios importados',
    'library.emptyTitle': 'Tu biblioteca aparecerá aquí',
    'library.emptyDesc': 'Importa archivos MP3 desde tu computador para estructurar tu episodio.',
    'library.durationLabel': 'duración',
    'library.dragToTrack': 'Arrastra a un carril',
    'library.cardDragTitle': 'Arrastra a cualquier carril del timeline',
    'library.feedbackOnlyMp3': 'Solo se permiten archivos MP3',
    'library.feedbackNonMp3Ignored': '{count} archivo(s) no eran MP3 y fueron ignorados',
    'library.feedbackServerConnError': 'No se pudo conectar con el servidor local. Verifica que el backend esté corriendo.',

    // Línea de Tiempo (Timeline)
    'timeline.sectionAria': 'Línea de tiempo multipista',
    'timeline.title': 'Línea de tiempo',
    'timeline.addTrackAria': 'Agregar nuevo carril',
    'timeline.addTrackTitle': 'Agregar nuevo carril',
    'timeline.addTrackBtn': 'Nuevo Carril',
    'timeline.zoomLabel': 'Zoom',
    'timeline.zoomSliderAria': 'Nivel de zoom de la línea de tiempo',
    'timeline.zoomSliderTitle': 'Nivel de zoom',
    'timeline.rulerAria': 'Buscar posición en la línea de tiempo',
    'timeline.emptyTracksTitle': 'Aún no tienes carriles',
    'timeline.emptyTracksDesc': 'Crea un carril para empezar a construir tu episodio y arrastrar archivos de audio.',
    'timeline.createFirstTrack': 'Crear Primer Carril',
    'timeline.createFirstTrackAria': 'Crear primer carril',
    'timeline.defaultTrackPrefix': 'Carril',
    'timeline.doubleClickToRename': 'Doble clic para renombrar',
    'timeline.renameTrackAria': 'Renombrar carril',
    'timeline.renameTrackPlaceholder': 'Nombre del carril',
    'timeline.deleteTrackAria': 'Eliminar carril',
    'timeline.deleteTrackTitle': 'Eliminar carril',
    'timeline.deleteTrackConfirm': 'Este carril tiene {count} clip(s). ¿Eliminarlo de todas formas?',
    'timeline.emptyLane': 'Carril vacío — Arrastra un audio aquí',
    'timeline.clipFrom': 'de',
    'timeline.clipTo': 'a',
    'timeline.doubleClickToSplit': 'Doble clic para dividir',
    'timeline.dragToTrimStart': 'Arrastra para recortar inicio',
    'timeline.dragToTrimEnd': 'Arrastra para recortar final',

    // Espacio de Trabajo y Ajustes
    'workspace.ariaLabel': 'Espacio de trabajo del editor',
    'settings.quickGroupAria': 'Ajustes rápidos de interfaz',

    // Panel de Asistente IA (AI Panel)
    'aiPanel.sectionAria': 'Panel de asistente de inteligencia artificial',
    'aiPanel.title': 'Asistente de IA',
    'aiPanel.betaBadge': 'Beta',
    'aiPanel.transcriptEmptyTitle': 'La transcripción aparecerá aquí',
    'aiPanel.transcriptEmptyDesc': 'El modelo transcribirá tus archivos de audio y resaltará muletillas y silencios automáticamente.',
    'aiPanel.ctaAria': 'Limpiar audio con IA (Se activará tras el análisis)',
    'aiPanel.ctaTitle': 'Limpiar Audio con IA',
    'aiPanel.ctaBtn': 'Limpiar Audio con IA',

    // Guardia de Pantalla (Viewport Warning)
    'viewport.title': 'Resolución no optimizada',
    'viewport.subtitle': 'PodcastCraft AI está optimizado para pantallas de escritorio ≥ 1280px',
    'viewport.description': 'Para utilizar todas las herramientas de la estación de trabajo y la línea de tiempo multipista, amplía la ventana de tu navegador.',

    // Mensajes de Conexión del Backend
    'topbar.feedbackSaveError': 'No se pudo guardar en el servidor local. Verifica que el backend esté corriendo.',
    'topbar.feedbackServerOffline': 'Servidor local no detectado. Los cambios se mantendrán solo durante esta sesión.'
  },
  en: {
    // Aplicación y Barra Superior (Topbar)
    'app.title': 'PodcastCraft AI — Professional AI Podcast Editor',
    'app.badge.draft': 'Draft',
    'app.badge.saved': 'Saved',
    'topbar.ariaLabel': 'Top toolbar',
    'topbar.untitledProject': 'Untitled Project',
    'topbar.duration': 'Total duration',
    'topbar.aiAnalysis': 'AI Analysis',
    'topbar.aiAnalysisAria': 'Start smart AI analysis',
    'topbar.aiAnalysisTitle': 'AI Analysis',
    'topbar.export': 'Export Podcast',
    'topbar.exportAria': 'Export final podcast',
    'topbar.exportTitle': 'Export Podcast',
    'theme.switchToDark': 'Switch to dark mode',
    'theme.switchToLight': 'Switch to light mode',
    'settings.languageToggleAria': 'Switch to Spanish',

    // Barra de Transporte y Reproducción (Transport)
    'transport.ariaLabel': 'Transport and playback controls',
    'transport.noClip': 'No clip on timeline',
    'transport.rewindAria': 'Rewind 5 seconds',
    'transport.rewindTitle': 'Rewind 5s (J)',
    'transport.playDisabledAria': 'Play (no audio loaded)',
    'transport.playDisabledTitle': 'Play (no audio loaded)',
    'transport.playAria': 'Play',
    'transport.playTitle': 'Play (Space)',
    'transport.pauseAria': 'Pause',
    'transport.pauseTitle': 'Pause (Space)',
    'transport.forwardAria': 'Forward 5 seconds',
    'transport.forwardTitle': 'Forward 5s (L)',
    'transport.muteAria': 'Mute audio',
    'transport.muteTitle': 'Mute audio (M)',
    'transport.unmuteAria': 'Unmute audio',
    'transport.unmuteTitle': 'Unmute audio (M)',
    'transport.volumeAria': 'Playback volume control',
    'transport.volumeTitle': 'Volume',

    // Biblioteca de Medios (Library)
    'library.asideAria': 'Audio block library',
    'library.title': 'Library',
    'library.countSingle': '1 audio',
    'library.countPlural': '{count} audio files',
    'library.importAria': 'Import MP3 files from your computer',
    'library.importTitle': 'Import MP3 files',
    'library.importBtn': 'Import MP3',
    'library.listAria': 'Imported audio files',
    'library.emptyTitle': 'Your library will appear here',
    'library.emptyDesc': 'Import MP3 files from your computer to structure your episode.',
    'library.durationLabel': 'duration',
    'library.dragToTrack': 'Drag to a track',
    'library.cardDragTitle': 'Drag to any track on the timeline',
    'library.feedbackOnlyMp3': 'Only MP3 files are allowed',
    'library.feedbackNonMp3Ignored': '{count} file(s) were not MP3 and were ignored',
    'library.feedbackServerConnError': 'Could not connect to local server. Make sure the backend is running.',

    // Línea de Tiempo (Timeline)
    'timeline.sectionAria': 'Multitrack timeline',
    'timeline.title': 'Timeline',
    'timeline.addTrackAria': 'Add new track',
    'timeline.addTrackTitle': 'Add new track',
    'timeline.addTrackBtn': 'New Track',
    'timeline.zoomLabel': 'Zoom',
    'timeline.zoomSliderAria': 'Timeline zoom level',
    'timeline.zoomSliderTitle': 'Zoom level',
    'timeline.rulerAria': 'Seek position in timeline',
    'timeline.emptyTracksTitle': "You don't have tracks yet",
    'timeline.emptyTracksDesc': 'Create a track to start building your episode and drag audio files.',
    'timeline.createFirstTrack': 'Create First Track',
    'timeline.createFirstTrackAria': 'Create first track',
    'timeline.defaultTrackPrefix': 'Track',
    'timeline.doubleClickToRename': 'Double-click to rename',
    'timeline.renameTrackAria': 'Rename track',
    'timeline.renameTrackPlaceholder': 'Track name',
    'timeline.deleteTrackAria': 'Delete track',
    'timeline.deleteTrackTitle': 'Delete track',
    'timeline.deleteTrackConfirm': 'This track contains {count} clip(s). Delete it anyway?',
    'timeline.emptyLane': 'Empty track — Drag audio here',
    'timeline.clipFrom': 'from',
    'timeline.clipTo': 'to',
    'timeline.doubleClickToSplit': 'Double-click to split',
    'timeline.dragToTrimStart': 'Drag to trim start',
    'timeline.dragToTrimEnd': 'Drag to trim end',

    // Espacio de Trabajo y Ajustes
    'workspace.ariaLabel': 'Editor workspace',
    'settings.quickGroupAria': 'Quick interface settings',

    // Panel de Asistente IA (AI Panel)
    'aiPanel.sectionAria': 'Artificial intelligence assistant panel',
    'aiPanel.title': 'AI Assistant',
    'aiPanel.betaBadge': 'Beta',
    'aiPanel.transcriptEmptyTitle': 'Transcript will appear here',
    'aiPanel.transcriptEmptyDesc': 'The model will transcribe your audio files and automatically highlight filler words and silences.',
    'aiPanel.ctaAria': 'Clean audio with AI (Enabled after analysis)',
    'aiPanel.ctaTitle': 'Clean Audio with AI',
    'aiPanel.ctaBtn': 'Clean Audio with AI',

    // Guardia de Pantalla (Viewport Warning)
    'viewport.title': 'Unoptimized Resolution',
    'viewport.subtitle': 'PodcastCraft AI is optimized for desktop displays ≥ 1280px',
    'viewport.description': 'To use all digital audio workstation tools and multitrack timeline, expand your browser window.',

    // Mensajes de Conexión del Backend
    'topbar.feedbackSaveError': 'Could not save to local server. Make sure the backend is running.',
    'topbar.feedbackServerOffline': 'Local server not detected. Changes will only persist during this session.'
  }
};

/**
 * Obtiene el idioma actualmente seleccionado ('es' o 'en').
 * Por defecto contractualmente es 'es'.
 * @returns {'es' | 'en'}
 */
function getCurrentLanguage() {
  try {
    return localStorage.getItem('podcastcraft-language') === 'en' ? 'en' : 'es';
  } catch (_) {
    return 'es';
  }
}

/**
 * Actualiza la preferencia de idioma en localStorage y en el atributo lang de <html>.
 * @param {'es' | 'en'} lang
 */
function setLanguage(lang) {
  const finalLang = lang === 'en' ? 'en' : 'es';
  try {
    localStorage.setItem('podcastcraft-language', finalLang);
  } catch (err) {
    console.warn('[PodcastCraft AI] Error guardando preferencia de idioma en localStorage:', err);
  }
  document.documentElement.setAttribute('lang', finalLang);
}

/**
 * Traduce una clave al idioma activo con doble fallback (primero español, luego la clave misma).
 * @param {string} key
 * @returns {string}
 */
function t(key) {
  const lang = getCurrentLanguage();
  return (I18N[lang] && I18N[lang][key]) || (I18N.es && I18N.es[key]) || key;
}

/**
 * Aplica todas las traducciones a elementos del DOM marcados con data-i18n,
 * data-i18n-aria-label o data-i18n-title, actualiza controles dinámicos y
 * refresca el botón de cambio de idioma.
 */
function applyTranslations() {
  const lang = getCurrentLanguage();
  document.documentElement.setAttribute('lang', lang);
  document.title = t('app.title');

  // 1. Textos directos
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // 2. Atributos aria-label accesibles
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    el.setAttribute('aria-label', t(key));
  });

  // 3. Atributos title (tooltips nativos)
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key));
  });

  // 4. Botón de alternancia de idioma (#btn-language-toggle)
  const langToggleBtn = document.getElementById('btn-language-toggle');
  if (langToggleBtn) {
    const targetLang = lang === 'es' ? 'en' : 'es';
    langToggleBtn.textContent = targetLang.toUpperCase();
    const label = t('settings.languageToggleAria');
    langToggleBtn.setAttribute('aria-label', label);
    langToggleBtn.setAttribute('title', label);
  }

  // 5. Re-renderizado de componentes con estados dinámicos si las funciones existen
  if (typeof renderTopbar === 'function') {
    renderTopbar();
  }
  if (typeof renderTransport === 'function') {
    renderTransport();
  }
  if (typeof renderLibraryCount === 'function') {
    renderLibraryCount();
  }
  if (typeof renderLibraryList === 'function') {
    renderLibraryList();
  }
  if (typeof renderTimelineTracks === 'function') {
    renderTimelineTracks();
  }
  if (typeof renderIcons === 'function') {
    renderIcons();
  }
  if (typeof applyTheme === 'function' && typeof getCurrentTheme === 'function') {
    applyTheme(getCurrentTheme());
  }
}

// Exportación global para acceso desde app.js y pruebas en consola
window.I18N = I18N;
window.getCurrentLanguage = getCurrentLanguage;
window.setLanguage = setLanguage;
window.t = t;
window.applyTranslations = applyTranslations;
