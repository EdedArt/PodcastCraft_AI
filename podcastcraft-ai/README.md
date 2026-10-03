# PodcastCraft AI — Sprint 3 de 7 (Pivote Local Funcional)

Estación de trabajo de audio digital (DAW) y editor de podcasts con asistencia de Inteligencia Artificial (estilo Descript / Adobe Audition), desarrollada como proyecto final para la asignatura **Diseño de Interfaces de Software** en la Universidad Cooperativa de Colombia.

Este repositorio contiene el **Sprint 3 (Estado Local Funcional, Timeline con Drop Zones, Importación de Audio Real y Play Contextual)**, construido de forma aditiva y evolutiva sobre el Shell y la Biblioteca establecidos en los Sprints 1 y 2.

---

## 📌 Nota de pivote — Sprint 3
- **Fecha de autorización del pivote:** 3 de octubre de 2026.
- **Motivo del cambio de naturaleza:** La aplicación pasa formalmente de ser un prototipo con datos mock precargados a una **aplicación funcional local, sin backend**, capaz de leer y reproducir archivos de audio reales procedentes del sistema de archivos del usuario.
- **Alcance sobre Atomic Design previo:** La tabla de Atomic Design del Taller Académico (Sprint 2) que definía la aplicación como una *"Página poblada"* queda documentada explícitamente como válida **únicamente hasta el Sprint 2**. A partir del Sprint 3, la aplicación opera bajo el concepto de **"Template / Clean Slate"**, iniciando vacía por diseño (`project.title = 'Untitled Project'`, `library = []`, `tracks[].clips = []`, `duration = 0`) hasta que el usuario importa audios reales a su estación de trabajo.
- **Duración dinámica:** `project.duration` deja de ser un valor estático (`2535s`); ahora se calcula dinámicamente como el punto temporal máximo (`start + duration`) de los clips colocados en el timeline mediante la función `recomputeProjectDuration()`.
- **Semilla opcional de prueba:** `MOCK_LIBRARY` se mantiene intacta en el código como constante para evaluación docente, accesible manualmente mediante el comando `window.PodcastCraft.loadSampleLibrary()`.

---

## 1. Cómo abrir y ejecutar

### Opción A: Ejecución directa sin internet (Recomendada para evaluación)
Haz doble clic sobre el archivo `index.html` en el explorador de archivos de Windows o ábrelo en cualquier navegador moderno (Google Chrome, Microsoft Edge, Mozilla Firefox).

> **Cero dependencias en tiempo de ejecución:** El proyecto incluye copias locales fijas de **Tailwind CSS v3.4.17** y **Lucide Icons v0.383.0** en la carpeta `vendor/`. La aplicación funciona de manera 100% autónoma y offline (incluso con la conexión de red o Wi-Fi apagada).

### Opción B: Servidor de desarrollo local (opcional)
Si deseas servirlo a través de un servidor HTTP local:
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
├── index.html              # Estructura semántica HTML5, anclajes y los IDs contractuales
├── styles.css              # Tokens, scrollbars oscuras, .glow-ai, sliders, .is-dragging y keyframes
├── tailwind-config.js      # Configuración de Tailwind Play CDN, colores IA y fuentes
├── app.js                  # Lógica central dividida en 7 secciones y mini-store reactivo
├── vendor/
│   ├── lucide.min.js       # Librería de iconos Lucide v0.383.0 (UMD local)
│   └── tailwind.js         # Script Tailwind CSS Play CDN v3.4.17 (local)
└── README.md               # Documentación, contrato de Drag & Drop, decisiones y roadmap
```

### Orden estricto de carga en `index.html`
1. `vendor/tailwind.js` (Motor de estilos Tailwind v3)
2. `tailwind-config.js` (Tokens, paleta IA, tipografía y sombras)
3. `styles.css` (Reglas CSS personalizadas, cross-browser sliders, animaciones y clases de arrastre)
4. `vendor/lucide.min.js` (Librería de renderizado de iconos SVG)
5. `app.js` con atributo `defer` (Lógica de estado, eventos, renderizado y guardias de escritorio)

---

## 3. Sistema de diseño ("IA Cyber-Audio")

### 3.1 Paleta de color y tokens
| Rol | Token Tailwind / Hex | Propósito |
|---|---|---|
| **Fondo general** | `slate-950` (`#020617`) | Fondo principal inmersivo tipo suite de escritorio |
| **Paneles / Módulos** | `slate-900` (`#0f172a`) | Fondo de barras superior, inferior y paneles laterales |
| **Bordes y separadores** | `slate-800` (`#1e293b`) | Delimitadores de alta precisión y tarjetas |
| **Pista Voz (Track 1)** | `sky-500` / `sky-900` | Asignada a narración y pistas de voz principal (`voice`) |
| **Pista Música (Track 2)** | `amber-500` / `amber-900` | Asignada a cortinas e intros musicales (`music`) |
| **Pista Efectos (Track 3)** | `emerald-500` / `emerald-900` | Asignada a remates de audio, FX y publicidad (`fx`) |
| **Acento exclusivo IA** | `violet-500` / `fuchsia-500` | **Regla de oro:** Reservado para IA, botón Play, sliders y anillo de foco |

### 3.2 Regla cromática estricta para Biblioteca
- Las tarjetas de bloque de audio y las pestañas de categorías **NO utilizan acentos violeta ni fucsia**.
- **Tarjetas:** Fondo `bg-slate-900`, borde `border-slate-800`. En `hover`: `border-slate-600 bg-slate-800/60`. En estado seleccionado (`selected`): `border-slate-400 bg-slate-800` (resaltado neutro). Barra izquierda de 2px e icono con recuadro `iconTile` codificados por el color del carril (`sky` para voz, `amber` para música, `emerald` para fx).
- **Pestañas:** Pestaña activa con `bg-slate-800 text-white border-b-2 border-slate-100`. Inactivas con `text-slate-400 hover:text-slate-200 hover:bg-slate-800/50`.
- El anillo de foco de teclado (`focus-visible:ring-violet-500`) unifica la accesibilidad de toda la aplicación.

---

## 4. Arquitectura de la Biblioteca (Sprint 2)

### 4.1 Contenido de bloques (`MOCK_LIBRARY`)
La biblioteca precarga 8 bloques estándar que cubren las necesidades de un episodio completo:
1. `lib-01` — **Bienvenida del locutor** (`voice`, `voice`, 48s, `mic`)
2. `lib-02` — **Entrevista completa · Invitado** (`voice`, `voice`, 1260s / 21:00, `mic-vocal`)
3. `lib-03` — **Intro Synthwave** (`music`, `music`, 15s, `music-2`)
4. `lib-04` — **Fondo Lo-fi Ambient** (`music`, `music`, 240s / 04:00, `music`)
5. `lib-05` — **Transición Whoosh** (`fx`, `effect`, 2s, `zap`)
6. `lib-06` — **Aplausos de estudio** (`fx`, `effect`, 6s, `volume-2`)
7. `lib-07` — **Spot Sponsor · Tech Store** (`fx`, `ad`, 30s, `megaphone`)
8. `lib-08` — **Cuña institucional** (`fx`, `ad`, 15s, `radio`)

### 4.2 Filtrado por pestañas y WAI-ARIA
- Pestañas disponibles: **Todos**, **Música**, **Voz**, **Efectos**, **Anuncios**.
- Cada pestaña incluye un contador dinámico que refleja la cantidad de bloques pertenecientes a dicho filtro.
- Accesibilidad: Las pestañas siguen el patrón WAI-ARIA `role="tablist"` y `role="tab"` con roving `tabindex` (`0` para la activa, `-1` para inactivas), navegación con flechas `←` / `→`, `Home` y `End`.
- El contenedor de la lista actúa como `role="tabpanel"` referenciando mediante `aria-labelledby` a la pestaña activa.

### 4.3 Navegación por teclado en la lista
- `ArrowDown` / `ArrowUp`: Mueve el foco secuencialmente entre las tarjetas de audio visibles.
- `Enter` / `Espacio`: Selecciona o deselecciona la tarjeta enfocada (`state.selection.libraryId`).
- `Escape`: Limpia la selección activa.

### 4.4 Estados vacíos (`#library-empty`)
- Cuando la biblioteca se vacía (`state.library = []`): Muestra el estado inicial con icono `file-audio` y mensaje *"Tu biblioteca aparecerá aquí"*.
- Cuando un filtro no devuelve resultados: Muestra el estado con icono `search-x` y mensaje *"No hay bloques en esta categoría"*.

---

## 5. Contrato de Drag & Drop para el Sprint 3

Este sprint actúa exclusivamente como la **fuente de arrastre (drag source)**. Para garantizar un acoplamiento perfecto e inmediato con el Sprint 3 (Timeline con carriles y destino drop), se define el siguiente contrato estricto:

### 5.1 Datos transferidos en `dragstart`
- **MIME Type Primario:** `application/x-podcastcraft-block`
- **Payload JSON:**
  ```json
  {
    "libraryId": "lib-01",
    "name": "Bienvenida del locutor",
    "category": "voice",
    "subtype": "voice",
    "duration": 48,
    "icon": "mic"
  }
  ```
- **Fallback obligatorio:** `dataTransfer.setData('text/plain', item.name)`. *Crítico: Mozilla Firefox no inicia la operación de arrastre si no se registra un tipo de texto estándar en el `dataTransfer`.*
- **Efecto de arrastre permitido:** `e.dataTransfer.effectAllowed = 'copy'`.

### 5.2 Comportamiento durante `dragover` en el Sprint 3
- Por motivos de seguridad del estándar HTML5 Drag and Drop, **los navegadores impiden leer `e.dataTransfer.getData(...)` durante el evento `dragover`** (solo permiten inspeccionar `e.dataTransfer.types`).
- Para que el Sprint 3 pueda mostrar feedback visual (highlight del carril correcto, sombra de clip proyectada):
  1. Validar que `e.dataTransfer.types.includes('application/x-podcastcraft-block')`.
  2. Leer el ID del bloque en arrastre directamente desde el estado central: `state.ui.draggingLibraryId`.
  3. Consultar los datos del bloque mediante `PodcastCraft.getState().library.find(i => i.id === state.ui.draggingLibraryId)`.
- Al ocurrir el evento `drop`, el Sprint 3 ya podrá leer el contenido completo con `JSON.parse(e.dataTransfer.getData('application/x-podcastcraft-block'))`.

### 5.3 Mapeo de categoría hacia carril destino
| `category` del bloque | Carril destino en el Timeline | Color de acento |
|---|---|---|
| `voice` | `track-voice` ("Voz Principal") | `sky-500` |
| `music` | `track-music` ("Música & Intro") | `amber-500` |
| `fx` | `track-fx` ("Anuncios & FX") | `emerald-500` |

---

## 6. Decisiones de diseño y técnicas

1. **Distinción entre `category` y `subtype`:**
   - `category` (`'voice' | 'music' | 'fx'`) es la **única fuente de verdad cromática y de enrutamiento al carril de la línea de tiempo**.
   - `subtype` (`'voice' | 'music' | 'effect' | 'ad'`) permite separar en la biblioteca las pestañas de "Efectos" y "Anuncios" con sus respectivas etiquetas visibles en las tarjetas, a pesar de que ambos tipos comparten el carril 3 ("Anuncios & FX") en la escaleta.
2. **Verificación completa de iconos en Lucide v0.383.0:**
   Se verificó en la distribución local `vendor/lucide.min.js` la existencia nativa de todos los iconos requeridos en la especificación:
   - `mic` (`Mic`), `mic-vocal` (`MicVocal` / `Mic2`), `music-2` (`Music2`), `music` (`Music`), `zap` (`Zap`), `volume-2` (`Volume2`), `megaphone` (`Megaphone`), `radio` (`Radio`), `grip-vertical` (`GripVertical`), `file-audio` (`FileAudio`) y `search-x` (`SearchX`).
   - Ningún icono requirió sustitución por incompatibilidad.
3. **Excepción documentada del Store durante el arrastre (`is-dragging`):**
   - El principio general de la aplicación es que toda actualización visual fluye a través de `setState` → suscriptores.
   - Sin embargo, si al dispararse `dragstart` se forzara la re-renderización de la lista de tarjetas mediante el Store, el elemento DOM del bloque que el usuario está sosteniendo sería destruido y reemplazado en el árbol DOM, lo que provocaría que el navegador cancele de forma inmediata la operación de arrastre.
   - **Solución implementada:** La clase CSS transitoria `.is-dragging` (`opacity-40 scale-[0.98]`) se aplica y remueve directamente en el elemento de la tarjeta dentro de `dragstart` y `dragend`. Además, la función `renderAll(state, prevState)` omite re-renderizar la biblioteca si el único cambio en el estado es `ui.draggingLibraryId`, garantizando fluidez sin cancelaciones.
4. **Píldora visual como imagen de arrastre (`setDragImage`):**
   Al comenzar el arrastre, se genera dinámicamente un nodo flotante fuera de pantalla estilizado como una píldora compacta con el nombre del bloque, duración y borde del color de su categoría. Se vincula mediante `e.dataTransfer.setDragImage(pill, 20, 16)` y se remueve en el siguiente frame (`requestAnimationFrame`) para evitar residuo en el DOM.
5. **Guardia global de escritorio obligatoria (`bindGlobalDragGuard`):**
   Se añadieron escuchadores a nivel de ventana para `dragover` y `drop` con `e.preventDefault()`. Esto previene que soltar un bloque o arrastrar accidentalmente un archivo externo del explorador de Windows sobre cualquier punto de la ventana provoque que el navegador intente navegar hacia la ruta `file://` o abra el archivo. En un entorno de escritorio (Electron o Tauri), esta guardia es imprescindible para evitar la recarga o terminación de la aplicación.
6. **Formato de duración adaptativo:**
   La utilidad `formatDuration(seconds)` produce `mm:ss` para clips de audio menores a 3600 segundos (ej. `00:48`, `21:00`) y `HH:MM:SS` para audios de mayor longitud, manteniendo consistencia y legibilidad.

---

---

## 7. Nuevas capacidades y decisiones técnicas (Sprint 3 — Pivote)

1. **Importación de Audio Real (`#btn-import-audio` + `#audio-file-input`):**
   - Utiliza la API nativa de archivos del navegador (`HTMLInputElement[type=file]`, `accept="audio/*"`, `multiple`).
   - Lee archivos locales con `URL.createObjectURL(file)`, permitiendo reproducir audio directamente en memoria sin backend ni servidores externos.
   - Crea una instancia de `new Audio(objectUrl)` y aguarda el evento `loadedmetadata` para extraer la duración precisa (`audio.duration`).
   - **Limitación conocida y fallback:** En ciertos contenedores comprimidos (ej. WebM/Opus o streams sin encabezado de duración fija), `audio.duration` puede reportar `Infinity` o `NaN`. La aplicación detecta esta condición y aplica defensivamente un fallback de `0` segundos.
   - **Simplificación arquitectónica:** Todo archivo importado entra inicialmente clasificado como `category: 'voice', subtype: 'voice'` (la reclasificación por parte del usuario queda reservada para un sprint posterior).
   - **Regla de liberación de recursos:** En sprints posteriores, cuando se incorpore la función de eliminación de archivos de la biblioteca, debe invocarse `URL.revokeObjectURL(item.objectUrl)` para liberar los buffers de memoria del navegador.

2. **Timeline funcional con Drop Zones (`#timeline-tracks`):**
   - Dispone de 3 carriles dedicados:
     - `#timeline-track-voice`: Voz Principal (`voice`, acento `sky-500`)
     - `#timeline-track-music`: Música & Intro (`music`, acento `amber-500`)
     - `#timeline-track-fx`: Anuncios & FX (`fx`, acento `emerald-500`)
   - Durante `dragover`, valida contractualmente el tipo MIME `application/x-podcastcraft-block` y compara la categoría del bloque arrastrado (`state.ui.draggingLibraryId`) con la del carril. Si coinciden, ilumina el carril con borde y fondo brillante (`lane-highlight-${category}`) y cursor de copia; si difieren, deniega la acción (`dropEffect = 'none'`, cursor `not-allowed`).
   - Al soltar (`drop`), si hay discrepancia de categoría, la acción se cancela y se produce un parpadeo visual de rechazo en rojo (`lane-reject-flash`, 200ms).
   - **Posicionamiento y escala temporal:** Se calcula `start` mediante `Math.round(dropX / getPixelsPerSecond())`, donde `PIXELS_PER_SECOND_BASE = 4` modulado por el zoom.
   - **Prevención simple de colisión (solapamiento):** Si el nuevo clip cae dentro del rango de tiempo de un clip existente en ese carril, `start` se desplaza automáticamente al final del clip solapado, manteniendo la escaleta ordenada sin mutaciones complejas.
   - **Recálculo dinámico de duración:** Tras cada inserción, `recomputeProjectDuration()` calcula el final máximo de todos los clips (`start + duration`) y actualiza `state.project.duration` en la barra superior y pie de transporte.

3. **Play Contextual y Reproducción Real (`#btn-play`):**
   - El botón `#btn-play` permanece estrictamente deshabilitado (`disabled`, `aria-disabled="true"`, `opacity-40 cursor-not-allowed`) mientras no exista ningún clip en el timeline.
   - En cuanto se coloca el primer clip, el botón se habilita de inmediato (`glow-ai`, `cursor-pointer`).
   - Al pulsar Play, se controla una única instancia global de `<audio>`:
     - Si el clip activo (seleccionado o el primero en orden `voice → music → fx`) contiene un `objectUrl` real, se reproduce dicho archivo en el sistema de altavoces.
     - Si el clip proviene de la semilla `MOCK_LIBRARY` (sin archivo físico vinculado), se ejecuta la simulación de reproducción reactiva (ícono Play/Pausa y estado) sin emitir audio.

---

## 8. Contrato de IDs (Sprint 1 + Sprint 2 + Sprint 3)

Los siguientes identificadores únicos forman el contrato de integración:
- **Navegación:** `topbar`, `project-title`, `project-status`, `total-duration`, `btn-ai-analysis`, `btn-export`
- **Área de trabajo y Biblioteca:** `workspace`, `col-library`, `library-tabs`, `library-count`, `library-list`, `btn-import-audio` *(Nuevo en S3)*, `audio-file-input` *(Nuevo en S3)*
- **Pestañas de biblioteca:** `library-tab-all`, `library-tab-music`, `library-tab-voice`, `library-tab-effect`, `library-tab-ad`
- **Estado vacío de biblioteca:** `library-empty`
- **Tarjetas de bloque:** `lib-card-${item.id}` junto con el atributo contractual `data-library-id="${item.id}"`
- **Línea de tiempo y Carriles:** `col-timeline`, `zoom-slider`, `zoom-value`, `timeline-ruler`, `timeline-tracks`, `timeline-track-voice` *(Nuevo en S3)*, `timeline-track-music` *(Nuevo en S3)*, `timeline-track-fx` *(Nuevo en S3)*, `timeline-clip-${clip.id}` *(Nuevo en S3)*
- **Panel IA:** `col-ai-panel`, `ai-transcript`, `ai-cta`
- **Transporte:** `transport`, `now-playing-name`, `now-playing-meta`, `btn-rewind`, `btn-play`, `btn-forward`, `current-time`, `duration-label`, `btn-mute`, `volume-slider`
- **Guardia de pantalla:** `viewport-warning`

---

## 9. Roadmap de desarrollo (7 Sprints)

| Sprint | Título | Estado |
|:---:|---|:---:|
| **1** | **Shell de escritorio + Top Navbar + Footer de transporte** | **Completado ✅** |
| **2** | **Biblioteca de bloques de audio + Pestañas + Fuente Drag & Drop** | **Completado ✅** |
| **3** | **Pivote Local Funcional + Timeline con Drop Zones + Audio Real** | **Completado (Este Sprint) ✅** |
| 4 | Panel de IA + transcripción textual + detección y resaltado de muletillas | Planificado |
| 5 | Playhead móvil + transporte funcional + atajos de teclado (Espacio, J, L, M) | Planificado |
| 6 | Motor de simulación de IA (limpiar audio con animación y notificaciones toast) | Planificado |
| 7 | Pulido final, microinteracciones, Ctrl+Z simulado y defensa de proyecto | Planificado |

---

## 10. Pruebas interactivas desde la consola de desarrollo

Abre las herramientas de desarrollador (F12 o Ctrl+Shift+I) en el navegador para verificar la API pública expuesta en `window.PodcastCraft`:

```javascript
// 1. Consultar estado global (inicia en Clean Slate: título Untitled Project, duración 0, biblioteca vacía)
PodcastCraft.getState();

// 2. Cargar semilla de bloques mock de prueba para evaluación académica (Sprint 3 — 2.1)
PodcastCraft.loadSampleLibrary(); // Llena la biblioteca con los 8 bloques estándar

// 3. Probar filtrado reactivo de categorías
PodcastCraft.setState({ ui: { libraryFilter: 'music' } }); // Pestaña Música
PodcastCraft.setState({ ui: { libraryFilter: 'voice' } }); // Pestaña Voz
PodcastCraft.setState({ ui: { libraryFilter: 'all' } });   // Todos

// 4. Recalcular y consultar la duración dinámica del proyecto
PodcastCraft.recomputeProjectDuration();

// 5. Simular inserción directa de un clip en el timeline desde el Store
PodcastCraft.setState({
  tracks: [
    {
      id: 'track-voice',
      name: 'Voz Principal',
      category: 'voice',
      clips: [{ id: 'clip-test-1', name: 'Prueba de Voz', category: 'voice', duration: 30, start: 0, objectUrl: null }]
    },
    ...PodcastCraft.getState().tracks.slice(1)
  ],
  project: { duration: 30 }
});
```

