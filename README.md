# PodcastCraft AI — Sprint 5 de 7 (Playhead de Alta Fidelidad + Scrubbing)

Estación de trabajo de audio digital (DAW) y editor de podcasts con asistencia de Inteligencia Artificial (estilo Descript / Adobe Audition), desarrollada como proyecto final para la asignatura **Diseño de Interfaces de Software** en la Universidad Cooperativa de Colombia.

Este repositorio contiene el **Sprint 5 (Playhead de Alta Fidelidad a 60 FPS, Sincronización Continua vía requestAnimationFrame y Scrubbing Interactivo en Regla de Tiempo)**, conservando el 100% de la funcionalidad de carriles dinámicos, importación de MP3 reales y edición no destructiva construida en el Sprint 4.

---

## 🖥️ Backend (Fases 1 a 7 completadas)
El backend vive en `/backend`, ver [`backend/README.md`](backend/README.md) para instrucciones completas, arquitectura y guía de pruebas. Actualmente desarrollado y verificado de forma aislada; la conexión con el frontend está pendiente de aprobación del usuario.

---

## 🎨 Frontend — Fase A: Sistema de Tema Dual (Claro por Defecto y Oscuro)

Exigencia explícita de diseño (Profesor Jhonatan Mideros): **la aplicación debe iniciar en Modo Claro por defecto**, ofreciendo un conmutador visible para alternar a Modo Oscuro de manera inmediata y sin recargas.

### 1. Arquitectura de Tokens Multi-Nivel y Anti-Flash Síncrono
1. **Tokens de 3 niveles:**
   - **Nivel 1 (Primitivos):** Paletas HSL/HEX neutras (`slate-50` a `slate-950`) y de acento (`violet-600/500`, `fuchsia-600/500`, `sky`, `amber`, `emerald`, `rose`, `cyan`).
   - **Nivel 2 (Semánticos duales):** Declarados bajo `:root, [data-theme="light"]` y sobreescritos bajo `[data-theme="dark"]` (`--bg-primary`, `--bg-panel`, `--border-default`, `--text-primary`, `--text-secondary`, `--ai-accent`, `--playhead-color`, `--scrollbar-track`, etc.).
   - **Nivel 3 (Componentes):** Clases utilitarias desacopladas (`.theme-panel`, `.theme-bg-app`, `.theme-btn-export`, `.theme-btn-secondary`, `.theme-pill`, `.track-lane-*`, `.track-clip-*`).
2. **Prevención de Flash (FOUC):**
   - Un script inline síncrono al inicio del `<head>` en `index.html` inspecciona `localStorage.getItem('podcastcraft-theme')` antes de la carga de hojas de estilo o scripts externos.
   - Si no existe valor previo, asigna contractualmente `data-theme="light"`.
   - Si el usuario guardó previamente `'dark'`, asigna `data-theme="dark"` sincrónicamente antes del primer repintado del DOM.
3. **Control en Topbar (`#btn-theme-toggle`):**
   - Ubicado en la barra superior junto al botón de Exportar.
   - Icono contextual: muestra `moon` cuando el tema activo es claro (indicando "cambiar a oscuro") y `sun` cuando es oscuro.
   - Accesibilidad: `aria-pressed` ("true" en oscuro, "false" en claro) y `aria-label`/`title` dinámicos.
   - Persistencia: guarda el estado en `localStorage` bajo la clave `'podcastcraft-theme'`.

### 2. Componentes Migrados de Tailwind Estático a Tokens CSS
Para permitir que la interfaz responda fluidamente al cambio de tema sin romper el diseño responsive ni el espaciado de Tailwind:
- **`body`:** Reemplazado `bg-slate-950 text-slate-100` por clases dinámicas `.theme-bg-app` y `.theme-text-app`.
- **Topbar (`#topbar`):** Migrado a `.theme-panel` y `.theme-text-primary` / `.theme-text-secondary`.
- **Columna Biblioteca (`#col-library`):** Migrado a `.theme-panel`, encabezado con `.theme-panel-header`.
- **Tarjetas de Biblioteca (`lib-card`):** Migradas de fondos slate fijos a `.lib-card-default` y `.lib-card-selected` basadas en `--card-bg`, `--card-hover-bg` y `--card-selected-bg`.
- **Columna Timeline (`#col-timeline`):** Migrado a `.theme-timeline-bg`, cabeceras de carril con `.theme-panel`.
- **Carriles del Timeline:** Migrados de fondos oscuros fijos (`bg-sky-900/40`, etc.) a clases reactivas de paleta rotativa (`.track-lane-sky`, `.track-lane-amber`, etc.).
- **Clips del Timeline:** Migrados a clases contextuales (`.track-clip-sky`, `.track-clip-amber`, etc.) con alto contraste y bordes definidos.
- **Columna Asistente IA (`#col-ai-panel`):** Migrado a `.theme-panel`, con contenedor vacío usando `.theme-empty-box`.
- **Footer de Transporte (`#transport`):** Migrado a `.theme-panel` con botones usando clases de hover adaptables.
- **Controles deslizantes y scrollbars:** `input[type="range"]` y `::-webkit-scrollbar` consumen variables de tema (`--slider-filled`, `--slider-empty`, `--scrollbar-track`, `--scrollbar-thumb`).

### 3. Valores de Contraste y Cumplimiento WCAG AA / AAA
La **Regla de Oro Cromática** se respeta rigurosamente en ambos temas (el violeta/fucsia es exclusivo de IA, botón Play y foco activo).

| Token / Elemento | Modo Claro (Default) | Modo Oscuro | Contraste / Justificación de Diseño |
|---|---|---|---|
| **Fondo Principal** | `#f8fafc` (slate-50) | `#020617` (slate-950) | Base limpia y descanso visual. |
| **Fondo Paneles** | `#ffffff` (blanco puro) | `#0f172a` (slate-900) | Superficie de trabajo elevada. |
| **Texto Primario** | `#0f172a` (slate-900) | `#f1f5f9` (slate-100) | **16.5:1** sobre blanco (Cumple **WCAG AAA**). |
| **Texto Secundario** | `#475569` (slate-600) | `#94a3b8` (slate-400) | **5.7:1** sobre blanco (Cumple **WCAG AA**). |
| **Texto Atenuado** | `#64748b` (slate-500) | `#64748b` (slate-500) | **4.6:1** sobre blanco (Cumple **WCAG AA** para texto normal). |
| **Acento IA (`--ai-accent`)** | `#9333ea` (violet-600) | `#a855f7` (violet-500) | **5.5:1** en claro (WCAG AA). Se ajustó a violet-600 porque el violet-500 original ofrecía solo 3.3:1 sobre blanco. |
| **Playhead (`#timeline-playhead`)** | `#dc2626` (red-600) | `#ffffff` (blanco puro) | En claro, un playhead blanco sería invisible; red-600 garantiza contraste superior a **6.1:1** en la regla y carriles. |
| **Bordes Estructurales** | `#e2e8f0` (slate-200) | `#1e293b` (slate-800) | Separación nítida de paneles sin saturación visual. |

---

## ⏱️ Fase 9: Snap de Clips a 00:00 en Carriles Vacíos + Playhead Alineado con Inicio Real del Clip

Esta fase corrige dos discrepancias críticas del timeline para alinear el comportamiento con el estándar de una estación de trabajo de audio digital (DAW) profesional:

### 1. Snap a Inicio en Carriles Vacíos (`calculateDropStart`)
- **Problema previo:** Al soltar un clip desde la biblioteca sobre un carril vacío, la posición de inicio `start` dependía de las coordenadas del puntero (`dropX / pixelsPerSecond`). Esto obligaba al usuario a tener precisión milimétrica sobre el borde izquierdo para que el clip iniciara en `00:00`.
- **Corrección:** Se implementó `calculateDropStart(track, dropX, pixelsPerSecond, clipDuration)` como único punto de cálculo de posición al soltar:
  - **Carril vacío (`track.clips.length === 0`):** Retorna contractualmente `0` (anclaje automático a `00:00`), permitiendo soltar el clip en cualquier punto del carril.
  - **Carril con clips existentes:** Conserva el posicionamiento libre según `dropX` y aplica el algoritmo de detección de colisiones para desplazar el clip adyacentemente sin pisar otros clips.

### 2. Playhead Alineado con el Inicio Real del Clip Activo (`activePlayingClipStart`)
- **Problema previo:** En el loop de sincronización a 60 FPS (`requestAnimationFrame`), la traslación del playhead se calculaba como `globalAudio.currentTime * getPixelsPerSecond()`. Si el clip reproducido tenía un desplazamiento en el timeline (por ejemplo `start = 15s`), el playhead se dibujaba desfasado desde `00:00` en lugar de alinearse con el borde del clip sonando.
- **Corrección:**
  - Se rastrea activamente `activePlayingClipStart` y `activePlayingClipDuration` en el motor de audio.
  - El bucle `tick()` calcula el tiempo absoluto como `absoluteSeconds = activePlayingClipStart + (globalAudio.currentTime || 0)`.
  - La posición física en píxeles del playhead es `absoluteSeconds * getPixelsPerSecond()`, garantizando alineación visual exacta con el clip en reproducción tanto al inicio (`audioElapsed = 0`) como a lo largo de su reproducción continua.
  - Si un clip posee una duración recortada (`activePlayingClipDuration`), la reproducción se detiene automáticamente al alcanzar el final del clip y el playhead retorna a su inicio.

### 3. Scrubbing Inteligente y Decisión Contractual en Zonas Vacías (`seekTo`)
- Al interactuar con la regla `#timeline-ruler` o hacer clic sobre cualquier clip en el timeline, `seekTo(targetSeconds)` evalúa si la marca temporal se encuentra dentro de los límites de algún clip existente (`clip.start <= seconds < clip.start + clip.duration`):
  - **Si cae sobre un clip:** Sincroniza `globalAudio.src` con el archivo del clip, actualiza `activePlayingClipStart = clip.start`, ajusta `globalAudio.currentTime = seconds - clip.start`, selecciona el clip y reanuda la reproducción si el transporte estaba activo.
  - **Decisión en Zonas Vacías:** Si el punto de búsqueda cae sobre un espacio vacío (huecos entre clips o áreas sin audio), el reproductor **detiene/pausa `globalAudio` de inmediato** para evitar reproducir audio fuera de contexto, pero **desplaza el playhead y el contador `#current-time` visualmente** a esa coordenada absoluta. Esto permite posicionar el cursor de edición libremente en el timeline sin generar errores en el motor de audio.

---

## 🔍 Fase 9.5: Fix de Contraste y Legibilidad en Panel de IA (Modo Claro)

Esta fase corrige la degradación de contraste y legibilidad en el Panel de Asistente IA (`#col-ai-panel`) cuando la aplicación opera en **Modo Claro** (`data-theme="light"`):

### 1. Diagnóstico de Causa Raíz
- **Fuga de Selector de Modo Oscuro en Tailwind:** `tailwind.config` carecía de `darkMode: ['selector', '[data-theme="dark"]']`. Al evaluar por defecto `@media (prefers-color-scheme: dark)`, los navegadores con tema de sistema operativo oscuro activaban las variantes `dark:` de Tailwind (`dark:text-violet-200`, `dark:bg-violet-950/20`, `dark:text-violet-300/60`), generando texto lavanda claro (`#ddd6fe`) sobre fondos blancos con un contraste deficiente de **1.25:1** (fallo de accesibilidad).
- **Opacidades Acumuladas en Botón CTA:** El botón `#ai-cta` combinaba `opacity-50` estructural con texto `text-violet-700/60` (opacidad efectiva 30%), reduciendo el contraste a **1.8:1** y luciendo como una mancha grisácea ilegible sobre blanco.
- **Sombreado Sucio:** El contenedor del ícono en `#ai-transcript` poseía `shadow-inner`, produciendo un sombreado interior oscuro que ensuciaba la estética en modo claro.

### 2. Solución Implementada
- **Configuración de Selector en Tailwind:** Se configuró explícitamente `darkMode: ['selector', '[data-theme="dark"]']` en `frontend/tailwind-config.js` para asegurar que las clases de modo oscuro respondan única y exclusivamente al atributo `[data-theme="dark"]` del DOM y no al sistema operativo.
- **Tokens Semánticos de Panel IA (`styles.css`):**
  - **Cabecera:** `--ai-header-bg: #faf5ff`, `--ai-header-text: #6b21a8` (**8.2:1 — WCAG AAA**).
  - **Badge Beta:** `--ai-badge-bg: #ede9fe`, `--ai-badge-text: #6b21a8` (**8.2:1 — WCAG AAA**).
  - **Ícono de estado vacío:** `--ai-icon-bg: #f3e8ff`, `--ai-icon-color: #7e22ce` (**7.2:1 — WCAG AAA**), reemplazando `shadow-inner` por `shadow-sm`.
  - **Descripción:** uso de `theme-text-secondary` (`#475569`, **4.6:1 — WCAG AA**).
  - **Botón CTA:** clase `.theme-btn-ai-cta` con `--ai-cta-bg: #f5f3ff`, `--ai-cta-text: #6b21a8` (**7.6:1 — WCAG AAA**), eliminando la multiplicación de opacidades.
- **Modo Oscuro Intacto:** Todos los valores de modo oscuro se preservaron en sus tokens semánticos correspondientes, verificando contrastes superiores a **10:1** (AAA) sin ninguna regresión visual.

---

## 🌐 Fase 10: Infraestructura de Internacionalización (i18n) + Topbar y Transporte Traducidos (ES/EN)

Esta fase implementa la infraestructura base de internacionalización (i18n) para soportar **Español (ES)** e **Inglés (EN)** de forma nativa, traduciendo de extremo a extremo el chrome estructural visible (Barra Superior y Barra de Transporte):

### 1. Arquitectura de Traducción y Diccionarios (`frontend/i18n.js`)
- **Diccionarios centralizados:** Objeto `I18N` con diccionarios completos en español (`es`) e inglés (`en`).
- **Función `t(key)`:** Resuelve claves con doble sistema de fallback: si la clave no existe en el idioma activo, intenta en español, y si no existe, devuelve la clave misma para evitar pantallas en blanco o errores no capturados.
- **Persistencia en `localStorage`:** Clave `'podcastcraft-language'`, con **español (`es`) como valor por defecto**.
- **Atributo `lang` en `<html>`:** Se actualiza sincrónicamente a `lang="es"` o `lang="en"`.
- **Motor `applyTranslations()`:** Escanea y actualiza declarativamente el DOM:
  - `data-i18n="clave"`: Traduce el contenido textual interno.
  - `data-i18n-aria-label="clave"`: Traduce la descripción accesible para lectores de pantalla.
  - `data-i18n-title="clave"`: Traduce el tooltip emergente del navegador.

### 2. Control de Alternancia de Idioma (`#btn-language-toggle`)
- Ubicado en el header junto al botón de tema (`#btn-theme-toggle`), agrupados en un contenedor visual de "Ajustes rápidos".
- Muestra el idioma objetivo al que se cambiará: muestra **"EN"** cuando el idioma activo es español, y **"ES"** cuando el idioma activo es inglés (siguiendo las directrices de diseño sin banderas que dependan de renderizado de fuentes del SO).
- Al hacer clic, conmuta el idioma en `localStorage`, actualiza el DOM inmediatamente con `applyTranslations()` y re-renderiza componentes dinámicos sin requerir recargar la página.

### 3. Componentes Traducidos en Fase 10
- **Topbar:**
  - Título placeholder del proyecto (`Proyecto sin título` / `Untitled Project`).
  - Badge de estado dinámico (`Borrador` / `Draft` y `Guardado` / `Saved`).
  - Etiqueta de duración (`Duración total` / `Total duration`).
  - Botón de análisis con IA (`Análisis de IA` / `AI Analysis`, aria-label y tooltip).
  - Botón de exportación (`Exportar Podcast` / `Export Podcast`, aria-label y tooltip).
  - Tooltip dinámico del toggle de tema (`Cambiar a modo oscuro|claro` / `Switch to dark|light mode`).
- **Transporte:**
  - Indicador de clip en reproducción (`Ningún clip en la línea de tiempo` / `No clip on timeline`).
  - Botón Retroceder 5s (aria-label y tooltip `Retroceder 5s (J)` / `Rewind 5s (J)`).
  - Botón Play / Pausa (estados contextuales sin audio, reproduciendo y pausado con tooltips `(Espacio)` / `(Space)`).
  - Botón Avanzar 5s (aria-label y tooltip `Avanzar 5s (L)` / `Forward 5s (L)`).
  - Botón Silenciar / Activar sonido (tooltips `(M)`).
  - Slider de volumen (aria-label y tooltip).

### 4. Alcance Cubierto en Fase 11
La Fase 11 completó la extensión del motor de internacionalización al 100% de la aplicación, abarcando la Biblioteca, Timeline, Panel de IA, Viewport Warning y mensajes del sistema.

---

## 🌐 Fase 11: Cobertura Completa de i18n — Biblioteca, Timeline, Panel de IA y Mensajes del Sistema (ES/EN)

Esta fase completa la internacionalización integral de la aplicación, eliminando todo string en español hardcodeado y asegurando que la totalidad de la experiencia sea bilingüe nativa (Español e Inglés):

### 1. Columna de Biblioteca (`#col-library`)
- **Cabecera y Contador:** Traducido el título "Biblioteca" / "Library" y el contador pluralizado reactivo (`1 audio` / `1 audio`, `{count} audios` / `{count} audio files`).
- **Importación de Audio:** Botón "Importar MP3", `aria-label` y tooltips contextuales.
- **Feedback Accesible (`#import-feedback`):** Notificaciones dinámicas traducidas para rechazo de archivos no-MP3 ("Solo se permiten archivos MP3" / "Only MP3 files are allowed", conteo de archivos ignorados) y advertencia de caída de conexión con el backend local.
- **Estado Vacío y Tarjetas:** Título y descripción explicativa del estado vacío, y atributos de accesibilidad (`aria-label`, `title`) en cada tarjeta de clip importado ("Arrastra a un carril" / "Drag to a track").

### 2. Columna de Línea de Tiempo (`#col-timeline`)
- **Cabecera y Controles:** Título "Línea de tiempo" / "Timeline", botón "Nuevo Carril" / "New Track", etiqueta y slider accesible de Zoom.
- **Regla de Tiempo (`#timeline-ruler`):** Atributo accesible `aria-label` ("Buscar posición en la línea de tiempo" / "Seek position in timeline").
- **Estado Vacío General:** Título ("Aún no tienes carriles" / "You don't have tracks yet"), descripción y botón primario ("Crear Primer Carril" / "Create First Track").
- **Carriles y Clips Dinámicos:**
  - **Nombres por defecto de carriles:** Generados dinámicamente según el idioma activo en el momento de creación (`Carril {N}` en español, `Track {N}` en inglés).
  - **Preservación de personalización:** Si el usuario renombra manualmente un carril, su nombre personalizado se respeta intacto y nunca es sobreescrito por el motor de i18n.
  - **Edición in situ:** Input flotante al hacer doble clic con `aria-label` y `placeholder` traducidos.
  - **Diálogo de confirmación:** El diálogo nativo `window.confirm` para eliminar carriles con clips interpola la cantidad en el idioma activo ("Este carril tiene {count} clip(s). ¿Eliminarlo de todas formas?" / "This track contains {count} clip(s). Delete it anyway?").
  - **Asas y división de clips:** Tooltips de asas de recorte ("Arrastra para recortar inicio|final" / "Drag to trim start|end"), tooltip de doble clic para dividir y etiqueta accesible con rango temporal ("de X a Y" / "from X to Y").
  - **Zona vacía:** Indicador "Carril vacío — Arrastra un audio aquí" / "Empty track — Drag audio here".

### 3. Columna de Asistente IA (`#col-ai-panel`)
- **Cabecera:** Título "Asistente de IA" / "AI Assistant" y badge "Beta".
- **Estado Vacío de Transcripción:** Mensaje informativo sobre la detección automática de silencios y muletillas en el idioma seleccionado.
- **Botón de Acción (CTA):** Botón "Limpiar Audio con IA" / "Clean Audio with AI" con `aria-label` y `title` explicativos.

### 4. Guardia de Pantalla y Navegación
- **Overlay de Resolución (`#viewport-warning`):** Título ("Resolución no optimizada" / "Unoptimized Resolution"), subtítulo de 1280px y recomendación de ampliación de ventana.
- **Título de la Pestaña:** `document.title` sincronizado en caliente al alternar idioma (`PodcastCraft AI — Editor Profesional de Podcasts con IA` ↔ `PodcastCraft AI — Professional AI Podcast Editor`).
- **Conmutación Reactiva sin Recarga:** `applyTranslations()` ejecuta el re-escaneo del DOM declarativo (`data-i18n*`) y refresca inmediatamente los renders de la cabecera, transporte, biblioteca y carriles del timeline sin perder el estado activo ni recargar la página.

---

## 🔌 Fase 12: Reconexión Real — Importación de Audio al Backend Express (`POST /api/audio`)

Esta fase establece la primera conexión real entre el frontend y el backend Express local (desarrollado y probado en las Fases 1 a 7), reemplazando el uso de `URL.createObjectURL()` en la importación de audio por una subida HTTP real mediante `fetch`:

### 1. Configuración de API (`frontend/app.js`)
- **Constante central:** `API_BASE_URL = 'http://localhost:3001'`.
- **CORS Habilitado:** Comunicación fluida entre el frontend (servido en su propio puerto local) y el backend Express en el puerto `3001`.

### 2. Flujo de Subida de Audio
- **Validación previa en frontend:** Se verifica la extensión `.mp3` y el tipo MIME `audio/mpeg` como primera barrera de experiencia de usuario.
- **Transmisión multipart:** Construcción de `FormData` con el archivo binario en el campo `file` y envío asíncrono a `POST /api/audio`.
- **Respuesta 201 Created:** El backend asigna un UUID único, almacena físicamente el archivo en `backend/storage/audio-files/` y retorna `{ id: "lib-import-<uuid>", name, url: "/audio-files/<uuid>.mp3", sizeBytes }`.
- **Cálculo de duración en frontend:** Conforme a la arquitectura definida en la Fase 7 del backend (el servidor no parsea metadatos pesados de audio), el frontend instancia un elemento temporal `new Audio("${API_BASE_URL}${url}")` para resolver la duración real vía el evento `loadedmetadata` (con fallback de 4s a `0` segundos ante streams no deterministas).
- **Asignación a la biblioteca:** El ítem se agrega a `state.library` utilizando `${API_BASE_URL}${url}` como URL reproducible (`objectUrl`), permitiendo su reproducción en `globalAudio` y su inserción como clip en cualquier carril del timeline.
- **Eliminación de dependencias locales:** Se eliminó cualquier llamada a `URL.createObjectURL()` para nuevos archivos importados.

### 3. Resiliencia y Manejo de Errores Bilingüe (i18n)
- **Mecanismo no bloqueante (`#import-feedback`):** Reutiliza la zona accesible de notificaciones dinámicas ubicada bajo el botón de importación, con contraste adaptativo tanto en tema claro (`text-amber-700`) como en tema oscuro (`text-amber-300`).
- **Servidor desconectado / Offline:** Si `fetch` falla por red o porque el backend no está corriendo, muestra el mensaje traducido dinámicamente según el idioma activo:
  - **ES:** `"No se pudo conectar con el servidor local. Verifica que el backend esté corriendo."` (`library.backendUnreachable`)
  - **EN:** `"Could not connect to local server. Make sure the backend is running."` (`library.backendUnreachable`)
- **Errores de servidor:** Si el servidor responde con un código distinto a 201, se informa adecuadamente (`library.uploadError`).
- **Desvanecimiento automático:** El mensaje permanece visible durante 4 segundos y se oculta de forma limpia sin congelar la interfaz ni afectar clips o carriles existentes.

---

## 💾 Fase 13: Persistencia Real del Proyecto (Guardado y Carga Automáticos con Debounce)

Esta fase cierra integralmente el ciclo de la estación de trabajo digital: el proyecto completo (título, estado, carriles multipista, clips recortados y biblioteca de audios importados) sobrevive a recargas de página (`F5`), guardándose y cargándose automáticamente contra los endpoints `GET /api/project` y `PUT /api/project` del backend Express local.

### 1. Forma Contractual del Payload Persistido (`PUT /api/project`)

El payload serializado en el cuerpo de la petición cumple con la validación estructural requerida por el backend:

```json
{
  "project": {
    "title": "Untitled Project",
    "status": "saved"
  },
  "library": [
    {
      "id": "lib-import-30e2b372-ce30-4d62-aaa0-f0fba1212e68",
      "name": "sample_podcast",
      "duration": 5,
      "url": "/audio-files/30e2b372-ce30-4d62-aaa0-f0fba1212e68.mp3"
    }
  ],
  "tracks": [
    {
      "id": "track-4c70ba69-36de-40e1-9e89-1f7ec9146ae6",
      "name": "Voz Principal",
      "colorIndex": 0,
      "clips": [
        {
          "id": "clip-1234",
          "libraryId": "lib-import-30e2b372-ce30-4d62-aaa0-f0fba1212e68",
          "name": "sample_podcast",
          "start": 0,
          "duration": 4
        }
      ]
    },
    {
      "id": "track-b5aee147-a1e6-45c5-8206-68a961dd7bbc",
      "name": "Carril 2",
      "colorIndex": 1,
      "clips": []
    }
  ]
}
```

### 2. Decisiones Clave de Arquitectura

#### 2.1 ¿Por qué NO se duplica la URL del audio dentro de cada clip?
- **Decisión:** Los clips almacenan únicamente `{ id, libraryId, name, start, duration }`. En el JSON persistido **no se almacena ninguna URL de audio en los clips**.
- **Mecanismo de resolución:** Durante la fase de hidratación en `loadProjectFromBackend()`, cada clip busca su `libraryId` en la colección `state.library` ya reconstruida y resuelve dinámicamente `objectUrl = libItem ? libItem.objectUrl : null`.
- **Justificación técnica:**
  1. **Normalización relacional:** Elimina la redundancia de datos (un audio de la biblioteca arrastrado a múltiples carriles compartiría URLs duplicadas innecesariamente).
  2. **Independencia de host/puerto:** La biblioteca almacena la ruta relativa (`/audio-files/<uuid>.mp3`) y la hidrata dinámicamente con `${API_BASE_URL}`, evitando atar los archivos o clips a un puerto o dominio estático.
  3. **Consistencia de origen:** Si un archivo de audio es actualizado o reemplazado en la biblioteca, todos los clips referenciados se sincronizan automáticamente sin inconsistencias.

#### 2.2 Decisión de alcance sobre el Zoom (Preferencia de Sesión vs. Proyecto)
- **Decisión:** El nivel de zoom (`state.project.zoom`, valor por defecto 50%) se trata como **preferencia efímera de sesión** y **no se persiste en `project.json`**.
- **Justificación:** El zoom es una configuración ergonómica del entorno de trabajo local que depende de la resolución física de la pantalla (laptop vs. monitor ultrapanorámico) y de la preferencia visual del usuario en ese momento. Persistir el zoom obligaría a que otro usuario o pantalla abra el proyecto con una escala que podría resultar incómoda o desproporcionada.

### 3. Matriz de Estado: Qué se Persiste y Qué NO

| Sección / Propiedad | ¿Se Persiste? | Destino / Justificación |
|---|:---:|---|
| `project.title` | **SÍ** | Persistido en `storage/project.json` (título oficial del episodio). |
| `project.status` | **SÍ** | Persistido como `'saved'` en el backend tras cada guardado exitoso. |
| `library[].id` | **SÍ** | Identificador UUID único asignado por el backend (`lib-import-...`). |
| `library[].name` | **SÍ** | Nombre original del archivo MP3 subido. |
| `library[].duration` | **SÍ** | Duración numérica contractual del audio en segundos. |
| `library[].url` | **SÍ** | **Ruta relativa limpia** (`/audio-files/<uuid>.mp3`, sin prefijo de host). |
| `tracks[].id`, `colorIndex` | **SÍ** | Estructura de carriles e identificación cromática rotativa (Fase 13.5 eliminó 'name'). |
| `tracks[].name` | **NO** | Eliminado en Fase 13.5 (reemplaza Fase 4); los carriles se distinguen solo por color. |
| `tracks[].clips[].id`, `libraryId`, `start`, `duration` | **SÍ** | Posición temporal, duración recortada y enlace relacional al audio. |
| `tracks[].clips[].objectUrl` | **NO** | Resuelto en tiempo de carga a partir del `libraryId` en la biblioteca. |
| `project.currentTime` | **NO** | Estado efímero de sesión (al reiniciar, el playhead inicia en `00:00:00`). |
| `project.isPlaying` | **NO** | Estado efímero (la aplicación inicia pausada por seguridad auditiva). |
| `project.duration` | **NO** | Se recalcula reactivamente al cargar mediante `recomputeProjectDuration(tracks)`. |
| `project.zoom` | **NO** | Preferencia de visualización local de sesión (default 50%). |
| `project.volume` / `isMuted` | **NO** | Configuración de hardware de reproducción local. |
| `selection` (`clipId`, `libraryId`) | **NO** | Estado transitorio de interacción del puntero. |
| `ui.draggingLibraryId` | **NO** | Bandera efímera activa únicamente durante el evento drag & drop. |

### 4. Guardado Automático con Debounce (1.5 segundos)

- **Detección diferencial en el Store:** En `renderAll(currentState, prevState)`, se evalúa si hubo cambios en los datos del proyecto:
  ```javascript
  const dataChanged = (
    currentState.tracks !== prevState?.tracks ||
    currentState.library !== prevState?.library ||
    currentState.project.title !== prevState?.project?.title ||
    (currentState.project.status !== prevState?.project?.status && currentState.project.status === 'draft')
  );
  if (dataChanged) scheduleAutoSave();
  ```
- **Transición inmediata a Borrador:** Apenas se produce una mutación (creación de carril, recorte, renombrado, importación), `scheduleAutoSave()` actualiza de inmediato `state.project.status = 'draft'` y refresca `#project-status`. El badge refleja instantáneamente el estado `Borrador` / `Draft` con animación pulsante (`animate-pulse`).
- **Debounce de 1.5s:** Se reinicia un temporizador `saveDebounceTimer = setTimeout(..., 1500)`. Ningún fotograma de recorte ni pulsación rápida de teclado dispara peticiones HTTP intermedias.
- **Confirmación con `setState`:** Al cumplirse el debounce, se ejecuta `PUT /api/project`. Si la petición tiene éxito y no hay nuevos cambios encolados, se invoca `setState({ project: { status: 'saved' } })`, transicionando el badge a `Guardado` / `Saved` de forma reactiva y sin generar bucles de autoguardado.

### 5. Carga e Hidratación al Iniciar (`DOMContentLoaded`)

1. **Secuencia de inicialización:**
   - Se aplican el tema visual y las traducciones de i18n (`applyTranslations()`).
   - Se ejecuta de manera asíncrona `await loadProjectFromBackend()` mediante `GET /api/project`.
   - Se hidratan los objetos de `library` con la URL absoluta del backend y se vincula `objectUrl` en cada clip a partir de su `libraryId`.
   - Se recalcula `recomputeProjectDuration(state.tracks)`, garantizando que `#total-duration` y `#duration-label` muestren el tiempo exacto desde el primer instante.
   - Se sincronizan los contadores `trackCounter` y `nextColorIndex` para evitar colisiones con nuevos carriles.
   - Se ejecuta una única llamada inicial a `renderAll()`.
2. **Cero `PUT` redundante:** Como en el arranque inicial `prevState` es `undefined` (`isInitial = true`), el detector de autoguardado no programa ningún guardado automático, evitando disparar un `PUT` innecesario inmediatamente después de un `GET`.

### 6. Resiliencia Offline y Modo Sin Conexión

- **Backend no disponible al iniciar:** Si `GET /api/project` falla (backend apagado o inaccesible), `loadProjectFromBackend()` captura la excepción (`catch`), mantiene el estado limpio por defecto (0 carriles, biblioteca vacía, badge en Borrador) y muestra un aviso discreto traducido en `#import-feedback`:
  - **ES:** `"Servidor local no detectado. Los cambios se mantendrán solo durante esta sesión."`
  - **EN:** `"Local server not detected. Changes will only persist during this session."`
  La interfaz continúa 100% funcional y operable para pruebas locales sin pantallas en blanco ni excepciones no capturadas.
- **Fallo al guardar:** Si el servidor se apaga durante la sesión y se realiza un cambio, el badge permanece en `Borrador` / `Draft` y se despliega una notificación no bloqueante:
  - **ES:** `"No se pudo guardar en el servidor local. Verifica que el backend esté corriendo."`
  - **EN:** `"Could not save to local server. Make sure the backend is running."`
  El usuario está consciente en tiempo real de que los cambios no han sido persistidos.
- **Recuperación tras reconexión:** Al reiniciar el servidor Express y recargar la página, `loadProjectFromBackend()` recupera exactamente el último estado guardado exitosamente previo a la interrupción.

---

## 🎛️ Fase 13.5: Eliminación de Nombres de Carril y Corrección de Alineación del Playhead (Versión Final)

Esta fase reemplaza formalmente la decisión previa de la Fase 4 (que contemplaba nombres editables como "Voz Principal" o "Carril N") y corrige el desfase físico detectado entre el playhead, la regla de tiempo y el área de clips.

### 1. Eliminación Completa del Sistema de Nombres de Carril (Reemplaza Fase 4)
- **Decisión de producto y diseño:** En un editor de audio real, cada clip ya porta su propio nombre descriptivo original (`clip.name` derivado del archivo MP3 importado). La caja de texto del carril ("Carril 1", "Carril 2") no aportaba información útil, consumía espacio horizontal valioso y distorsionaba la alineación visual del timeline.
- **Implementación:**
  - Se eliminó del renderizado dinámico cualquier elemento textual de nombre de carril.
  - Se eliminó por completo la función `renameTrack()`, los campos `<input class="track-rename-input">` in-situ y sus manejadores de eventos (`Enter`, `Escape`, `blur`, `dblclick`).
  - La propiedad `name` fue removida del estado de cada carril (`state.tracks`), del payload de persistencia `PUT /api/project` y del proceso de hidratación `loadProjectFromBackend()`. Los carriles se identifican únicamente por su `id` interno y su coloración rotativa (`TRACK_PALETTE`).
  - Se limpiaron del diccionario `frontend/i18n.js` las claves de texto visible obsoletas (`timeline.defaultTrackPrefix`, `timeline.doubleClickToRename`, `timeline.renameTrackAria`, `timeline.renameTrackPlaceholder`, `timeline.addTrackBtn`, `timeline.createFirstTrack`).

### 2. Nueva Franja de Control Minimalista (`--track-control-strip-width: 40px`)
- **Estructura fija:** Cada fila de carril (`.timeline-row`) incorpora a la izquierda una franja angosta de ancho fijo (`width: var(--track-control-strip-width, 40px)`).
- **Controles visibles:** Contiene únicamente el botón de borrado (`#track-delete-${track.id}`) con el ícono `trash-2`, que ejecuta el flujo seguro de eliminación (confirmación nativa si el carril contiene clips y recálculo reactivo de la duración del proyecto).
- **Accesibilidad integral:** El botón de borrado preserva atributos `aria-label` y `title` completamente traducidos tanto en español ("Eliminar carril") como en inglés ("Delete track").
- **Minimalismo cromático:** Se prescindió de puntos o barras redundantes de color en la franja, dado que el propio fondo y borde del carril (`.timeline-lane`) ya expresan claramente el tono de la paleta.

### 3. Corrección de Alineación y Cero "Recorrido Muerto" del Playhead
- **Diagnóstico de causa raíz:**
  - El playhead (`#timeline-playhead`) tenía `left: 0` y calculaba su posición como `translateX(${px}px)` desde el borde izquierdo absoluto de la columna.
  - La zona de clips (`.timeline-lane`) estaba desplazada hacia la derecha debido al padding del contenedor (`p-4 lg:p-6`) y a las antiguas cabeceras de pista (`w-40`/`w-44` = 160px-176px). A un zoom del 50% (4 px/s), esto causaba un "recorrido muerto" de más de 40 segundos antes de que el playhead alcanzara el audio real.
  - La regla de tiempo (`#timeline-ruler`) expandía sus marcas mediante `justify-between` y `px-4` sobre toda la columna sin compensar el encabezado de carril.
- **Solución arquitectónica (Origen común unificado en `40px`):**
  1. Se definió la variable CSS `--track-control-strip-width: 40px;` en `:root`, `[data-theme="light"]` y `[data-theme="dark"]`.
  2. `#timeline-tracks` utiliza `px-0 py-3`, iniciando cada fila en `x = 0`. La franja de control abarca de `0` a `40px`, por lo que el carril de clips (`.timeline-lane`) comienza exactamente en `x = 40px`.
  3. `#timeline-ruler` incorpora un canal espaciador `.timeline-ruler-gutter` de ancho fijo `40px` (`style="width: var(--track-control-strip-width);"`), seguido de la escala `#timeline-ruler-scale`. La marca `00:00:00` inicia exactamente en `x = 40px`.
  4. `#timeline-playhead` tiene asignado `left: var(--track-control-strip-width, 40px);`. A `currentTime = 0`, `translateX(0px)` ubica la línea del playhead exactamente en `x = 40px`.
  5. Durante la reproducción o búsqueda (scrubbing), el contador de transporte `#current-time`, la regla y el playhead avanzan en sincronía milimétrica 1:1, sin desfase ni recorrido muerto.

### 4. Botones de Agregar Carril Minimalistas (Solo Ícono "+")
- `#btn-add-track` en la cabecera del timeline y `#btn-empty-add-track` en el estado vacío general fueron simplificados a botones cuadrados de solo ícono `+` sin texto visible.
- Preservan `aria-label` y `title` completamente traducidos ("Agregar nuevo carril" / "Add new track", "Crear primer carril" / "Create first track") para accesibilidad WCAG.

---

## 📌 Decisiones de Arquitectura y Alcance — Sprint 5

### 0.1 Nota de arquitectura: Empaquetado final con Electron Builder (Sprint 7)
El entregable final del proyecto (Sprint 7) será empaquetado con **Electron Builder** como una **aplicación de escritorio nativa instalable (`.exe` para Windows)**, y no como un sitio o página web. Toda la base de código HTML5, Vanilla CSS y Vanilla JS ha sido diseñada contractualmente para cumplir este requisito:
- Rutas 100% relativas y sin dependencias de CDN en tiempo de ejecución (`vendor/` local).
- Ausencia de supuestos sobre la barra de navegación o botones de retroceso del navegador.
- Guardias de seguridad para escritorio (`bindGlobalDragGuard`) y soporte integral de atajos de teclado de estación de trabajo.

### 0.2 Decisión de alcance: Modelo de reproducción de audio único
El modelo de audio de PodcastCraft AI mantiene la arquitectura probada de los sprints anteriores: **un único audio activo a la vez (`globalAudio`)**. El playhead móvil refleja con alta precisión la posición temporal de dicho audio sobre la regla y los carriles de la línea de tiempo. No se implementa mezcla simultánea real de múltiples pistas concurrentes en este sprint, ya que requeriría una matriz de nodos en Web Audio API que excede el alcance del taller de interfaces. Esta limitación conocida queda formalmente documentada.

### 0.3 Tercera Excepción Documentada al Store Central
Siguiendo la arquitectura de rendimiento del proyecto, se establece la **tercera excepción contractual al Store central** (tras la clase temporal `.is-dragging` del Sprint 2 y los Pointer Events de recorte `.clip-handle` del Sprint 4):
- **Regla estricta:** **Prohibido invocar `setState` o usar `setInterval` para desplazar el playhead cuadro a cuadro.**
- **Mecanismo:** El bucle `startPlayheadLoop()` se ejecuta a 60 FPS sincronizado con la tasa de refresco de pantalla mediante `requestAnimationFrame(tick)`. Lee directamente `globalAudio.currentTime` y actualiza las propiedades del DOM (`#timeline-playhead.style.transform` y `#current-time.textContent`) de forma directa y paralela.
- **Persistencia en el Store:** `state.project.currentTime` se actualiza **exclusivamente en eventos discretos y puntuales** (pulsación de Play/Pause, evento `ended`, o clics de scrubbing). Esto garantiza 60 FPS reales sin disparar ciclos de renderizado global innecesarios (`renderAll()` se ejecuta 0 veces durante la reproducción continua).

---

## 1. Cómo abrir y ejecutar

### Opción A: Ejecución directa sin internet (Recomendada para evaluación)
Haz doble clic sobre el archivo `index.html` en el explorador de archivos de Windows o ábrelo en cualquier navegador moderno (Google Chrome, Microsoft Edge, Mozilla Firefox).

> **Cero dependencias en tiempo de ejecución:** El proyecto incluye copias locales fijas de **Tailwind CSS v3.4.17** y **Lucide Icons v0.383.0** en la carpeta `vendor/`. La aplicación funciona de manera 100% autónoma y offline (incluso con la conexión de red o Wi-Fi apagada).

### Opción B: Servidor de desarrollo local (opcional)
```bash
# Con Python 3
python -m http.server 3000

# O con npx serve
npx serve .
```
Luego accede a `http://localhost:3000/index.html`.

---

## 2. Estructura de archivos

```
podcastcraft-ai/
├── index.html              # Estructura semántica HTML5, playhead contractual y contenedor relativo
├── styles.css              # Tokens, playhead blanco/rojo, will-change, paletas y controles
├── tailwind-config.js      # Configuración de Tailwind Play CDN, colores IA y fuentes
├── app.js                  # Lógica central: bucle rAF 60 FPS, seekTo, store y eventos de transporte
├── vendor/
│   ├── lucide.min.js       # Librería de iconos Lucide v0.383.0 (UMD local)
│   └── tailwind.js         # Script Tailwind CSS Play CDN v3.4.17 (local)
└── README.md               # Documentación arquitectónica, decisiones de diseño y roadmap
```

---

## 3. Capacidades centrales del Sprint 5

### 3.1 Playhead de Alta Fidelidad (`#timeline-playhead`)
1. **Línea continua multi-carril:** Un elemento visual `<div id="timeline-playhead" aria-hidden="true">` posicionado de manera absoluta (`top: 0; bottom: 0; left: 0; z-index: 30;`) dentro de un contenedor relativo sobre `#timeline-tracks`, extendiéndose verticalmente a lo largo de todos los carriles del proyecto.
2. **Estilo visual respetuoso de la regla cromática:** Línea blanca pura (`#ffffff`, 2px de grosor) con sutil resplandor rojo (`box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.5), 0 0 8px 2px rgba(239, 68, 68, 0.4);`). No utiliza violeta ni fucsia (estrictamente reservados para IA y botones primarios).
3. **Aceleración por hardware:** Incorpora `will-change: transform` para que el motor de renderizado del navegador promueva el elemento a una capa de composición independiente de la GPU, eliminando repintados costosos de la página.
4. **No intrusivo:** Posee `pointer-events: none;`, permitiendo que el usuario seleccione clips, use las asas de recorte o arrastre bloques de audio a través de la línea del playhead sin ninguna interferencia.

### 3.2 Sincronización a 60 FPS vía `requestAnimationFrame`
1. **Control de ciclo de vida:** `startPlayheadLoop()` se inicia únicamente tras la resolución exitosa de la promesa `globalAudio.play()`. Si el navegador rechaza la reproducción (por ejemplo por políticas de interacción), el bloque `.catch()` aborta la llamada y evita bucles huérfanos.
2. **Parada limpia:** `stopPlayheadLoop()` cancela inmediatamente el callback pendiente mediante `cancelAnimationFrame(playheadRafId)`. Se invoca al pausar, al dispararse el evento `ended` de `globalAudio`, o al eliminarse todos los clips del timeline.
3. **Cero saturación de Store:** Durante la reproducción, el loop manipula directamente `playheadEl.style.transform = 'translateX(...)px'` y `currentTimeEl.textContent = formatTime(...)`, sin llamar a `setState()` en cada fotograma.

### 3.3 Scrubbing en Regla de Tiempo (`#timeline-ruler`)
1. **Búsqueda directa por clic:** Al hacer clic en cualquier punto de `#timeline-ruler`, se calcula la posición temporal según la escala visual (`clickX / getPixelsPerSecond()`). La función centralizada `seekTo(seconds)`:
   - Reposiciona `globalAudio.currentTime` inmediatamente (si hay audio cargado).
   - Actualiza de forma puntual el Store central (`state.project.currentTime`).
   - Reposiciona el playhead en el DOM de forma instantánea (`transform: translateX(...)`), sin esperar al siguiente ciclo de animación.
   - Sincroniza el contador `#current-time`.
2. **Scrubbing durante la reproducción:** El audio realiza un salto sonoro instantáneo a la nueva marca temporal y continúa reproduciéndose fluidamente sin detenerse.
3. **Scrubbing en pausa:** Reposiciona el playhead y prepara `globalAudio.currentTime` para que, al dar Play posteriormente, el audio comience a sonar exactamente desde ese nuevo segundo.
4. **Resistencia sin clips cargados:** Si no hay clips en la pista o no se ha asignado audio físico, el clic en la regla desplaza el indicador visual y actualiza el contador sin generar errores ni excepciones en consola.
5. **Navegación accesible por teclado:** `#timeline-ruler` cuenta con `role="slider"`, `tabindex="0"`, `aria-label="Buscar posición en la línea de tiempo"`, `aria-valuemin="0"`, `aria-valuemax` sincronizado con la duración total y `aria-valuenow` dinámico. Permite saltos de ±5 segundos mediante las teclas de flecha `ArrowLeft` y `ArrowRight`.
6. **Atajo de transporte:** La barra espaciadora (`Space`) conmuta alternativamente entre Reproducir y Pausar (respetando si el foco está sobre un campo de texto editable).

---

## 4. Contrato de IDs (Sprint 1 a Sprint 5)

### 4.1 Identificadores Activos
- **Navegación:** `topbar`, `project-title`, `project-status`, `total-duration`, `btn-ai-analysis`, `btn-export`, `btn-theme-toggle` *(Nuevo - Fase A: Conmutador de tema)*, `btn-language-toggle` *(Nuevo - Fase 10: Conmutador de idioma)*
- **Biblioteca:** `col-library`, `library-count`, `library-list`, `btn-import-audio`, `audio-file-input`, `import-feedback`, `lib-card-${item.id}`
- **Línea de tiempo:** `col-timeline`, `zoom-slider`, `zoom-value`, `timeline-ruler` *(Slider accesible con scrubbing S5)*, `.timeline-ruler-gutter`, `timeline-ruler-scale`, `timeline-playhead` *(Nuevo S5)*, `timeline-tracks`, `btn-add-track` *(Icon-only S13.5)*, `btn-empty-add-track` *(Icon-only S13.5)*, `.timeline-control-strip`, `track-delete-${id}`, `timeline-clip-${clip.id}`, `.clip-handle-left`, `.clip-handle-right`
- **Panel IA:** `col-ai-panel`, `ai-transcript`, `ai-cta`
- **Transporte:** `transport`, `now-playing-name`, `now-playing-meta`, `btn-rewind`, `btn-play`, `btn-forward`, `current-time`, `duration-label`, `btn-mute`, `volume-slider`
- **Guardia de pantalla:** `viewport-warning`

---

## 5. Roadmap de desarrollo (7 Sprints)

| Sprint | Título | Estado |
|:---:|---|:---:|
| **1** | **Shell de escritorio + Top Navbar + Footer de transporte** | **Completado ✅** |
| **2** | **Biblioteca de bloques de audio + Pestañas + Fuente Drag & Drop** | **Completado ✅** |
| **3** | **Pivote Local Funcional + Timeline con Drop Zones + Audio Real** | **Completado ✅** |
| **4** | **Carriles Dinámicos Ilimitados + Import MP3 + Edición (Trim/Split/Delete)** | **Completado ✅** |
| **5** | **Playhead de Alta Fidelidad + Scrubbing en Regla (rAF 60 FPS + A11y Slider)** | **Completado (Este Sprint) ✅** |
| 6 | Motor de simulación de IA (limpiar audio con animación y notificaciones toast) | Planificado |
| 7 | Pulido final, microinteracciones, atajos globales y **empaquetado nativo (.exe con Electron Builder)** | Planificado |

---

## 6. Pruebas interactivas desde la consola de desarrollo

Abre la consola del navegador (F12 o Ctrl+Shift+I):

```javascript
// 1. Consultar estado global del proyecto
PodcastCraft.getState();

// 2. Realizar búsqueda temporal (Scrubbing programático a 15 segundos)
PodcastCraft.seekTo(15);

// 3. Iniciar / detener bucle del playhead manualmente
PodcastCraft.startPlayheadLoop();
PodcastCraft.stopPlayheadLoop();

// 4. Consultar escala visual actual (píxeles por segundo)
console.log('PPS actual:', PodcastCraft.getPixelsPerSecond());

// 5. Inspeccionar elemento de audio global
console.log('Audio actual:', PodcastCraft.globalAudio.src, PodcastCraft.globalAudio.currentTime);
```
