# PodcastCraft AI — Sprint 4 de 7 (Carriles Dinámicos Ilimitados + Import MP3 + Edición de Clips)

Estación de trabajo de audio digital (DAW) y editor de podcasts con asistencia de Inteligencia Artificial (estilo Descript / Adobe Audition), desarrollada como proyecto final para la asignatura **Diseño de Interfaces de Software** en la Universidad Cooperativa de Colombia.

Este repositorio contiene el **Sprint 4 (Carriles Dinámicos Ilimitados 0-N, Importación Restringida a MP3, Selección, Borrado, Recorte por Asas y División de Clips)**, reemplazando la taxonomía fija previa por un modelo profesional de pistas libres.

---

## 📌 Nota de pivote — Sprint 4
- **Fecha de autorización del pivote:** 3 de octubre de 2026.
- **Motivo del cambio de arquitectura:** El sistema de organización por taxonomía fija impuesta (`Voz Principal` / `Música & Intro` / `Anuncios & FX`) de los Sprints 2 y 3 queda **completamente sustituido** por un sistema de **carriles dinámicos e ilimitados (0 a N)** definidos, creados y nombrados libremente por el usuario, replicando el flujo de trabajo estándar en DAWs profesionales como Adobe Audition, Reaper o Pro Tools.
- **Justificación académica (Taller de Interfaces):** Otorga máxima flexibilidad al usuario, permitiendo adaptar la escaleta a cualquier formato de podcast (tertulias con 4 locutores, cuñas múltiples, efectos independientes) en lugar de encasillarlo en tres categorías rígidas.
- **Exclusividad MP3:** La biblioteca acepta de forma estricta archivos `.mp3` (`audio/mpeg`). Intentos de importar otros formatos se rechazan con un mensaje visual no intrusivo y accesible (`aria-live="polite"`).
- **Eliminación total de datos simulados:** Se han suprimido `MOCK_LIBRARY` y `loadSampleLibrary()`. El 100% del audio manejado por la app procede de archivos reales importados por el usuario.
- **Simplificaciones conocidas documentadas:** La confirmación para eliminar un carril que contiene clips utiliza la función nativa del navegador `window.confirm()` como solución directa y robusta; la implementación de un modal desacoplado queda planificada para la fase final de pulido.

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
├── index.html              # Estructura semántica HTML5, anclajes y los IDs contractuales
├── styles.css              # Tokens, paleta de carriles, asas de recorte, animaciones y foco
├── tailwind-config.js      # Configuración de Tailwind Play CDN, colores IA y fuentes
├── app.js                  # Lógica central: carriles dinámicos, importador MP3, trim, split y store
├── vendor/
│   ├── lucide.min.js       # Librería de iconos Lucide v0.383.0 (UMD local)
│   └── tailwind.js         # Script Tailwind CSS Play CDN v3.4.17 (local)
└── README.md               # Documentación, nota de pivote, contrato de IDs y roadmap
```

---

## 3. Capacidades centrales del Sprint 4

### 3.1 Gestión de Carriles Dinámicos (0 a N)
1. **Creación:** Mediante el botón visible `#btn-add-track` en la cabecera del timeline o el botón central del estado vacío general cuando no hay carriles. Cada nuevo carril recibe un nombre autoincremental (`Carril 1`, `Carril 2`...) y un color asignado de la paleta rotativa `TRACK_PALETTE`.
2. **Renombrado in situ:** Doble clic sobre el nombre del carril lo transforma en un `<input>` editable con selección automática de texto. `Enter` o `blur` guarda el cambio; `Escape` cancela. Si se ingresa una cadena vacía, se preserva el nombre original.
3. **Eliminación segura:** Cada carril incluye su botón de papelera (`track-delete-${id}`). Si contiene clips, advierte al usuario con `window.confirm`. Al confirmarse, se eliminan el carril y sus clips, actualizando la duración total y deshabilitando el transporte si el proyecto queda vacío.
4. **Estado vacío general:** Si `tracks.length === 0`, el timeline muestra una vista orientativa con ícono `layers` y botón de llamada a la acción para crear el primer carril.

### 3.2 Importación Exclusiva de MP3
- `<input type="file" id="audio-file-input" accept=".mp3,audio/mpeg" multiple hidden>` activado por el botón `#btn-import-audio` ("Importar MP3").
- Valida estrictamente `file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3')`.
- Archivos no válidos son descartados, desplegando un aviso temporal en `#import-feedback` con `aria-live="polite"`.
- Los audios válidos leen su duración precisa mediante `loadedmetadata` (con fallback de `0` ante `Infinity`) y se muestran en la biblioteca con un estilo visual neutro (slate), sin colores de categoría.

### 3.3 Drag & Drop Agnóstico y Acomodo Automático
- Los audios de la biblioteca pueden soltarse sobre **cualquier carril**.
- Al soltarse, el clip hereda automáticamente la combinación de color y borde de la paleta del carril destino (`TRACK_PALETTE[track.colorIndex]`).
- **Prevención de colisión (acomodo automático):** Si el nuevo clip cae sobre un clip preexistente, su tiempo de inicio (`start`) se desplaza automáticamente justo al final del clip solapado.

### 3.4 Edición de Clips en el Timeline
1. **Selección:** Clic en un clip lo selecciona (borde blanco resaltado y `scale-[1.02]`). Clic en el fondo del timeline deselecciona.
2. **Borrado (`Delete` / `Backspace`):** Pulsa la tecla con un clip seleccionado para removerlo de su pista y recalcular la duración total del proyecto. Cuenta con guardia que ignora la pulsación si el usuario está escribiendo en un campo de texto o renombrando un carril.
3. **Recorte no destructivo (Trim Handles):**
   - Asas laterales (`clip-handle-left` y `clip-handle-right`) con cursor `ew-resize`.
   - Controladas por **Pointer Events**: `pointerdown` captura el puntero, `pointermove` actualiza fluidamente las dimensiones en el DOM sin saturar el store, y `pointerup` aplica una mutación atómica a `state.tracks` recalculando la duración.
   - Restricciones: duración mínima de 1 segundo, el asa izquierda no baja de `0` y ninguna asa puede invadir clips vecinos en el mismo carril.
4. **División de Clips (Split por doble clic):**
   - Doble clic sobre cualquier punto del clip lo divide en dos clips contiguos en ese segundo exacto.
   - Valida que ambas mitades resultantes tengan al menos 1 segundo de duración.
   - Ambas mitades heredan el archivo físico de audio y el color del carril.

---

## 4. Contrato de IDs (Sprint 1 a Sprint 4)

### 4.1 Identificadores Activos
- **Navegación:** `topbar`, `project-title`, `project-status`, `total-duration`, `btn-ai-analysis`, `btn-export`
- **Biblioteca:** `col-library`, `library-count`, `library-list`, `btn-import-audio`, `audio-file-input`, `import-feedback` *(Nuevo S4)*, `lib-card-${item.id}`
- **Línea de tiempo:** `col-timeline`, `zoom-slider`, `zoom-value`, `timeline-ruler`, `timeline-tracks`, `btn-add-track` *(Nuevo S4)*, `btn-empty-add-track` *(Nuevo S4)*, `track-name-${id}` *(Nuevo S4)*, `track-delete-${id}` *(Nuevo S4)*, `timeline-clip-${clip.id}`, clases de asas `.clip-handle-left` y `.clip-handle-right` *(Nuevas S4)*
- **Panel IA:** `col-ai-panel`, `ai-transcript`, `ai-cta`
- **Transporte:** `transport`, `now-playing-name`, `now-playing-meta`, `btn-rewind`, `btn-play`, `btn-forward`, `current-time`, `duration-label`, `btn-mute`, `volume-slider`
- **Guardia de pantalla:** `viewport-warning`

### 4.2 Identificadores Deprecados (Eliminados del DOM en Sprint 4)
- `library-tabs`, `library-tab-all`, `library-tab-music`, `library-tab-voice`, `library-tab-effect`, `library-tab-ad` *(Sustituidos por biblioteca unificada neutra)*
- `timeline-track-voice`, `timeline-track-music`, `timeline-track-fx` *(Sustituidos por carriles dinámicos generados con `data-track-id`)*

---

## 5. Roadmap de desarrollo (7 Sprints)

| Sprint | Título | Estado |
|:---:|---|:---:|
| **1** | **Shell de escritorio + Top Navbar + Footer de transporte** | **Completado ✅** |
| **2** | **Biblioteca de bloques de audio + Pestañas + Fuente Drag & Drop** | **Completado ✅** |
| **3** | **Pivote Local Funcional + Timeline con Drop Zones + Audio Real** | **Completado ✅** |
| **4** | **Carriles Dinámicos Ilimitados + Import MP3 + Edición (Trim/Split/Delete)** | **Completado (Este Sprint) ✅** |
| 5 | Playhead móvil + transporte funcional + atajos de teclado (Espacio, J, L, M) | Planificado |
| 6 | Motor de simulación de IA (limpiar audio con animación y notificaciones toast) | Planificado |
| 7 | Pulido final, microinteracciones, Ctrl+Z simulado y defensa de proyecto | Planificado |

---

## 6. Pruebas interactivas desde la consola de desarrollo

Abre la consola del navegador (F12 o Ctrl+Shift+I):

```javascript
// 1. Consultar estado global (inicia con 0 carriles y 0 audios)
PodcastCraft.getState();

// 2. Crear carriles mediante la API
const track1 = PodcastCraft.createTrack("Voz Invitado");
const track2 = PodcastCraft.createTrack("Cortina Musical");

// 3. Renombrar carril programáticamente
PodcastCraft.renameTrack(track1.id, "Locutor Principal");

// 4. Consultar la paleta cromática disponible
console.table(PodcastCraft.TRACK_PALETTE);

// 5. Eliminar un carril
PodcastCraft.deleteTrack(track2.id);
```
