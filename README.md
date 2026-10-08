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

### 4. Alcance Pendiente para Fase 11
La Fase 11 extenderá el uso de `t(key)` y los atributos `data-i18n*` a los componentes internos restantes:
- **Biblioteca de Medios:** Encabezado, botón "Importar MP3", feedback de validación, estados vacíos, badges.
- **Línea de Tiempo:** Encabezado, botón "Nuevo Carril", controles de Zoom, tooltip de división, texto de carril vacío.
- **Panel de Asistente IA:** Encabezado, badge Beta, tarjeta vacía de transcripción, botón "Limpiar Audio con IA".
- **Modales y Diálogos:** Mensajes de confirmación de eliminación y advertencia de resolución de pantalla.

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
- **Línea de tiempo:** `col-timeline`, `zoom-slider`, `zoom-value`, `timeline-ruler` *(Slider accesible con scrubbing S5)*, `timeline-playhead` *(Nuevo S5)*, `timeline-tracks`, `btn-add-track`, `btn-empty-add-track`, `track-name-${id}`, `track-delete-${id}`, `timeline-clip-${clip.id}`, `.clip-handle-left`, `.clip-handle-right`
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
