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
    'app.title': 'PodcastCraft AI',
    'app.badge.draft': 'Borrador',
    'app.badge.saved': 'Guardado',
    'topbar.ariaLabel': 'Barra superior de herramientas',
    'topbar.untitledProject': 'Proyecto sin título',
    'topbar.duration': 'Duración total',
    'topbar.aiAnalysis': 'Análisis de IA',
    'topbar.aiAnalysisAria': 'Iniciar análisis inteligente con IA',
    'topbar.aiAnalysisTitle': 'Análisis de IA',
    'topbar.aiAnalysisNoClip': 'Selecciona un clip para analizarlo',
    'topbar.newProject': 'Nuevo proyecto',
    'topbar.newProjectAria': 'Crear nuevo proyecto',
    'topbar.newProjectTitle': 'Nuevo proyecto',
    'topbar.newProjectConfirm': 'Se borrará el proyecto actual (carriles y audios importados). Exporta antes si quieres conservarlo.',
    'topbar.newProjectCreated': 'Proyecto nuevo creado',
    'topbar.export': 'Exportar MP3',
    'topbar.exportAria': 'Exportar mezcla a archivo MP3',
    'topbar.exportTitle': 'Exportar MP3',
    'topbar.exporting': 'Exportando…',
    'topbar.exportNoClips': 'Agrega al menos un clip al timeline para exportar',
    'topbar.exportSuccess': 'Mezcla exportada exitosamente: {filename}',
    'topbar.exportSavedAt': 'Guardado en: {path}',
    'topbar.exportShowInFolder': 'Mostrar en carpeta',
    'topbar.exportCanceled': 'Exportación cancelada',
    'topbar.exportError': 'Error al exportar la mezcla',
    'topbar.exportGenericError': 'No se pudo exportar la mezcla. Verifica que los archivos de audio existan.',
    'theme.switchToDark': 'Cambiar a modo oscuro',
    'theme.switchToLight': 'Cambiar a modo claro',
    'settings.languageToggleAria': 'Cambiar a inglés',

    // Barra de Transporte y Reproducción (Transport)
    'transport.ariaLabel': 'Controles de transporte y reproducción',
    'transport.noClip': 'Ningún clip en la línea de tiempo',
    'transport.mixOfClips': 'Mezcla de {count} clips',
    'transport.preparingAudio': 'Preparando audio…',
    'transport.audioDecodeError': 'Error al decodificar audio de la biblioteca',
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
    'library.backendUnreachable': 'No se pudo conectar con el servidor local. Verifica que el backend esté corriendo.',
    'library.uploadError': 'Ocurrió un error al procesar el archivo en el servidor local.',

    // Línea de Tiempo (Timeline)
    'timeline.sectionAria': 'Línea de tiempo multipista',
    'timeline.title': 'Línea de tiempo',
    'timeline.addTrackAria': 'Agregar nuevo carril',
    'timeline.addTrackTitle': 'Agregar nuevo carril',
    'timeline.undoAria': 'Deshacer última acción en la línea de tiempo ({shortcut})',
    'timeline.undoTitle': 'Deshacer ({shortcut})',
    'timeline.undoToast': 'Acción deshecha ({shortcut})',
    'timeline.zoomLabel': 'Zoom',
    'timeline.zoomSliderAria': 'Nivel de zoom de la línea de tiempo',
    'timeline.zoomSliderTitle': 'Nivel de zoom',
    'timeline.rulerAria': 'Buscar posición en la línea de tiempo',
    'timeline.emptyTracksTitle': 'Aún no tienes carriles',
    'timeline.emptyTracksDesc': 'Crea un carril para empezar a construir tu episodio y arrastrar archivos de audio.',
    'timeline.createFirstTrackAria': 'Crear primer carril',
    'timeline.deleteTrackAria': 'Eliminar carril',
    'timeline.deleteTrackTitle': 'Eliminar carril',
    'timeline.deleteTrackConfirm': 'Este carril tiene {count} clip(s). ¿Eliminarlo de todas formas?',
    'timeline.trackVolumeAria': 'Volumen del carril {index}',
    'timeline.trackVolumeTitle': 'Volumen del carril {index}',
    'timeline.emptyLane': 'Carril vacío — Arrastra un audio aquí',
    'timeline.clipFrom': 'de',
    'timeline.clipTo': 'a',
    'timeline.dragToTrimStart': 'Arrastra para recortar inicio',
    'timeline.dragToTrimEnd': 'Arrastra para recortar final',

    // Barra contextual de clip (Fase 23 & 24)
    'clipToolbar.toolbarAria': 'Herramientas del clip seleccionado',
    'clipToolbar.noClipSelected': 'Selecciona un clip para ajustar su volumen',
    'clipToolbar.volumeLabel': 'Volumen del clip',
    'clipToolbar.volumeSliderAria': 'Volumen del clip',
    'clipToolbar.volumeSliderTitle': 'Volumen del clip',
    'clipToolbar.splitBtn': 'Dividir',
    'clipToolbar.splitAria': 'Dividir en la línea de tiempo (S)',
    'clipToolbar.splitTitle': 'Dividir en la línea de tiempo (S)',
    'clipToolbar.deleteBtn': 'Eliminar',
    'clipToolbar.deleteAria': 'Eliminar ({shortcut}) — Shift: sin cerrar hueco',
    'clipToolbar.deleteTitle': 'Eliminar ({shortcut}) — Shift: sin cerrar hueco',
    'clipToolbar.splitOutsideNotice': 'Coloca la línea de tiempo dentro del clip',

    // Espacio de Trabajo y Ajustes
    'workspace.ariaLabel': 'Espacio de trabajo del editor',
    'settings.quickGroupAria': 'Ajustes rápidos de interfaz',

    // Panel de Asistente IA (AI Panel)
    'aiPanel.sectionAria': 'Panel de asistente de inteligencia artificial',
    'aiPanel.title': 'Asistente de IA',
    'aiPanel.betaBadge': 'Beta',
    'aiPanel.transcribe': 'Transcribir',
    'aiPanel.retranscribe': 'Volver a transcribir',
    'aiPanel.processing': 'Transcribiendo audio y detectando muletillas...',
    'aiPanel.transcribingReal': 'Transcribiendo con IA (Google Gemini)...',
    'aiPanel.notConfigured': 'La IA no está configurada en este momento. Verifica GEMINI_API_KEY en .env.',
    'aiPanel.networkError': 'Error de conexión al comunicar con el servidor local o la IA.',
    'aiPanel.rateLimited': 'Límite de solicitudes de IA excedido temporalmente. Intenta nuevamente en unos instantes.',
    'aiPanel.confirmCleanup': 'Confirmar borrado',
    'aiPanel.confirmCleanupAria': 'Confirmar borrado de segmentos marcados y cortar audio',
    'aiPanel.confirmCleanupTitle': 'Cortar audio en segmentos marcados',
    'aiPanel.confirmCleanupSegments': 'Cortar audio ({count})',
    'aiPanel.splitSuccess': 'Se dividió el clip en {count} parte(s)',
    'aiPanel.clipDeleted': 'Se eliminó el clip por completo',
    'aiPanel.clipTrimmed': 'Se recortó el clip',
    'aiPanel.wordsRemoved': '{count} segmento(s) eliminado(s)',
    'aiPanel.cleanAllWithCount': 'Limpiar Audio con IA ({count} detectadas)',
    'aiPanel.cleanAllToast': '{count} muletilla(s) eliminada(s) con éxito',
    'aiPanel.emptyStateHint': 'Selecciona un clip en la línea de tiempo para comenzar',
    'aiPanel.selectedClipHint': 'Clip seleccionado. Haz clic en «Transcribir» para comenzar.',
    'aiPanel.fillersCount': '{count} muletillas detectadas',
    'aiPanel.noFillers': 'Sin muletillas detectadas',
    'aiPanel.noWordsDetected': 'Clip vacío o sin palabras detectadas.',
    'aiPanel.transcriptEmptyTitle': 'La transcripción aparecerá aquí',
    'aiPanel.transcriptEmptyDesc': 'El modelo transcribirá tus archivos de audio y resaltará muletillas y silencios automáticamente.',
    'aiPanel.wordAria': 'Segmento: {text}',
    'aiPanel.segmentAria': 'Segmento: {text}',
    'aiPanel.fillerWordAria': 'Segmento de muletilla: {text}',
    'aiPanel.fillerSegmentAria': 'Segmento de muletilla: {text}',
    'aiPanel.markedAria': 'Marcada para eliminar',
    'aiPanel.notMarkedAria': 'No marcada para eliminar',
    'aiPanel.ctaAria': 'Limpiar audio con IA (Se activará tras el análisis)',
    'aiPanel.ctaTitle': 'Limpiar Audio con IA',
    'aiPanel.ctaBtn': 'Limpiar Audio con IA',

    // Guardia de Pantalla (Viewport Warning)
    'viewport.title': 'Resolución no optimizada',
    'viewport.subtitle': 'PodcastCraft AI está optimizado para pantallas de escritorio ≥ 1280px',
    'viewport.description': 'Para utilizar todas las herramientas de la estación de trabajo y la línea de tiempo multipista, amplía la ventana de tu navegador.',

    // Mensajes de Conexión del Backend
    'topbar.feedbackSaveError': 'No se pudo guardar en el servidor local. Verifica que el backend esté corriendo.',
    'topbar.feedbackServerOffline': 'Servidor local no detectado. Los cambios se mantendrán solo durante esta sesión.',

    // Autenticación Local y Pantalla de Bloqueo (Fases 17 & 26)
    'auth.lockScreenTitle': 'PodcastCraft AI',
    'auth.setupTitle': 'Crear Cuenta',
    'auth.setupSubtitle': 'Crea tu usuario y contraseña de acceso local.',
    'auth.loginTitle': 'Pantalla de Bloqueo',
    'auth.loginSubtitle': 'Ingresa tus credenciales para acceder al editor.',
    'auth.recoverTitle': 'Recuperar Contraseña',
    'auth.recoverSubtitle': 'Ingresa tu usuario y tu código de recuperación de 12 caracteres.',
    'auth.createAccount': 'Crear cuenta',
    'auth.login': 'Iniciar sesión',
    'auth.resetPassword': 'Restablecer contraseña',
    'auth.username': 'Usuario',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar contraseña',
    'auth.newPassword': 'Nueva contraseña',
    'auth.recoveryCode': 'Código de recuperación',
    'auth.usernamePlaceholder': 'Ej. podcaster',
    'auth.passwordPlaceholder': 'Mínimo 6 caracteres',
    'auth.confirmPasswordPlaceholder': 'Repite la contraseña',
    'auth.newPasswordPlaceholder': 'Mínimo 6 caracteres',
    'auth.recoveryCodePlaceholder': 'XXXX-XXXX-XXXX',
    'auth.rememberMe': 'Recordarme en este equipo',
    'auth.noAccount': '¿No tienes cuenta? Créala',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.backToLogin': 'Volver al inicio de sesión',
    'auth.modalTitle': 'Tu Código de Recuperación',
    'auth.modalWarning': 'Guárdalo en un lugar seguro. No se volverá a mostrar y lo necesitarás si olvidas tu contraseña.',
    'auth.copyCode': 'Copiar',
    'auth.copied': '¡Copiado!',
    'auth.recoverySavedConfirm': 'Ya guardé mi código en un lugar seguro',
    'auth.continue': 'Continuar',
    'auth.invalidCredentials': 'Usuario o contraseña incorrectos.',
    'auth.passwordTooShort': 'La contraseña debe tener al menos 6 caracteres.',
    'auth.passwordsDoNotMatch': 'Las contraseñas no coinciden.',
    'auth.usernameRequired': 'Debes ingresar un nombre de usuario.',
    'auth.recoveryCodeRequired': 'Debes ingresar el código de recuperación.',
    'auth.recoverySuccessMsg': 'Contraseña restablecida con éxito. Inicia sesión con tus nuevas credenciales.',
    'auth.accountCreatedSuccess': 'Cuenta creada exitosamente.',
    'auth.connectingError': 'No se pudo conectar con el servidor local para iniciar sesión.',
    'auth.connecting': 'Conectando con el servidor local...',
    'auth.loadingSession': 'Verificando sesión guardada...',
    'auth.showPassword': 'Mostrar contraseña',
    'auth.hidePassword': 'Ocultar contraseña',
    'auth.retry': 'Reintentar',
    'auth.logout': 'Cerrar sesión',
    'auth.logoutAria': 'Cerrar sesión y bloquear pantalla',
    'auth.serverBusy': 'Servidor ocupado, intenta de nuevo.',
    'auth.payloadTooLarge': 'El tamaño de la petición excede el límite permitido (2 KB).',
    'auth.maxAccountsReached': 'Se ha alcanzado el límite máximo de 10 cuentas.',
    'auth.rateLimitBlocked': 'Demasiados intentos fallidos. Intenta de nuevo en {s}s.'
  },
  en: {
    // Aplicación y Barra Superior (Topbar)
    'app.title': 'PodcastCraft AI',
    'app.badge.draft': 'Draft',
    'app.badge.saved': 'Saved',
    'topbar.ariaLabel': 'Top toolbar',
    'topbar.untitledProject': 'Untitled Project',
    'topbar.duration': 'Total duration',
    'topbar.aiAnalysis': 'AI Analysis',
    'topbar.aiAnalysisAria': 'Start smart AI analysis',
    'topbar.aiAnalysisTitle': 'AI Analysis',
    'topbar.aiAnalysisNoClip': 'Select a clip to analyze',
    'topbar.newProject': 'New project',
    'topbar.newProjectAria': 'Create new project',
    'topbar.newProjectTitle': 'New project',
    'topbar.newProjectConfirm': 'The current project will be cleared (tracks and imported audios). Export beforehand if you want to keep it.',
    'topbar.newProjectCreated': 'New project created',
    'topbar.export': 'Export MP3',
    'topbar.exportAria': 'Export mix to MP3 file',
    'topbar.exportTitle': 'Export MP3',
    'topbar.exporting': 'Exporting…',
    'topbar.exportNoClips': 'Add at least one clip to the timeline to export',
    'topbar.exportSuccess': 'Mix exported successfully: {filename}',
    'topbar.exportSavedAt': 'Saved to: {path}',
    'topbar.exportShowInFolder': 'Show in folder',
    'topbar.exportCanceled': 'Export canceled',
    'topbar.exportError': 'Error exporting mix',
    'topbar.exportGenericError': 'Could not export the mix. Please verify audio files exist.',
    'theme.switchToDark': 'Switch to dark mode',
    'theme.switchToLight': 'Switch to light mode',
    'settings.languageToggleAria': 'Switch to Spanish',

    // Barra de Transporte y Reproducción (Transport)
    'transport.ariaLabel': 'Transport and playback controls',
    'transport.noClip': 'No clip on timeline',
    'transport.mixOfClips': 'Mix of {count} clips',
    'transport.preparingAudio': 'Preparing audio…',
    'transport.audioDecodeError': 'Error decoding library audio',
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
    'library.backendUnreachable': 'Could not connect to local server. Make sure the backend is running.',
    'library.uploadError': 'An error occurred while processing the file on the local server.',

    // Línea de Tiempo (Timeline)
    'timeline.sectionAria': 'Multitrack timeline',
    'timeline.title': 'Timeline',
    'timeline.addTrackAria': 'Add new track',
    'timeline.addTrackTitle': 'Add new track',
    'timeline.undoAria': 'Undo last action on timeline ({shortcut})',
    'timeline.undoTitle': 'Undo ({shortcut})',
    'timeline.undoToast': 'Action undone ({shortcut})',
    'timeline.zoomLabel': 'Zoom',
    'timeline.zoomSliderAria': 'Timeline zoom level',
    'timeline.zoomSliderTitle': 'Zoom level',
    'timeline.rulerAria': 'Seek position in timeline',
    'timeline.emptyTracksTitle': "You don't have tracks yet",
    'timeline.emptyTracksDesc': 'Create a track to start building your episode and drag audio files.',
    'timeline.createFirstTrackAria': 'Create first track',
    'timeline.deleteTrackAria': 'Delete track',
    'timeline.deleteTrackTitle': 'Delete track',
    'timeline.deleteTrackConfirm': 'This track contains {count} clip(s). Delete it anyway?',
    'timeline.trackVolumeAria': 'Track {index} volume',
    'timeline.trackVolumeTitle': 'Track {index} volume',
    'timeline.emptyLane': 'Empty track — Drag audio here',
    'timeline.clipFrom': 'from',
    'timeline.clipTo': 'to',
    'timeline.dragToTrimStart': 'Drag to trim start',
    'timeline.dragToTrimEnd': 'Drag to trim end',

    // Contextual clip toolbar (Phase 23 & 24)
    'clipToolbar.toolbarAria': 'Selected clip tools',
    'clipToolbar.noClipSelected': 'Select a clip to adjust its volume',
    'clipToolbar.volumeLabel': 'Clip volume',
    'clipToolbar.volumeSliderAria': 'Clip volume',
    'clipToolbar.volumeSliderTitle': 'Clip volume',
    'clipToolbar.splitBtn': 'Split',
    'clipToolbar.splitAria': 'Split at playhead (S)',
    'clipToolbar.splitTitle': 'Split at playhead (S)',
    'clipToolbar.deleteBtn': 'Delete',
    'clipToolbar.deleteAria': 'Delete ({shortcut}) — Shift: keep gap',
    'clipToolbar.deleteTitle': 'Delete ({shortcut}) — Shift: keep gap',
    'clipToolbar.splitOutsideNotice': 'Place the playhead inside the clip',

    // Espacio de Trabajo y Ajustes
    'workspace.ariaLabel': 'Editor workspace',
    'settings.quickGroupAria': 'Quick interface settings',

    // Panel de Asistente IA (AI Panel)
    'aiPanel.sectionAria': 'Artificial intelligence assistant panel',
    'aiPanel.title': 'AI Assistant',
    'aiPanel.betaBadge': 'Beta',
    'aiPanel.transcribe': 'Transcribe',
    'aiPanel.retranscribe': 'Re-transcribe',
    'aiPanel.processing': 'Transcribing audio and detecting filler words...',
    'aiPanel.transcribingReal': 'Transcribing with AI (Google Gemini)...',
    'aiPanel.notConfigured': 'AI is not configured at this moment. Check GEMINI_API_KEY in .env.',
    'aiPanel.networkError': 'Connection error while communicating with local server or AI.',
    'aiPanel.rateLimited': 'AI request rate limit reached. Please try again in a few moments.',
    'aiPanel.confirmCleanup': 'Confirm deletion',
    'aiPanel.confirmCleanupAria': 'Confirm deletion of marked segments and cut audio',
    'aiPanel.confirmCleanupTitle': 'Cut audio at marked segments',
    'aiPanel.confirmCleanupSegments': 'Cut audio ({count})',
    'aiPanel.splitSuccess': 'Clip split into {count} piece(s)',
    'aiPanel.clipDeleted': 'Clip removed completely',
    'aiPanel.clipTrimmed': 'Clip trimmed',
    'aiPanel.wordsRemoved': '{count} segment(s) removed',
    'aiPanel.cleanAllWithCount': 'Clean Audio with AI ({count} detected)',
    'aiPanel.cleanAllToast': '{count} filler word(s) removed successfully',
    'aiPanel.emptyStateHint': 'Select a clip on the timeline to begin',
    'aiPanel.selectedClipHint': 'Clip selected. Click «Transcribe» to begin.',
    'aiPanel.fillersCount': '{count} filler words detected',
    'aiPanel.noFillers': 'No filler words detected',
    'aiPanel.noWordsDetected': 'Empty clip or no words detected.',
    'aiPanel.transcriptEmptyTitle': 'Transcript will appear here',
    'aiPanel.transcriptEmptyDesc': 'The model will transcribe your audio files and automatically highlight filler words and silences.',
    'aiPanel.wordAria': 'Segment: {text}',
    'aiPanel.segmentAria': 'Segment: {text}',
    'aiPanel.fillerWordAria': 'Filler segment: {text}',
    'aiPanel.fillerSegmentAria': 'Filler segment: {text}',
    'aiPanel.markedAria': 'Marked for deletion',
    'aiPanel.notMarkedAria': 'Not marked for deletion',
    'aiPanel.ctaAria': 'Clean audio with AI (Enabled after analysis)',
    'aiPanel.ctaTitle': 'Clean Audio with AI',
    'aiPanel.ctaBtn': 'Clean Audio with AI',

    // Guardia de Pantalla (Viewport Warning)
    'viewport.title': 'Unoptimized Resolution',
    'viewport.subtitle': 'PodcastCraft AI is optimized for desktop displays ≥ 1280px',
    'viewport.description': 'To use all digital audio workstation tools and multitrack timeline, expand your browser window.',

    // Mensajes de Conexión del Backend
    'topbar.feedbackSaveError': 'Could not save to local server. Make sure the backend is running.',
    'topbar.feedbackServerOffline': 'Local server not detected. Changes will only persist during this session.',

    // Autenticación Local y Pantalla de Bloqueo (Fases 17 & 26)
    'auth.lockScreenTitle': 'PodcastCraft AI',
    'auth.setupTitle': 'Create Account',
    'auth.setupSubtitle': 'Create your local username and password.',
    'auth.loginTitle': 'Lock Screen',
    'auth.loginSubtitle': 'Enter your credentials to access the editor.',
    'auth.recoverTitle': 'Recover Password',
    'auth.recoverSubtitle': 'Enter your username and your 12-character recovery code.',
    'auth.createAccount': 'Create account',
    'auth.login': 'Log in',
    'auth.resetPassword': 'Reset password',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm password',
    'auth.newPassword': 'New password',
    'auth.recoveryCode': 'Recovery code',
    'auth.usernamePlaceholder': 'e.g. podcaster',
    'auth.passwordPlaceholder': 'At least 6 characters',
    'auth.confirmPasswordPlaceholder': 'Repeat password',
    'auth.newPasswordPlaceholder': 'At least 6 characters',
    'auth.recoveryCodePlaceholder': 'XXXX-XXXX-XXXX',
    'auth.rememberMe': 'Remember me on this device',
    'auth.noAccount': 'Don\'t have an account? Create one',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.backToLogin': 'Back to log in',
    'auth.modalTitle': 'Your Recovery Code',
    'auth.modalWarning': 'Save it in a safe place. It will not be shown again and you will need it if you forget your password.',
    'auth.copyCode': 'Copy',
    'auth.copied': 'Copied!',
    'auth.recoverySavedConfirm': 'I have saved my code in a safe place',
    'auth.continue': 'Continue',
    'auth.invalidCredentials': 'Incorrect username or password.',
    'auth.passwordTooShort': 'Password must be at least 6 characters long.',
    'auth.passwordsDoNotMatch': 'Passwords do not match.',
    'auth.usernameRequired': 'Username is required.',
    'auth.recoveryCodeRequired': 'Recovery code is required.',
    'auth.recoverySuccessMsg': 'Password reset successfully. Sign in with your new credentials.',
    'auth.accountCreatedSuccess': 'Account created successfully.',
    'auth.connectingError': 'Could not connect to the local server to sign in.',
    'auth.connecting': 'Connecting to local server...',
    'auth.loadingSession': 'Checking saved session...',
    'auth.showPassword': 'Show password',
    'auth.hidePassword': 'Hide password',
    'auth.retry': 'Retry',
    'auth.logout': 'Log out',
    'auth.logoutAria': 'Log out and lock screen',
    'auth.serverBusy': 'Server busy, please try again.',
    'auth.payloadTooLarge': 'Request payload exceeds allowed limit (2 KB).',
    'auth.maxAccountsReached': 'Maximum limit of 10 accounts reached.',
    'auth.rateLimitBlocked': 'Too many failed attempts. Try again in {s}s.'
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

function getIsMacPlatform() {
  const plat = (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.platform) ||
    (typeof navigator !== 'undefined' && ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform)) ||
    '';
  return /mac|darwin/i.test(plat);
}

/**
 * Traduce una clave al idioma activo con doble fallback e interpolación de variables {param}.
 * Resuelve automáticamente atajos de teclado adaptados ({shortcut}) según plataforma (macOS vs Win/Linux).
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 * @returns {string}
 */
function t(key, params) {
  const lang = getCurrentLanguage();
  let str = (I18N[lang] && I18N[lang][key]) || (I18N.es && I18N.es[key]) || key;
  const isMac = getIsMacPlatform();

  if (typeof str === 'string' && str.includes('{shortcut}')) {
    const isUndo = key.startsWith('timeline.undo');
    const defaultShortcut = isUndo
      ? (isMac ? '⌘Z' : 'Ctrl+Z')
      : (isMac ? '⌫' : (lang === 'es' ? 'Supr' : 'Del'));
    str = str.replace(/\{shortcut\}/g, defaultShortcut);
  }

  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return str;
}

/**
 * Aplica todas las traducciones a elementos del DOM marcados con data-i18n,
 * data-i18n-aria-label, data-i18n-title o data-i18n-placeholder, actualiza controles
 * dinámicos y refresca el botón de cambio de idioma.
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

  // 4. Atributos placeholder en campos de entrada
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  // 5. Botones de alternancia de idioma (#btn-language-toggle y #auth-language-toggle)
  ['btn-language-toggle', 'auth-language-toggle'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      const targetLang = lang === 'es' ? 'en' : 'es';
      btn.textContent = targetLang.toUpperCase();
      const label = t('settings.languageToggleAria');
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }
  });

  // 5b. Actualizar botones de mostrar/ocultar contraseña según estado actual
  document.querySelectorAll('.auth-password-toggle').forEach((btn) => {
    const isVisible = btn.getAttribute('aria-pressed') === 'true';
    const key = isVisible ? 'auth.hidePassword' : 'auth.showPassword';
    btn.setAttribute('data-i18n-aria-label', key);
    btn.setAttribute('aria-label', t(key));
    btn.setAttribute('title', t(key));
  });

  // 6. Re-renderizado de componentes con estados dinámicos si las funciones existen
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
  if (typeof renderAiPanel === 'function') {
    renderAiPanel();
  }
  if (typeof renderAuthScreen === 'function') {
    renderAuthScreen();
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
window.getIsMacPlatform = getIsMacPlatform;
window.i18n = {
  t,
  setLanguage,
  getCurrentLanguage,
  applyTranslations,
  getIsMacPlatform
};
