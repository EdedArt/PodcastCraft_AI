# PodcastCraft AI — Sprint 1 de 7

Estación de trabajo de audio digital (DAW) y editor de podcasts con asistencia de Inteligencia Artificial (estilo Descript / Adobe Audition), desarrollada como proyecto final para la asignatura **Diseño de Interfaces de Software** en la Universidad Cooperativa de Colombia.

Este repositorio contiene el **Sprint 1 (Shell de escritorio, Top Navbar, Footer de transporte, Sistema de diseño y Mini-store central)**, diseñado con estándares de UX/UI profesional y preparado arquitecturalmente para los 6 sprints subsiguientes.

---

## 1. Cómo abrir y ejecutar

### Opción A: Ejecución directa sin internet (Recomendada para evaluación)
Haz doble clic sobre el archivo `index.html` en el explorador de archivos de Windows o ábrelo en cualquier navegador moderno (Google Chrome, Microsoft Edge, Mozilla Firefox).

> **Cero dependencias en tiempo de ejecución:** El proyecto incluye copias locales fijas de **Tailwind CSS v3.4.17** y **Lucide Icons v0.383.0** en la carpeta `vendor/`. La aplicación funciona de manera 100% autónoma y offline.

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
├── index.html              # Estructura semántica HTML5, anclajes y los 30 IDs contractuales
├── styles.css              # Tokens, scrollbars oscuras, .glow-ai, sliders y keyframes
├── tailwind-config.js      # Configuración de Tailwind Play CDN, colores IA y fuentes
├── app.js                  # Lógica central dividida en 7 secciones y mini-store reactivo
├── vendor/
│   ├── lucide.min.js       # Librería de iconos Lucide v0.383.0 (UMD local)
│   └── tailwind.js         # Script Tailwind CSS Play CDN v3.4.17 (local)
└── README.md               # Documentación, decisiones de diseño y roadmap
```

### Orden estricto de carga en `index.html`
1. `vendor/tailwind.js` (Motor de estilos Tailwind v3)
2. `tailwind-config.js` (Tokens, paleta IA, tipografía y sombras)
3. `styles.css` (Reglas CSS personalizadas, cross-browser sliders y animaciones)
4. `vendor/lucide.min.js` (Librería de renderizado de iconos SVG)
5. `app.js` con atributo `defer` (Lógica de estado, eventos y renderizado)

---

## 3. Sistema de diseño ("IA Cyber-Audio")

### 3.1 Paleta de color y tokens
| Rol | Token Tailwind / Hex | Propósito |
|---|---|---|
| **Fondo general** | `slate-950` (`#020617`) | Fondo principal inmersivo tipo suite de escritorio |
| **Paneles / Módulos** | `slate-900` (`#0f172a`) | Fondo de barras superior, inferior y paneles laterales |
| **Bordes y separadores** | `slate-800` (`#1e293b`) | Delimitadores de alta precisión y tarjetas |
| **Pista Voz (Track 1)** | `sky-500` / `sky-900` | Asignada a narración y pistas de voz principal |
| **Pista Música (Track 2)** | `amber-500` / `amber-900` | Asignada a cortinas e intros musicales |
| **Pista Efectos (Track 3)** | `emerald-500` / `emerald-900` | Asignada a remates de audio, FX y publicidad |
| **Acento exclusivo IA** | `violet-500` / `fuchsia-500` | **Regla de oro:** Reservado para IA y estado activo |

### 3.2 Jerarquía de acciones
- **Botón Primario ("Exportar Podcast"):** Fondo claro sólido (`bg-slate-100 text-slate-900`, hover `bg-white`). Cierra el flujo de trabajo principal. No utiliza violeta.
- **Botón Secundario IA ("Análisis de IA"):** Borde violeta, fondo translúcido `violet-500/10`, clase `.glow-ai` e icono `wand-2`.
- **Botones de solo icono:** Estilo "ghost" (`text-slate-400 hover:text-white hover:bg-slate-800`).
- **Botón Play/Pausa:** Círculo violeta de 36px (`bg-violet-600 hover:bg-violet-500`) con sombra y resplandor `.glow-ai`.

### 3.3 Tipografía
- **Fuente principal:** Inter cargada vía `@import` con fallback inmediato a fuentes del sistema operativo (`system-ui, -apple-system, "Segoe UI", sans-serif`) para garantizar renderizado idéntico sin conexión a internet.
- **Tiempos y métricas:** `font-mono tabular-nums` para evitar saltos de ancho durante la reproducción de tiempo.

---

## 4. Arquitectura de `app.js`

El código JavaScript está estructurado en un único archivo dividido en 7 secciones comentadas:

1. **`CONSTANTS`**: Definición de `MIN_VIEWPORT_WIDTH` (1280px), `PROJECT_STATUS` y mapa explícito `TRACK_STYLES` con cadenas literales completas (sin interpolación dinámica).
2. **`STATE`**: Objeto central inmutable en estructura que preserva el contrato para todos los sprints. Incluye la definición comentada de `MOCK_LIBRARY (Sprint 2)`.
3. **`STORE`**: Implementación de mini-store reactivo con `getState()`, `setState(patch)` con mezcla por sección y `subscribe(fn)`. Expuesto en consola global como `window.PodcastCraft`.
4. **`UTILS`**: `formatTime(sec)` (`HH:MM:SS`), `clamp(num, min, max)`, `$()` y `$$()`.
5. **`RENDER`**: Funciones `renderTopbar()`, `renderTransport()`, `renderLibraryCount()`, `renderIcons()` (único punto que llama a `lucide.createIcons()`) y `renderAll()`.
6. **`EVENTS`**: Escuchadores para reproducción, saltos ±5s, volumen, mute, zoom, estado de exportación y guardia de resolución de pantalla.
7. **`INIT`**: Suscripción al store y arranque en `DOMContentLoaded`.

### Prueba interactiva desde la consola del navegador
Puedes inspeccionar y mutar el estado en tiempo real abriendo la consola de DevTools (F12):
```js
// Comprobar estado actual
PodcastCraft.getState();

// Probar mutación reactiva de la biblioteca (actualiza contador)
PodcastCraft.setState({
  library: [
    { id: '1', name: 'Entrevista' },
    { id: '2', name: 'Música Intro' }
  ]
});

// Cambiar el volumen o silenciar
PodcastCraft.setState({ project: { volume: 40, isMuted: false } });

// Alternar reproducción
PodcastCraft.setState({ project: { isPlaying: true } });
```

---

## 5. Decisiones de diseño y técnicas

1. **Aviso conocido en consola sobre Tailwind Play CDN:**
   Tailwind Play CDN emite una advertencia de desarrollo en la consola: *"cdn.tailwindcss.com should not be used in production"*. Esto es un comportamiento normal y esperado de dicha distribución cuando se usa como archivo standalone.
2. **Resplandor unificado `.glow-ai`:**
   Se calibró un valor unificado de sombra tanto en `tailwind-config.js` (`boxShadow['glow-ai']`) como en `styles.css` (`.glow-ai: 0 0 16px 2px rgba(168, 85, 247, 0.25)`) para mantener coherencia cromática y visual idéntica.
3. **Sliders y variable `--range-progress`:**
   Los controles deslizantes de volumen y zoom utilizan la propiedad CSS `--range-progress` inyectada dinámicamente desde JavaScript en el evento `input`/`change`, permitiendo rellenar el progreso en tiempo real con soporte idéntico en WebKit (Chrome, Edge) y Gecko (Firefox).
4. **Footer en flujo normal:**
   El elemento `<footer id="transport">` se ubica al final del contenedor flex principal (`h-full flex flex-col`), prescindiendo de `position: fixed` para evitar solapamientos con el área de trabajo y permitir que los paneles con scroll interno calculen su cota máxima mediante `min-h-0`.

---

## 6. Contrato de IDs (Sprint 1)
Los siguientes 30 identificadores únicos forman el contrato de integración con los siguientes sprints:
- **Navegación:** `topbar`, `project-title`, `project-status`, `total-duration`, `btn-ai-analysis`, `btn-export`
- **Área de trabajo:** `workspace`, `col-library`, `library-tabs`, `library-count`, `library-list`, `col-timeline`, `zoom-slider`, `zoom-value`, `timeline-ruler`, `timeline-tracks`, `col-ai-panel`, `ai-transcript`, `ai-cta`
- **Transporte:** `transport`, `now-playing-name`, `now-playing-meta`, `btn-rewind`, `btn-play`, `btn-forward`, `current-time`, `duration-label`, `btn-mute`, `volume-slider`
- **Guardia de pantalla:** `viewport-warning`

---

## 7. Roadmap de desarrollo (7 Sprints)

| Sprint | Título | Estado |
|:---:|---|:---:|
| **1** | **Shell de escritorio + Top Navbar + Footer de transporte** | **Completado (Este Sprint)** |
| 2 | Biblioteca de bloques de audio + Drag & Drop base (`dragstart`) | Próximo |
| 3 | Timeline multipista con 3 carriles + regla de tiempo + `dragover`/`drop` | Planificado |
| 4 | Panel de IA + transcripción textual + detección y resaltado de muletillas | Planificado |
| 5 | Playhead móvil + transporte funcional + atajos de teclado (Espacio, J, L, M) | Planificado |
| 6 | Motor de simulación de IA (limpiar audio con animación y notificaciones toast) | Planificado |
| 7 | Pulido final, microinteracciones, Ctrl+Z simulado y defensa de proyecto | Planificado |
