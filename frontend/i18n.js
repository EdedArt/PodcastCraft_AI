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
    'transport.volumeTitle': 'Volumen'
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
    'transport.volumeTitle': 'Volume'
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
