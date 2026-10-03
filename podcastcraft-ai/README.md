# PodcastCraft AI — Sprint 2 de 7

Estación de trabajo de audio digital (DAW) y editor de podcasts con asistencia de Inteligencia Artificial (estilo Descript / Adobe Audition), desarrollada como proyecto final para la asignatura **Diseño de Interfaces de Software** en la Universidad Cooperativa de Colombia.

Este repositorio contiene el **Sprint 2 (Biblioteca de bloques, Pestañas de categoría, Fuente de Drag & Drop y Navegación por teclado)**, construido de manera aditiva sobre el Shell, Store central y Sistema de diseño establecidos en el Sprint 1.

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

## 7. Contrato de IDs (Sprint 1 + Sprint 2)

Los siguientes identificadores únicos forman el contrato de integración:
- **Navegación:** `topbar`, `project-title`, `project-status`, `total-duration`, `btn-ai-analysis`, `btn-export`
- **Área de trabajo:** `workspace`, `col-library`, `library-tabs`, `library-count`, `library-list`, `col-timeline`, `zoom-slider`, `zoom-value`, `timeline-ruler`, `timeline-tracks`, `col-ai-panel`, `ai-transcript`, `ai-cta`
- **Pestañas de biblioteca (Sprint 2):** `library-tab-all`, `library-tab-music`, `library-tab-voice`, `library-tab-effect`, `library-tab-ad`
- **Estado vacío de biblioteca (Sprint 2):** `library-empty`
- **Tarjetas de bloque (Sprint 2):** `lib-card-${item.id}` junto con el atributo contractual `data-library-id="${item.id}"`
- **Transporte:** `transport`, `now-playing-name`, `now-playing-meta`, `btn-rewind`, `btn-play`, `btn-forward`, `current-time`, `duration-label`, `btn-mute`, `volume-slider`
- **Guardia de pantalla:** `viewport-warning`

---

## 8. Roadmap de desarrollo (7 Sprints)

| Sprint | Título | Estado |
|:---:|---|:---:|
| **1** | **Shell de escritorio + Top Navbar + Footer de transporte** | **Completado ✅** |
| **2** | **Biblioteca de bloques de audio + Pestañas + Fuente Drag & Drop** | **Completado (Este Sprint) ✅** |
| 3 | Timeline multipista con 3 carriles + regla de tiempo + `dragover`/`drop` | Próximo |
| 4 | Panel de IA + transcripción textual + detección y resaltado de muletillas | Planificado |
| 5 | Playhead móvil + transporte funcional + atajos de teclado (Espacio, J, L, M) | Planificado |
| 6 | Motor de simulación de IA (limpiar audio con animación y notificaciones toast) | Planificado |
| 7 | Pulido final, microinteracciones, Ctrl+Z simulado y defensa de proyecto | Planificado |

---

## 9. Pruebas interactivas desde la consola de desarrollo

Puedes verificar reactividad y contratos abriendo la consola (F12):

```javascript
// 1. Consultar estado global
PodcastCraft.getState();

// 2. Probar filtrado reactivo desde el Store
PodcastCraft.setState({ ui: { libraryFilter: 'music' } }); // Muestra 2 ítems de música
PodcastCraft.setState({ ui: { libraryFilter: 'voice' } }); // Muestra 2 ítems de voz
PodcastCraft.setState({ ui: { libraryFilter: 'all' } });   // Restaura los 8 ítems

// 3. Probar estado vacío de biblioteca
PodcastCraft.setState({ library: [] });                     // Muestra "Tu biblioteca aparecerá aquí"
PodcastCraft.setState({ library: PodcastCraft.MOCK_LIBRARY }); // Restaura los bloques

// 4. Probar selección de tarjeta
PodcastCraft.setState({ selection: { libraryId: 'lib-01' } }); // Selecciona la primera tarjeta
PodcastCraft.setState({ selection: { libraryId: null } });     // Deselecciona
```
