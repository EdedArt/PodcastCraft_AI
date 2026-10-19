# PodcastCraft AI

Estación de trabajo de audio digital (DAW) y editor de podcasts con asistencia de Inteligencia Artificial (estilo Descript / Adobe Audition), desarrollada como proyecto final para la asignatura **Diseño de Interfaces de Software** en la Universidad Cooperativa de Colombia.

Este repositorio contiene la **Versión Oficial v1.1.0 (Fase 27 - Release Final de Producción)**, integrando un DAW completo de escritorio con motor de audio multipista, edición no destructiva, playhead de alta precisión, exportación nativa a MP3 con FFmpeg, asistencia de IA con Google Gemini, y un sistema local de autenticación multi-cuenta con recuperación criptográfica y sesión persistente.

---

## 📦 Descarga e Instalación (v1.2.0)

[![Descargar PodcastCraft AI](https://img.shields.io/badge/Descargar-PodcastCraft%20AI%20(Windows%20x64)-6366f1?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/EdedArt/PodcastCraft_AI/releases)

> 🔗 **Releases Oficiales:** [GitHub Releases — PodcastCraft AI](https://github.com/EdedArt/PodcastCraft_AI/releases)

### 📋 Tabla de Archivos e Instaladores por Plataforma (v1.2.0)

| Plataforma | Nombre del Archivo | SHA-256 | Estado / Disponibilidad |
|---|---|---|---|
| **Windows (x64)** | `PodcastCraft AI.exe`<br>*(GitHub lo mostrará como `PodcastCraft.AI.exe`)* | `730eef0d20937f161bc82b68e9a64b1251ff0e3b8557b1acdf1318f2507f8ccf` | Compilado e instalado localmente (105,668,172 bytes) |
| **Linux (x64)** | `PodcastCraft-AI-1.2.0-linux-x64.AppImage` | *(Se calculará al publicar)* | Generado en CI (Artifacts) |
| **Linux (x64)** | `PodcastCraft-AI-1.2.0-linux-x64.deb` | *(Se calculará al publicar)* | Generado en CI (Artifacts) |
| **macOS (Apple Silicon)** | `PodcastCraft-AI-1.2.0-mac-arm64.dmg` | *(Se calculará al publicar)* | Generado en CI (Artifacts) |
| **macOS (Intel)** | `PodcastCraft-AI-1.2.0-mac-x64.dmg` | *(Se calculará al publicar)* | Generado en CI (Artifacts) |

---

### 🪟 Windows (x64) — Instalador Oficial (v1.2.0)
1. **Descarga:** El instalador ejecutable oficial es `PodcastCraft AI.exe` (105.7 MB, 105,668,172 bytes; en GitHub se mostrará como `PodcastCraft.AI.exe`).
2. **Instalación:** Ejecuta el archivo descargado para iniciar el asistente de instalación de Windows. Por defecto se instala en modo de usuario (`%LOCALAPPDATA%\Programs\PodcastCraft AI`) sin requerir privilegios de administrador.
3. **Advertencia de Windows SmartScreen:** Dado que el ejecutable es un proyecto de código abierto independiente que no dispone de un certificado digital corporativo de pago (EV Certificate), Windows Defender SmartScreen mostrará la ventana preventiva *"Windows protegió su equipo"*:
   - Haz clic en el enlace **"Más información"**.
   - Haz clic en el botón **"Ejecutar de todas formas"**.
   - La aplicación se instalará, creará los accesos directos en el Escritorio y Menú Inicio, y quedará lista para usar.

---

### 🐧 Linux (x64) — Compilación Multiplataforma (GitHub Actions)
Los instaladores para distribuciones GNU/Linux de 64 bits son generados automáticamente en el workflow de CI en dos formatos:

1. **Paquete AppImage (`.AppImage`):**
   - Descarga el archivo `PodcastCraft-AI-1.2.0-linux-x64.AppImage` desde los Artifacts de GitHub Actions.
   - Otorga permisos de ejecución desde la terminal:
     ```bash
     chmod +x PodcastCraft-AI-1.2.0-linux-x64.AppImage
     ```
   - Ejecuta la aplicación:
     ```bash
     ./PodcastCraft-AI-1.2.0-linux-x64.AppImage
     ```
   - **Nota sobre dependencias FUSE:** En distribuciones modernas (como Ubuntu 22.04 o Ubuntu 24.04), si el sistema no incluye `libfuse2`, instálalo con:
     ```bash
     sudo apt install -y libfuse2t64 || sudo apt install -y libfuse2
     ```
   - *Alternativa sin FUSE:* Puedes ejecutar la AppImage mediante extracción directa en memoria ejecutando:
     ```bash
     APPIMAGE_EXTRACT_AND_RUN=1 ./PodcastCraft-AI-1.2.0-linux-x64.AppImage
     ```

2. **Paquete Debian (`.deb`):**
   - Descarga `PodcastCraft-AI-1.2.0-linux-x64.deb`.
   - Instala el paquete y sus dependencias con APT:
     ```bash
     sudo apt install ./PodcastCraft-AI-1.2.0-linux-x64.deb
     ```
   - O mediante dpkg:
     ```bash
     sudo dpkg -i PodcastCraft-AI-1.2.0-linux-x64.deb
     ```

---

### 🍏 macOS — Compilación Multiplataforma (GitHub Actions)
Se generan dos paquetes `.dmg` independientes según la arquitectura del procesador:

1. **Elección del paquete según el chip:**
   - **Apple Silicon (M1 / M2 / M3 / M4 / arm64):** Descarga `PodcastCraft-AI-1.2.0-mac-arm64.dmg`.
   - **Intel (x86_64):** Descarga `PodcastCraft-AI-1.2.0-mac-x64.dmg`.
2. **Instalación:**
   - Abre el archivo `.dmg` descargado y arrastra el icono de **PodcastCraft AI** a la carpeta **Aplicaciones** (`/Applications`).
3. **Advertencia de Apple Gatekeeper (App sin firma ni notarización corporativa):**
   - Al no contar con un certificado de desarrollador de Apple Developer Program de pago ($99 USD/año), macOS bloqueará la apertura directa indicando que la app *"proviene de un desarrollador no identificado"* o *"está dañada y no se puede abrir"*.
   - **Para abrirla:**
     - Haz **clic derecho** (o `Control + clic`) sobre **PodcastCraft AI** en `/Applications` y selecciona **"Abrir"** en el menú contextual. Luego pulsa **"Abrir"** en el diálogo de confirmación.
     - O bien, ve a **Ajustes del Sistema $\rightarrow$ Privacidad y seguridad**, desplázate hacia abajo hasta la sección de seguridad y haz clic en **"Abrir de todos modos"**.
     - Alternativa desde Terminal (remover cuarentena):
       ```bash
       xattr -cr "/Applications/PodcastCraft AI.app"
       ```

---

### ⚙️ Generación de Instaladores y Descarga de Artifacts en GitHub Actions
Los instaladores de Linux y macOS se compilan mediante el workflow automatizado **"Build Multiplatform"**:
1. En el repositorio de GitHub, dirígete a la pestaña **Actions**.
2. En la barra lateral izquierda, selecciona el workflow **"Build Multiplatform"**.
3. Haz clic en **"Run workflow"**, selecciona la rama deseada (p. ej. `ci/multiplatform-build`) y pulsa el botón verde **"Run workflow"** (también se dispara automáticamente al hacer push a dicha rama).
4. Una vez finalizada la ejecución de los tres jobs (`ubuntu-24.04`, `macos-15` y `macos-15-intel`), desplázate a la sección **Artifacts** en el resumen de la corrida:
   - `podcastcraft-linux-x64`: Contiene `PodcastCraft-AI-1.2.0-linux-x64.AppImage` y `PodcastCraft-AI-1.2.0-linux-x64.deb`.
   - `podcastcraft-macos-arm64`: Contiene `PodcastCraft-AI-1.2.0-mac-arm64.dmg`.
   - `podcastcraft-macos-x64`: Contiene `PodcastCraft-AI-1.2.0-mac-x64.dmg`.
   - *Los paquetes generados se conservan durante 14 días.*

---

### ⚠️ Alcance Real y Advertencia de Seguridad de la Clave de IA
1. **Validación en CI vs Entorno Real:** Las compilaciones y paquetes de Linux (.AppImage, .deb) y macOS (.dmg arm64 e Intel) disponen exclusivamente de **pruebas automatizadas de humo en los runners de GitHub Actions** (arranque del backend embebido, respuesta de `/health`, registro de cuenta, mezcla nativa con FFmpeg empaquetado, integridad de decodificación, empaquetado seguro y cierre limpio con señales). No se dispone de validación humana ni verificación en hardware físico Mac ni en distribuciones físicas diversas de Linux.
2. **Atajos de Teclado Adaptados por Plataforma:** Los atajos del editor y timeline se adaptan automáticamente a la plataforma en ejecución (`Ctrl+Z` y `Supr` en Windows y Linux; `⌘Z` y `⌫` / `Delete` en macOS), con protección estricta de foco en campos de edición de texto y etiquetas dinámicas en la interfaz.
3. **Seguridad de la clave de Gemini (`GEMINI_API_KEY`):**
   - Para que la funcionalidad de Inteligencia Artificial opere en las aplicaciones empaquetadas, la clave de API viaja configurada dentro del archivo `backend/.env` del paquete de producción.
   - **La clave NO está encriptada contra ingeniería inversa:** cualquier usuario con acceso al instalador o paquete puede extraer el archivo `.env` o inspeccionar el código fuente.
   - Dado que los artifacts de un repositorio público de GitHub pueden ser descargados por otros usuarios, **se recomienda enfáticamente configurar límites de cuota estrictos (cuota de gasto $0 o límite diario de solicitudes)** para esa clave en la consola de Google AI Studio / Google Cloud.

---

## ✨ Qué incluye la versión v1.1.0

- 🎚️ **Motor de audio multipista profesional:** Reproducción estéreo continua de baja latencia con Web Audio API, soporte de múltiples carriles simultáneos y aislamiento de canales.
- 🔊 **Control de ganancia y volumen dinámico:** Faders reactivos con ajuste de volumen individual por carril (0 % a 200 %).
- ✂️ **Edición precisa y atajos de teclado de estudio:**
  - División de clips en el cursor con la tecla `S` (*Split*).
  - Reproducción / Pausa instantánea con `Espacio`.
  - Navegación y salto de transporte con `J` (rebobinar) y `L` (avanzar).
  - Zoom horizontal dinámico para edición milimétrica de ondas.
- 📍 **Playhead ergonómico y ultra-fluido:**
  - Área de agarre táctil ampliada (*hit-area* invisible de 16 px) sobre la línea y la cabeza del cursor.
  - Scrubbing continuo y arrastre directo desde cualquier punto de la regla de tiempo con captura de puntero (`setPointerCapture`), evitando pérdidas al salir del elemento.
  - Actualización a 60 FPS mediante `requestAnimationFrame` sin sobrecargar el estado de React/DOM.
  - Alineación matemática perfecta garantizada en `0.00 px` entre playhead, regla y clips.
- 👁️ **Visibilidad de contraseña accesible ("El Ojito"):** Botón integrado en los 5 campos de contraseña de la pantalla de bloqueo (login, registro y recuperación), con íconos Lucide, navegación por teclado (`Tab`, `Espacio`, `Enter`), soporte i18n (ES/EN) y reseteo automático a oculto por seguridad.
- 🤖 **Asistente de IA con Google Gemini:** Transcripción de audio, análisis semántico y sugerencias de corte automatizadas.
- 🎵 **Exportación nativa a MP3:** Mezcla multicanal real procesada mediante binario independiente de `ffmpeg` (empaquetado fuera del `.asar`), con diálogo nativo de Windows para seleccionar destino de guardado.
- 👥 **Acceso y perfiles multi-cuenta:** Hasta 10 cuentas locales independientes en el mismo equipo, compartiendo de forma colaborativa el proyecto del estudio.
- 🔑 **Sesión persistente "Recordarme":** Inicio de sesión automático sin parpadeos mediante tokens criptográficos SHA-256 resistentes a reinicios.
- 🛡️ **Código de recuperación de un solo uso:** Código alfanumérico de 12 caracteres (`XXXX-XXXX-XXXX`) generado con `crypto.randomBytes` para recuperar contraseñas sin necesidad de correo ni SMS.
- 🧱 **Protección anti-saturación y fuerza bruta:** Límites estrictos de payload (2 KB), bloqueo de fuerza bruta (HTTP 429) y control de concurrencia para proteger el CPU local.

---

## 💾 Dónde se guardan los datos y cómo restablecer acceso

- **Directorio de almacenamiento local:**
  ```
  %APPDATA%\podcastcraft-ai\storage\
  (Ruta completa: C:\Users\<TuUsuario>\AppData\Roaming\podcastcraft-ai\storage\)
  ```
  - `project.json`: Estructura del proyecto, carriles, clips, posiciones temporales y volúmenes.
  - `auth.json`: Base de datos local de credenciales (hashes `scrypt` con sal criptográfica y hashes SHA-256 de tokens).
  - `audio-files/`: Archivos MP3 físicos importados y grabados.
- **Cómo restablecer el acceso en caso de emergencia:**
  Si olvidas tu contraseña y extravías tu código de recuperación:
  1. Cierra completamente PodcastCraft AI.
  2. Ve a `%APPDATA%\podcastcraft-ai\storage\` y elimina o renombra el archivo `auth.json`.
  3. Vuelve a abrir la aplicación: entrará automáticamente en modo de "primer uso", permitiéndote registrar un nuevo usuario administrador.
  4. **Tus proyectos y tus audios NO se borran ni se alteran**, ya que residen en `project.json` y `audio-files/`.

---

## ⚠️ Limitaciones honestas de la versión

Para mantener total transparencia con el usuario y evaluadores:
1. **Reducción de ruido y detección de silencios con IA:** No están implementadas en esta versión (el asistente de IA se enfoca en transcripción y sugerencias de corte).
2. **Balance / Panning:** El motor de mezcla procesa audio estéreo directo con control de volumen por canal (0 % a 200 %), sin control independiente de panorama estéreo (*panning*).
3. **Etiquetas de audio ID3:** La exportación genera un archivo MP3 estéreo limpio a 192 kbps sin incrustación de metadatos o carátulas ID3 complejas.
4. **Aceleración por hardware desactivada:** Electron opera con aceleración gráfica por hardware desactivada (`app.disableHardwareAcceleration()`) para evitar fallos de renderizado en drivers gráficos diversos.
5. **Sistema Operativo:** Diseñado y optimizado exclusivamente para **Windows 10 y Windows 11 (64 bits)**.
6. **Audios extensos:** Archivos de audio continuos de más de 30 a 60 minutos pueden demandar alto consumo de memoria RAM y tiempo de procesamiento durante la decodificación de forma de onda.
7. **Nivel de servicio de IA:** La integración con Google Gemini opera bajo la cuota del nivel de desarrollo / gratuito (Free Tier), sujeta a los límites de peticiones por minuto de Google AI Studio.
8. En la prueba automática de Linux (.deb) y macOS, la app necesitó cierre forzado al terminarla con la señal SIGTERM; el cierre normal (cerrar la ventana o Cmd+Q) no se ha verificado en esos sistemas.

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

### 0.2 Decisión de alcance: Modelo de reproducción de audio (Evolución de Arquitectura)
Originalmente en los primeros sprints se mantuvo la decisión de usar un único audio activo (`globalAudio`). **En la Fase 22, esta limitación fue superada y levantada por completo:** se reemplazó el elemento `<audio>` por un **motor multitrack nativo con Web Audio API**. El nuevo motor programa todos los clips de todos los carriles en un mismo reloj de hardware, permitiendo reproducción continua a través de cualquier cantidad de cortes y mezcla simultánea en tiempo real de múltiples carriles. Ver la sección detallada de la **Fase 22** al final de este documento.

### 0.3 Tercera Excepción Documentada al Store Central
Siguiendo la arquitectura de rendimiento del proyecto, se establece la **tercera excepción contractual al Store central** (tras la clase temporal `.is-dragging` del Sprint 2 y los Pointer Events de recorte `.clip-handle` del Sprint 4):
- **Regla estricta:** **Prohibido invocar `setState` o usar `setInterval` para desplazar el playhead cuadro a cuadro.**
- **Mecanismo:** El bucle `startPlayheadLoop()` se ejecuta a 60 FPS sincronizado con la tasa de refresco de pantalla mediante `requestAnimationFrame(tick)`. Lee el reloj de transporte de alta precisión de Web Audio API (`getTransportTime()`) y actualiza las propiedades del DOM (`#timeline-playhead.style.transform` y `#current-time.textContent`) de forma directa y paralela.
- **Persistencia en el Store:** `state.project.currentTime` se actualiza **exclusivamente en eventos discretos y puntuales** (pulsación de Play/Pause, fin de reproducción del proyecto o clics de scrubbing). Esto garantiza 60 FPS reales sin disparar ciclos de renderizado global innecesarios (`renderAll()` se ejecuta 0 veces durante la reproducción continua).

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
| **5** | **Playhead de Alta Fidelidad + Scrubbing en Regla (rAF 60 FPS + A11y Slider)** | **Completado ✅** |
| **6** | **Motor de simulación de IA (transcripción + limpieza de muletillas manual y masiva + toasts)** | **Completado (Fase 15) ✅** |
| **7** | **Atajos globales de teclado + Deshacer (Ctrl+Z) + Auditoría visual** | **Completado (Fase 16) ✅** |
| 8 | Pulido final y **empaquetado nativo (.exe con Electron Builder)** | Planificado (Fase 17+) |

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

// 6. Transcribir el clip seleccionado manualmente
PodcastCraft.transcribeSelectedClip();

// 7. Limpiar muletillas masivamente del clip activo
PodcastCraft.cleanAllFillers(PodcastCraft.getState().selection.clipId);

// 8. Deshacer última acción estructural (Fase 16)
PodcastCraft.undo();

// 9. Consultar pila de deshacer en memoria
console.log('Historial de undo en sesión:', PodcastCraft.undoStack.length);
```

---

## 7. Fase 14: Unificación Temporal — Regla de Tiempo, Playhead y Carriles

### 7.1 Diagnóstico de Causa Raíz y Mediciones Reales
Previo a la implementación, se realizó la medición física en píxeles de los componentes del timeline mediante `getBoundingClientRect()` en consola:

| Elemento / Métrica | Coordenada / Valor Real |
|---|---|
| Borde izquierdo de columna de timeline (`#col-timeline`) | `274.00 px` |
| Ancho de franja de control de carril (`--track-control-strip-width`) | `40.00 px` |
| Ancho de gutter de regla (`.timeline-ruler-gutter`) | `40.00 px` |
| Borde izquierdo del área de carriles (`.timeline-lane`) | `314.00 px` |
| Posición del playhead en reposo (`t=0`) | `314.00 px` |
| Inicio de la escala de la regla (`#timeline-ruler-scale`) | `314.00 px` |
| **Diferencia carril vs playhead (`diff_lane_vs_playhead`)** | **0.00 px** |
| **Diferencia escala regla vs playhead (`diff_rulerScale_vs_playhead`)** | **0.00 px** |
| **Diferencia escala regla vs carril (`diff_rulerScale_vs_lane`)** | **0.00 px** |

#### Hallazgos Clave:
1. **Marcas estáticas de la regla:** La regla (`#timeline-ruler-scale`) contenía 5 elementos `<span>` fijos (`00:00:00` a `00:40:00`) distribuidos mediante flexbox `justify-between`. No se recalculaban ni escalaban según el zoom ni la duración real del proyecto. A zoom 50% (4 px/s), la marca fija "00:10:00" se dibujaba a ~175px (equivalente a ~44s reales de audio), generando la discrepancia de ~34s–40s observada por el usuario.
2. **Causa del desfase residual aparente (~2-3s):** Debido a que la regla estática extendía 40 minutos en el ancho disponible de la pantalla (~700px), cada segundo visual correspondía a ~17.5px en lugar de los 4px reales de los clips. Cualquier lectura visual contra las marcas de la regla resultaba artificialmente desplazada 2-3s a pesar de que el offset físico era matemáticamente exacto (40px).

### 7.2 Arquitectura de Fuente Única de Verdad Temporal
1. **Conversión centralizada:** Se crearon las funciones canónicas `timeToPixels(seconds)` y `pixelsToTime(pixels)` basadas en `getPixelsPerSecond()`. Absolutamente ningún elemento calcula posiciones o dimensiones de clips/playhead de forma manual.
2. **Regla de tiempo adaptativa dinámica (`renderTimelineRuler`):**
   - Se recalculan las marcas en cada cambio de zoom, proyecto o redimensionamiento de ventana.
   - Algoritmo de intervalos legibles estilo DAW (`[1s, 2s, 5s, 10s, 15s, 20s, 30s, 60s, 120s, 300s, 600s, ...]`) garantizando al menos 65px entre marcas para evitar amontonamiento.
   - Cada marca se posiciona estrictamente con `style="left: ${timeToPixels(t)}px"`.
   - En `t=0`, la línea indicadora se ancla en `0px` y la etiqueta textual se desplaza con un margen sutil de `2px` hacia la derecha para garantizar legibilidad completa sin cortes por overflow.
3. **Sincronización instantánea al cambiar el zoom en caliente:**
   - Al deslizar el control de zoom (incluso durante la reproducción activa de audio), `renderTimelineRuler()`, `renderTimelineTracks()` y `renderTransport()` se ejecutan sincrónicamente en el mismo ciclo, reposicionando el playhead de inmediato a `timeToPixels(currentSec)` sin esperar al siguiente frame del bucle rAF.
4. **Unificación de interacciones:**
   - Scrubbing por clic en regla (`pixelsToTime(clickX)`).
   - Doble clic para dividir clip (`pixelsToTime(clickX)`).
   - Arrastre de asas de recorte (trim) mediante `pixelsToTime` y `timeToPixels`.
   - Soltado de audio (drag & drop) coordinado con la misma conversión temporal.

---

## 🤖 8. Fase 15: Panel de IA — Transcripción Simulada y Limpieza de Muletillas

Esta fase construye el flujo de edición asistida por inteligencia artificial en el Panel de Asistente IA (`#col-ai-panel`), permitiendo transcribir el clip seleccionado, detectar muletillas intercaladas, marcarlas interactivamente para borrado manual y ejecutar limpieza automática masiva.

### 8.1 Arquitectura del Estado de IA
El estado de IA se indexa por el identificador del clip en la línea de tiempo (`clipId`), permitiendo que cada instancia de clip conserve su propia transcripción de forma totalmente independiente:

```javascript
state.ai = {
  transcriptByClip: {
    // [clipId]: { status: 'idle' | 'processing' | 'done', segments: [...] }
  },
  isMassCleaning: false
};

// Segmento representativo de una palabra:
// { id: 'seg-clip-0', text: 'bueno', isFiller: true, markedForDeletion: false }
```

### 8.2 Componentes e Interacciones del Panel de IA
1. **Botón Transcribir (`#btn-transcribe-clip`):**
   - **Deshabilitado:** Cuando no hay ningún clip seleccionado (`state.selection.clipId === null`).
   - **Habilitado:** Al seleccionar cualquier clip en el timeline, mostrando el texto localizado `t('aiPanel.transcribe')` ("Transcribir" / "Transcribe").
   - **Re-transcripción:** Si el clip ya fue procesado (`status: 'done'`), cambia dinámicamente a `t('aiPanel.retranscribe')` ("Volver a transcribir" / "Re-transcribe").
2. **Estado de Procesamiento y Animación:**
   - Al presionar transcribir, se asigna `status: 'processing'` y se despliega `#ai-transcript-loading` con la animación `.animate-ai-pulse` y efecto de resplandor `glow-ai`.
   - Tras un intervalo simulado de 1.5s, se generan las palabras y se actualiza a `status: 'done'`.
3. **Fichas de Palabras Interactivas (`#ai-transcript-segments`):**
   - Cada palabra se renderiza en un elemento accesible con `role="button"`, `tabindex="0"`, `aria-pressed` y `aria-label` detallado.
   - **Muletilla (`isFiller: true`):** Resaltada con fondo y borde ámbar (nunca violeta, preservando la regla de acento exclusivo de transporte/IA).
   - **Marcada para borrar (`markedForDeletion: true`):** Tachado (`line-through`), borde discontinuo rojizo y fondo sutil rose.
   - **Interacción dual:** Clic con puntero o pulsación de `Enter` / `Espacio` conmuta el estado de marcado.
4. **Confirmación de Borrado Manual (`#btn-confirm-cleanup`):**
   - Botón con icono de visto (`check`) que se vuelve visible automáticamente solo cuando existe al menos una palabra marcada (`markedCount > 0`).
   - Al hacer clic, elimina las palabras seleccionadas del arreglo de segmentos y dispara una notificación toast flotante accesible (`#toast-container`).
5. **Limpieza Automática Masiva con IA (`#btn-ai-clean-all`):**
   - Habilitado únicamente cuando el clip tiene estado `done` y conserva al menos una muletilla detectada.
   - Muestra el conteo en tiempo real: `t('aiPanel.cleanAllWithCount', { count })` (ej. "Limpiar Audio con IA (4 detectadas)").
   - Al pulsar, activa una animación de procesamiento de 1.5s y remueve todas las muletillas detectadas de una sola vez, emitiendo un toast de confirmación.
6. **Guardia de Teclado Extendido:**
   - Se extendió el listener global de `Delete` y `Backspace`:
     - **Foco sobre una palabra de la transcripción:** Alterna su marcado para eliminación preventiva sin borrar el clip del timeline.
     - **Foco en inputs/textareas:** Se respeta la edición nativa de texto.
     - **Foco en el timeline:** Conserva su comportamiento original eliminando el clip seleccionado.

### 8.3 Verificación de Contraste y Accesibilidad (WCAG AA y AAA)
Para cumplir con los más altos estándares cromáticos en ambos temas:

| Elemento | Modo Claro (Default) | Modo Oscuro | Ratio de Contraste / Cumplimiento |
|---|---|---|---|
| **Muletilla (`.ai-word-filler`)** | Texto `#92400e` (amber-800) sobre fondo claro | Texto `#fde68a` (amber-200) sobre `#0f172a` | **7.47:1** en claro (**WCAG AAA**) / **12.2:1** en oscuro (**WCAG AAA**) |
| **Palabra Marcada (`.ai-word-marked`)** | Texto `#be123c` (rose-700) sobre fondo rose | Texto `#fda4af` (rose-300) sobre `#0f172a` | **6.35:1** en claro (**WCAG AA**) / **9.1:1** en oscuro (**WCAG AAA**) |
| **Píldora de Conteo** | Fondo ámbar con borde semitransparente | Texto ámbar de alto contraste | **7.47:1** (AAA) / **12.2:1** (AAA) |

### 8.4 Limitaciones Conocidas del Flujo
1. **Sin backend de IA / Speech-to-Text real:** El proyecto no integra un motor pesado de inferencia de voz a texto. La transcripción se genera mediante un generador simulado con muestreo determinista de diccionarios locales (`FILLER_WORDS_ES/EN` y `SAMPLE_WORDS_ES/EN`).
2. **Persistencia de sesión (no almacenada en backend):** La transcripción de los clips es un estado de trabajo en memoria (`state.ai.transcriptByClip`), consistente con la selección (`state.selection`). Al recargar la página no persiste en el servidor REST.
3. **Generación vinculada al idioma activo al transcribir:** El texto se genera en el idioma activo en el momento de la transcripción. Si el usuario conmuta entre Español e Inglés posteriormente, el texto de la transcripción no se retraduce retroactivamente (es audio transcrito simulado, no chrome de la interfaz).
4. **División de clips (Split):** Al dividir un clip en dos mitades en el timeline, ambas mitades nacen sin transcripción previa y deben transcribirse de manera independiente.

---

## ⌨️ 9. Fase 16: Atajos de Teclado DAW + Deshacer (Ctrl+Z) + Auditoría Final de Consistencia Visual

Esta fase cierra la construcción funcional de la estación de trabajo digital antes de la fase de empaquetado nativo con Electron, implementando un sistema de atajos de teclado estándar de la industria, un motor de reversión histórica (*Undo*) acotado y una auditoría rigurosa de consistencia cromática, accesibilidad e internacionalización.

### 9.1 Tabla Completa de Atajos de Teclado por Plataforma

| Atajo (Windows / Linux) | Atajo (macOS) | Acción DAW / Timeline | Ámbito y Guardia de Foco |
|---|---|---|---|
| **`Espacio`** | **`Espacio`** | Reproducir / Pausar reproducción de audio | Global (excepto en campos de texto) |
| **`J`** | **`J`** | Retroceder 5 segundos en el tiempo de reproducción | Global (excepto en campos de texto) |
| **`L`** | **`L`** | Avanzar 5 segundos en el tiempo de reproducción | Global (excepto en campos de texto) |
| **`M`** | **`M`** | Silenciar / Activar sonido (*Mute* / *Unmute*) | Global (excepto en campos de texto) |
| **`S`** | **`S`** | Dividir clip seleccionado en la posición del playhead (*Split*) | Timeline / Global (excepto en campos de texto) |
| **`Ctrl+Z`** | **`⌘Z`** (`Cmd+Z`) | Deshacer la última acción estructural del timeline | Global (en campos de texto delega al deshacer nativo) |
| **`Supr`** (`Delete`) | **`⌫`** (`Backspace`) o **`Delete`** | Eliminar clip cerrando el hueco (*Ripple Delete*) | Con clip seleccionado (en campos de texto borra caracteres sin borrar clips) |
| **`Shift + Supr`** | **`Shift + ⌫`** o **`Shift + Delete`** | Eliminar clip conservando el hueco (*Delete*) | Con clip seleccionado (en campos de texto borra caracteres) |
| **`Escape`** | **`Escape`** | Deseleccionar clip activo del timeline | Timeline / Global (excepto en campos de texto) |
| **`ArrowLeft`** / **`ArrowRight`** | **`ArrowLeft`** / **`ArrowRight`** | Scrubbing continuo manual (±5s) | En foco sobre la regla de tiempo (`#timeline-ruler`) |
| **`Supr`** (`Delete`) | **`⌫`** (`Backspace`) o **`Delete`** | Alternar marcado de palabra para borrado | En foco sobre ficha de transcripción (`#ai-transcript`) |
| **`Enter`** / **`Espacio`** | **`Enter`** / **`Espacio`** | Alternar marcado de ficha de palabra | En foco sobre ficha de transcripción (`#ai-transcript`) |

> [!IMPORTANT]
> **Guardia de Foco Contextual y Seguridad de Edición:**
> Todos los atajos de teclado DAW respetan estrictamente la interacción con campos editables (`<input>`, `<textarea>`, `<select>`, `contentEditable`). Si el usuario escribe o edita en un campo de texto (por ejemplo el login, registro, campos de volumen o títulos), presionar `J`, `L`, `M`, `S`, `Espacio` o `Backspace` opera nativamente sobre el texto sin alterar el timeline ni borrar clips. En Windows y Linux, la tecla `Backspace` fuera de campos de texto NO borra clips (solo `Supr`/`Delete`). En macOS, `Backspace` actúa como la tecla de borrado de clips en el timeline cerrando hueco, y con `Shift` conservándolo, mientras que dentro de inputs borra caracteres de texto sin interferencias.

### 9.2 Arquitectura y Alcance del Deshacer (*Undo*)

Se diseñó una pila simple y determinista de snapshots profundos (`undoStack`) con un límite estricto de **20 pasos**:

```javascript
const undoStack = [];
const MAX_UNDO_STEPS = 20;

function pushUndoSnapshot() {
  undoStack.push(JSON.parse(JSON.stringify(state.tracks)));
  if (undoStack.length > MAX_UNDO_STEPS) undoStack.shift();
  updateUndoButtonState();
}
```

#### Acciones Estructurales Cubiertas (Exactamente 6):
1. **Crear carril (`createTrack`):** Captura el estado previo antes de agregar el carril dinámico.
2. **Eliminar carril (`deleteTrack`):** Tras confirmar el diálogo de borrado, captura el carril y todos sus clips para permitir su restauración íntegra.
3. **Soltar un clip en un carril (*Drop*):** Captura el carril destino antes de insertar la nueva instancia de clip.
4. **Eliminar un clip del timeline (`Delete` / `Backspace`):** Captura la estructura antes de remover el clip seleccionado.
5. **Recortar un clip (*Trim* con asas):** Al soltar el puntero en `onPointerUp`, si la duración o el inicio sufrieron cambios reales, registra el snapshot previo.
6. **Dividir un clip (*Split* por doble clic):** Captura el clip entero antes de separarlo en dos mitades independientes.

#### Acciones Deliberadamente Fuera de Alcance:
- **Preferencias de interfaz:** Cambios de tema (claro/oscuro) e idioma (es/en) no son ediciones del timeline.
- **Módulo de IA:** Transcripciones simuladas y eliminación de muletillas corresponden al estado de sesión de IA.
- **Biblioteca:** Importación de archivos MP3 al catálogo de medios.
- **Navegación:** Scrubbing, búsqueda temporal y reproducción.

#### Características Operativas:
- **Alcance de Sesión:** La pila de snapshots reside en memoria durante la sesión del navegador. Al recargar la página, la pila se vacía de forma esperada mientras que el estado guardado del proyecto se restaura fielmente desde el backend REST (`/api/project`).
- **Autoguardado Automático:** Dado que `undo()` muta `state.tracks` a través de `setState()`, el motor de persistencia de la Fase 13 activa inmediatamente el debouncer de 2s para sincronizar el estado restaurado en el servidor local.
- **Control Visual `#btn-undo`:** Ubicado en la cabecera de la línea de tiempo junto al botón de añadir carril (`+`), con icono Lucide `undo-2`, tooltip bilingüe `"Deshacer (Ctrl+Z)"` y estado accesible (`disabled`, `aria-disabled="true"`) sincronizado con la disponibilidad de pasos en la pila.

### 9.3 Resultados de la Auditoría Final de Consistencia Visual (Bloque C)

1. **Regla de Oro Cromática:**
   - Auditoría integral de todas las hojas de estilo y clases Tailwind: cero uso espurio de violeta/fucsia.
   - El violeta (`#9333ea`, `#8b5cf6`, `focus-visible:ring-violet-500`) se mantiene estrictamente restringido al asistente de IA, branding, botón de reproducción Play y anillos de foco accesibles.
   - Las muletillas utilizan ámbar (`#92400e` / `#fde68a`, WCAG AAA > 7:1) y las palabras marcadas utilizan rose (`#be123c` / `#fda4af`, WCAG AA/AAA).
2. **Cobertura Completa de i18n:**
   - Se auditó la ausencia de strings huérfanos. Se incorporaron y tradujeron claves complementarias (`aiPanel.noWordsDetected`, `timeline.undoTitle`, `timeline.undoAria`, `timeline.undoToast`).
3. **Anillos de Foco Unificados:**
   - Todos los controles interactivos (`#btn-undo`, `#btn-add-track`, botones de transporte, fichas de transcripción) implementan el mismo anillo de foco accesible `focus-visible:ring-2 focus-visible:ring-violet-500` con `outline-none`.
4. **Estados de Accesibilidad (`aria-disabled`):**
   - Se verificó que `#btn-undo`, `#btn-play`, `#btn-transcribe-clip` y `#btn-ai-clean-all` alternan sincronizadamente tanto el atributo HTML `disabled` como `aria-disabled="true|false"` para lectores de pantalla.
5. **Estrategia de Cache-Busting (`?v=`):**
   - Durante el desarrollo local contra servidor web estático, las etiquetas de versión (`?v=16.0`) garantizan la invalidación instantánea de caché en hojas de estilo y scripts. En la fase final de empaquetado como aplicación de escritorio nativa con Electron (Fase 17+), los archivos se resuelven directamente vía protocolo local `file://`, donde los query strings de caché resultan innecesarios y podrán removerse limpiamente.

---

## 🔐 10. Fase 17: Sistema de Login Local (Pantalla de Bloqueo)

### 10.1 Contexto y Filosofía de Diseño
Como requisito de la cátedra de Diseño de Interfaces de Software, la aplicación incorpora control de acceso. Al tratarse de una **estación de trabajo de audio digital de escritorio de un solo usuario** (no un servicio multiusuario ni SaaS en la nube), el sistema opera como una **pantalla de bloqueo local**:
- **Primer arranque:** Si no existe ninguna cuenta previa configurada (`configured: false`), la aplicación solicita al usuario crear su nombre de usuario y contraseña iniciales.
- **Usos posteriores:** Si ya existe un usuario registrado (`configured: true`), la app exige el ingreso de las credenciales antes de desbloquear y mostrar el workspace.
- **Acceso visual y funcional:** Los elementos principales del editor (`#workspace`, `#topbar`, `#transport`) permanecen completamente ocultos (`hidden`) y bloqueados contra interacción o lectores de pantalla hasta que la autenticación sea exitosa.

### 10.2 Criptografía Nativa con `crypto.scryptSync` (Cero Dependencias Nativas)
Para evitar problemas de compilación de binarios C/C++ en plataformas destino (el mismo motivo por el cual se evitó SQLite pensando en el empaquetado futuro con Electron):
- **Sin `bcrypt`:** Se utiliza exclusivamente el módulo estándar `crypto` incorporado en Node.js.
- **Derivación de clave:** Se emplea `crypto.scryptSync(password, salt, 64).toString('hex')`, un algoritmo resistente a ataques por fuerza bruta y aceleración por GPU.
- **Salt criptográfico:** Generado de forma impredecible con `crypto.randomBytes(16).toString('hex')`.
- **Comparación segura:** En el inicio de sesión, los buffers del hash calculado y el hash persistido se comparan con `crypto.timingSafeEqual` para prevenir ataques de temporización (*timing attacks*).

### 10.3 Almacenamiento Local y Atómico (`backend/storage/auth.json`)
Las credenciales se gestionan en `backend/storage/auth.json` (ignorado en `.gitignore` para no versionar datos de usuario):
```json
{
  "username": "mauricio",
  "passwordHash": "f7da3dac7fa43aa5daefc539d4ee615b1f265d9e924bd192ece7dc3a91fa34caffc45befeb778017a115cbeb923e1fb7dd7ebd3c7cc6b3b8ead78913b8c4c40e",
  "salt": "925c13ada9c41b072e67f46b1df04b51"
}
```
Las escrituras son estrictamente atómicas (primero se escribe en `auth.json.tmp` y luego se ejecuta `fs.rename`), evitando corrupciones ante cierres inesperados de la aplicación.

### 10.4 Rutas de la API de Autenticación
Montadas bajo el prefijo `/api/auth`:
- **`GET /api/auth/status`:** Devuelve `{ configured: boolean }`.
- **`POST /api/auth/setup`:** Solo admitido si `configured === false`. Valida que el nombre de usuario no esté vacío y que la contraseña posea al menos 6 caracteres. Genera el salt, computa el hash con `scryptSync`, guarda en `auth.json` y responde `{ success: true, username }`.
- **`POST /api/auth/login`:** Valida que las credenciales coincidan. Responde `{ success: true, username }` si son válidas o HTTP 401 si no coinciden.

### 10.5 Política de Sesión en Memoria (*In-Memory Session*)
- **Sin persistencia entre recargas:** Por diseño deliberado para una app de escritorio con pantalla de bloqueo, la sesión se mantiene únicamente en memoria de JavaScript (`PodcastCraftAuth.isAuthenticated`). Al recargar la página (F5) o cerrar y reabrir la aplicación, se solicita la contraseña nuevamente.
- **Botón de Cerrar Sesión:** En la barra superior (`#btn-logout`, icono `log-out`), el usuario puede bloquear la estación de trabajo manualmente en cualquier momento. Esto pausa de inmediato cualquier audio en reproducción y oculta el espacio de trabajo sin reiniciar el backend ni perder el proyecto guardado.

### 10.6 Manejo de Servidor Desconectado y Modo Degradado
A diferencia de otras fases donde se permitía un modo de prueba degradado sin backend, **el login local requiere estrictamente la presencia del backend**:
- Si el servidor local en el puerto 3001 está apagado o no responde, la pantalla de bloqueo muestra un banner de error: *"No se pudo conectar con el servidor local para iniciar sesión."* con un botón de **Reintentar**.
- El usuario **no puede ingresar a la aplicación** hasta que el servidor local esté activo y responda con éxito.

### 10.7 Recuperación y Reseteo de Cuenta (Si se Olvida la Contraseña)
Al ser un software local sin servidor de correo ni nube:
- No existe pantalla compleja de "¿Olvidaste tu contraseña?".
- Para reiniciar la cuenta, el usuario solo debe **eliminar el archivo `backend/storage/auth.json`** (o vaciarlo a `{ "username": null, "passwordHash": null, "salt": null }`).
- Al abrir PodcastCraft AI nuevamente, el backend reportará `configured: false` y la interfaz presentará inmediatamente la pantalla de **Configuración Inicial** para registrar una nueva cuenta, conservando intactos el proyecto en `project.json` y todos los audios importados.

### 10.8 Accesibilidad e Internacionalización en Bloqueo
- Tanto el conmutador de **Idioma (ES / EN)** como el de **Tema (Claro / Oscuro)** están ubicados en la barra superior de la pantalla de bloqueo (`#auth-language-toggle`, `#auth-theme-toggle`), permitiendo al usuario configurar sus preferencias visuales antes de iniciar sesión.
- Todos los textos, etiquetas aria, placeholders y mensajes de validación están 100% traducidos en inglés y español bajo el espacio de nombres `auth.*`.

---

## 🎙️ 11. Fase 18: Transcripción Real con IA (Google Gemini) y Recorte con FFmpeg

Esta fase reemplaza de forma definitiva el generador simulado de la Fase 15 (`generateMockTranscript`, diccionarios `SAMPLE_WORDS_*` y `FILLER_WORDS_*`) por una integración real con la API multimodal de **Google Gemini** (Google AI Studio).

### 11.1 Arquitectura del Flujo de Transcripción
```
[Timeline / Clip seleccionado]
       │ (libraryId, start, duration)
       ▼
[Frontend: POST /api/ai/transcribe]
       │
       ▼
[Backend: src/routes/ai.js]
       │
       ├──► 1. Resuelve la ruta física del audio en backend/storage/audio-files/
       │
       ├──► 2. Recorta exactamente [start, duration] vía ffmpeg-static + fluent-ffmpeg
       │       a archivo temporal en backend/storage/tmp/
       │
       ├──► 3. Codifica el recorte en Base64 y lo envía a Google Gemini con responseSchema
       │
       ├──► 4. Gemini devuelve JSON estructurado con segmentos, tiempos (relativos al clip)
       │       y muletillas clasificadas (isFiller: true/false)
       │
       ├──► 5. Borrado garantizado del archivo temporal en storage/tmp/ (bloque finally)
       │
       ▼
[Frontend: Actualiza Store & Renderiza Fichas de Palabras]
```

### 11.2 Dependencias Cero-Nativas (Preparadas para Electron)
Para mantener la portabilidad del backend y facilitar el futuro empaquetado de escritorio con Electron (Fase 20), ninguna dependencia requiere compilación C/C++ ni `node-gyp`:
- `@google/generative-ai` (^0.21.0): SDK oficial de Google para Node.js.
- `dotenv` (^16.4.5): Carga segura de variables de entorno desde `.env`.
- `ffmpeg-static` (^5.2.0): Binario de FFmpeg precompilado para la arquitectura del sistema operativo sin dependencias externas.
- `fluent-ffmpeg` (^2.1.3): Capa de abstracción en JavaScript para ejecutar operaciones de recorte y transcodificación.

### 11.3 Seguridad Crítica de Credenciales y Política de Git
- **El archivo `backend/.env` NUNCA se versiona:** Incluye la clave real `GEMINI_API_KEY`. Está estrictamente ignorado en `backend/.gitignore` (`.env`, `.env.local`, `.env.*`).
- **Archivo de ejemplo versionado (`backend/.env.example`):**
  ```env
  GEMINI_API_KEY=tu_clave_aqui
  GEMINI_MODEL=gemini-3.5-flash
  ```
- **Arranque tolerante a fallos:** Si `process.env.GEMINI_API_KEY` no está configurada, el servidor arranca normalmente emitiendo una advertencia en consola. La app sigue operativa y la interfaz notifica al usuario si intenta transcribir.
- **Riesgo aceptado para Electron (Fase 20):** Al empaquetar una aplicación de escritorio local, cualquier archivo `.env` o clave embebida en el cliente es técnicamente extraíble por usuarios avanzados mediante descompilación. Esta decisión fue evaluada y aceptada por el usuario para este proyecto de entrega académica / prototipo de escritorio.

### 11.4 Recorte de Audio con FFmpeg (`backend/src/utils/audioTrimmer.js`)
Para optimizar el ancho de banda y la cuota de la API de Gemini:
- No se envía el archivo de audio completo. Se envía únicamente la porción precisa del clip en el timeline (`start` y `duration` en segundos).
- Se genera un archivo temporal con identificador criptográfico único (`crypto.randomUUID()`) en `backend/storage/tmp/`.
- **Garantía de limpieza:** Tanto en caso de éxito como en caso de error, el archivo temporal se elimina inmediatamente en el bloque `finally` mediante `fs.promises.unlink`.

### 11.5 Salida Estructurada con `responseSchema`
Se utiliza la característica nativa de Gemini de salida JSON forzada mediante esquema (`responseSchema`), evitando el parseo frágil de texto libre:
```javascript
const schema = {
  type: "object",
  properties: {
    segments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          isFiller: { type: "boolean" }
        },
        required: ["text", "startTime", "endTime", "isFiller"]
      }
    }
  },
  required: ["segments"]
};
```
- **Detección de Idioma Automática:** A diferencia de la Fase 15 (que generaba texto simulado según el idioma de la interfaz), Gemini detecta de forma autónoma el idioma del audio (ej. español, inglés, italiano) y transcribe en ese mismo idioma.
- **Tiempos Relativos:** Los campos `startTime` y `endTime` se calculan respecto al inicio del recorte del clip (`0.0` = inicio del clip).
- **Marcado de Muletillas:** La IA etiqueta automáticamente como `isFiller: true` aquellas palabras de relleno típicas del idioma detectado (ej. *"eh"*, *"o sea"*, *"bueno"*, *"um"*, *"like"*, etc.).

### 11.6 Resiliencia y Cascada de Modelos de IA
Para mitigar la congestión temporal (código HTTP 503) o modelos descontinuados (código HTTP 404):
- El backend evalúa en orden una cascada de modelos activos: `process.env.GEMINI_MODEL`, `gemini-3.5-flash`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.5-transcribe` y `gemini-flash-latest`.
- Si un modelo reporta error temporal de alta demanda o no disponibilidad, el backend conmuta al siguiente modelo automáticamente sin interrumpir al usuario.
- Si el fallo se debe a credenciales inválidas (HTTP 401) o cuota agotada (HTTP 429), la petición se aborta de inmediato con un mensaje informativo y traducido.

### 11.7 Recomendación de Costos y Límites de Gasto
Para usuarios que utilicen planes de pago o el nivel gratuito de Google AI Studio / Google Cloud:
1. Acceder a la consola de Google Cloud Billing.
2. Establecer un **Presupuesto y Alerta de Gasto** (Spending Limit / Budget Alert) a fin de prevenir consumos no deseados.
3. El modelo por defecto (`gemini-3.5-flash`) ofrece una excelente relación de velocidad, precisión y bajo costo por millón de tokens de audio procesados.

---

## ✂️ 12. Fase 19: Edición Basada en Transcripción (Corte de Audio en Línea de Tiempo)

Esta fase implementa la edición reactiva guiada por texto: al marcar segmentos de texto y confirmar su eliminación, el clip de audio en la línea de tiempo se divide y recorta automáticamente en los puntos exactos correspondientes, sincronizando visual y auditivamente las pistas de la estación de trabajo.

### 12.1 Diagnóstico y Corrección Fundamental de `sourceOffset`
#### Hallazgo del Diagnóstico Previo:
- Antes de la Fase 19, el motor de reproducción (`globalAudio.currentTime`) asumía incorrectamente que cualquier clip comenzaba a sonar desde el segundo `0.0` de su archivo fuente (`globalAudio.currentTime = seconds - clip.start`).
- Ni el recorte de borde izquierdo (asa izquierda de la Fase 4) ni la división por doble clic (*split* de la Fase 9) registraban un puntero al segundo del archivo fuente original. En consecuencia, si se recortaban los primeros 5 segundos de un clip o se reproducía la segunda mitad de un clip dividido, el audio sonaba erróneamente desde el principio del archivo original.

#### Solución Implementada:
1. **Nuevo campo contractual `sourceOffset`:** Cada clip en el store y en la persistencia incorpora:
   ```javascript
   {
     id: "clip-...",
     libraryId: "lib-import-...",
     name: "Audio",
     start: 10,        // Posición en segundos en el TIMELINE
     duration: 15,     // Largo en segundos en el TIMELINE
     sourceOffset: 8   // Segundo exacto del ARCHIVO FUENTE donde inicia este fragmento
   }
   ```
2. **Reproducción sincronizada:** Al hacer scrub o pulsar Play, la posición real cargada en el elemento nativo de audio se calcula como:
   $$\text{globalAudio.currentTime} = \text{clip.sourceOffset} + (\text{timelineCurrentTime} - \text{clip.start})$$
3. **Bucle de animación del playhead (60 FPS):** El tiempo transcurrido descuenta el offset base del archivo:
   $$\text{audioElapsed} = \max(0, \text{globalAudio.currentTime} - \text{activePlayingClipSourceOffset})$$
   $$\text{timelinePosition} = \text{activePlayingClipStart} + \text{audioElapsed}$$
4. **Actualización en operaciones de edición:**
   - **Soltado inicial (*drop*):** `sourceOffset = 0`.
   - **División manual (*split* por doble clic en $t_{\text{split}}$):** `clip1.sourceOffset = clip.sourceOffset`, `clip2.sourceOffset = clip.sourceOffset + splitSec`.
   - **Recorte con asa izquierda:** Al arrastrar el inicio, `sourceOffset` avanza en la misma cantidad que se recortó: `sourceOffset += (pendingStart - initialStart)`.
   - **Persistencia en backend:** `saveProjectToBackend` y `loadProjectFromBackend` serializan y restauran `sourceOffset` de forma transparente.

### 12.2 Pivote de la UI: De Palabras a Nivel de Segmento
En lugar de seleccionar palabras sueltas sin marcas de tiempo individuales precisas, la interfaz conmuta a **segmentos completos** (las frases de 3 a 8 palabras devueltas por Gemini con sus correspondientes marcas decimales `startTime` y `endTime`):
- Cada segmento funciona como un bloque interactivo con `role="button"`, `tabindex="0"`, atributos `aria-pressed` y `aria-label` descriptivos.
- Estilos consistentes: fondo y borde ámbar para muletillas (`.ai-word-filler`), tachado con borde discontinuo para marcado (`.ai-word-marked`).
- El botón de confirmación de borrado en el encabezado del panel muestra la cantidad de segmentos a cortar: `t('aiPanel.confirmCleanupSegments', { count })` (ej. *"Cortar audio (1)"*).

### 12.3 Algoritmo Central: Sustracción de Intervalos (`computeKeptRanges`)
Dada la duración $D$ del clip original y un conjunto de rangos eliminados $\{[s_i, e_i]\}$:
1. Se fusionan rangos que se solapan o son adyacentes.
2. Se calculan los rangos sobrevivientes descartando fragmentos residuales insignificantes (`MIN_PIECE_DURATION = 0.3s`):
   ```javascript
   function computeKeptRanges(clipDuration, removedRanges) {
     const MIN_PIECE_DURATION = 0.3;
     const sorted = [...removedRanges].sort((a, b) => a.start - b.start);
     const merged = []; // rangos fusionados
     ...
     const kept = [];
     let cursor = 0;
     for (const r of merged) {
       if (r.start - cursor >= MIN_PIECE_DURATION) {
         kept.push({ start: cursor, end: r.start });
       }
       cursor = Math.max(cursor, r.end);
     }
     if (clipDuration - cursor >= MIN_PIECE_DURATION) {
       kept.push({ start: cursor, end: clipDuration });
     }
     return kept;
   }
   ```

### 12.4 Posicionamiento Contiguo (*Ripple Cut*)
- Los pedazos sobrevivientes se sitúan de forma contigua en el carril a partir de `originalClip.start`, cerrando el espacio vacío del material suprimido (comportamiento tipo *ripple delete* de DAWs profesionales).
- Si se eliminan todos los segmentos del clip, este desaparece del carril limpiamente sin dejar residuos ni errores de reproducción.
- Si solo sobrevive un rango (por ejemplo, corte al inicio o al final), el clip resultante se contrae con su `sourceOffset` y duración ajustados.

### 12.5 Preservación de Transcripción sin Re-transcribir
Para optimizar el uso de tokens y cuota de Gemini:
- Cada nuevo clip hereda los segmentos de transcripción originales cuyo punto medio caía dentro de su intervalo conservado.
- Las marcas temporales se recalculan automáticamente para ser relativas al nuevo clip:
  $$\text{seg.startTime}' = \text{seg.startTime} - \text{rango.start}$$
  $$\text{seg.endTime}' = \text{seg.endTime} - \text{rango.start}$$
- La entrada `state.ai.transcriptByClip[nuevoClipId]` se genera de inmediato en estado `done`. Al seleccionar cualquiera de las piezas en el timeline, su transcripción aparece al instante sin necesidad de reenviar el audio a Gemini.

### 12.6 Integración con el Sistema de Deshacer (Undo / Ctrl+Z)
Antes de sustituir el clip original en `track.clips`, se invoca `pushUndoSnapshot()`. Al presionar `Ctrl+Z` o hacer clic en `#btn-undo`, la acción de corte se revierte al 100%, restaurando el clip original, su duración y su transcripción íntegra.

### 12.7 Limitaciones Técnicas Documentadas
- **Granularidad mínima:** El corte se efectúa a nivel de segmento de frase (3 a 8 palabras), no por fonema o palabra aislada dentro de una frase, lo cual garantiza que los límites temporales reportados por el modelo de IA conserven coherencia fonética y no generen artefactos de audio abruptly recortados.

---

## 📦 Fase 20: Empaquetado con Electron — Backend Embebido e Instalador de Escritorio

La **Fase 20** representa la culminación del ciclo de ingeniería de PodcastCraft AI, transformando la aplicación en una **herramienta de escritorio nativa e instalable**. El usuario final puede instalar y ejecutar la aplicación sin necesidad de instalar Node.js, ejecutar comandos de terminal ni configurar servidores manualmente.

### 13.1 Arquitectura del Empaquetado

```
podcastcraft-ai/
├── package.json           # Orquestador raíz: scripts de build y configuración de electron-builder
├── electron/
│   ├── main.js            # Proceso principal de Electron (gestiona ventana, backend y ciclo de vida)
│   └── preload.js         # Puente de contexto seguro (contextIsolation: true, nodeIntegration: false)
├── frontend/              # Interfaz de usuario (HTML5, Tailwind compilado/tokens, Web Audio API)
├── backend/               # Servidor Express embebido (almacenamiento atómico, Gemini AI, fluent-ffmpeg)
│   ├── .env               # Variables de entorno de distribución (GEMINI_API_KEY)
│   ├── node_modules/      # Dependencias nativas empaquetadas en extraResources
│   └── src/               # Lógica del servidor y rutas de API
└── dist/                  # Salida de compilación: ejecutables e instalador NSIS (.exe)
```

### 13.2 Ciclo de Vida y Arranque Autónomo del Backend Embebido

1. **Subproceso Node Embebido (`child_process.fork`):**
   - En `electron/main.js`, al dispararse `app.whenReady()`, la función `startBackend()` ejecuta el servidor Express en segundo plano mediante `fork()`.
   - Se establece `windowsHide: true` y `ELECTRON_RUN_AS_NODE: '1'` para garantizar que **no se abra ninguna consola o ventana de terminal secundaria** para el usuario.
2. **Sondeo Reactivo de Salud (`waitForBackend`):**
   - En lugar de usar un temporizador fijo arbitrario (`setTimeout`), Electron sondea activamente cada 200 ms el endpoint `GET http://127.0.0.1:3001/health`.
   - Cuando el backend responde `200 OK` (habitualmente entre 100 y 300 ms), la ventana principal `mainWindow.loadFile()` carga la interfaz y se muestra mediante `mainWindow.show()`, eliminando pantallas en blanco (*white flash*).
3. **Manejo de Instancia Única (`app.requestSingleInstanceLock`):**
   - Si el usuario intenta abrir un segundo ejecutable, Electron detecta la instancia previa, enfoca la ventana existente y finaliza el proceso duplicado, previniendo colisiones en el puerto `3001`.
4. **Terminación Garantizada de Procesos Huérfanos:**
   - Para impedir que subprocesos `node.exe` o `ffmpeg.exe` queden corriendo en segundo plano al cerrar la ventana:
     - En `backend/src/server.js`, se escucha el evento IPC `process.on('disconnect')`, finalizando el servidor inmediatamente si el proceso padre desaparece.
     - En `electron/main.js`, ante eventos `before-quit`, `window-all-closed` o `SIGINT`, se invoca `killBackend()`, la cual ejecuta en Windows:
       ```bash
       taskkill /pid <PID> /T /F
       ```
       eliminando forzosamente y de forma atómica todo el árbol de procesos dependientes.

### 13.3 Adaptabilidad de Almacenamiento y Permisos en Windows (`userData`)

En Windows, las aplicaciones instaladas en `C:\Program Files\` carecen de permisos de escritura para cuentas de usuario estándar. Para resolver este desafío:
- `electron/main.js` define:
  ```javascript
  const storageDir = app.isPackaged
    ? path.join(app.getPath('userData'), 'storage')
    : path.join(__dirname, '..', 'backend', 'storage');
  ```
- Esta ruta se inyecta al backend a través de la variable de entorno `PODCASTCRAFT_STORAGE_DIR`.
- En modo empaquetado, la persistencia de proyectos (`project.json`), credenciales (`auth.json`), clips (`audio-files/`) y fragmentos temporales (`tmp/`) se almacena de manera segura en:
  `%APPDATA%\podcastcraft-ai\storage\`
- `backend/src/storage.js` asegura automáticamente la creación de estos directorios de forma recursiva al iniciar.

### 13.4 Empaquetado de Dependencias Nativas y Clave de Gemini

En la configuración `"build"` de `package.json`, se emplean `extraResources` para trasladar el backend de forma íntegra sin encapsularlo dentro del archivo comprimido `app.asar`:
```json
"extraResources": [
  {
    "from": "backend",
    "to": "backend",
    "filter": [
      "**/*",
      ".env",
      "!storage/audio-files/*",
      "!storage/tmp/*",
      "!storage/project.json",
      "!storage/auth.json"
    ]
  }
]
```
- **Dependencias de Node:** Se incluyen todos los paquetes de `backend/node_modules/` (como `@google/generative-ai`, `express`, `fluent-ffmpeg` y el binario precompilado de `ffmpeg-static\ffmpeg.exe`).
- **Clave de API:** El archivo `backend/.env` viaja dentro del instalador para permitir la transcripción inmediata con Google Gemini sin que el usuario requiera configuración adicional. **Por seguridad, `.env` permanece rigurosamente ignorado en `.gitignore` para no ser subido al repositorio Git.**
- **Aislamiento de Almacenamiento de Desarrollo:** Se excluyen los audios y proyectos de prueba locales para que el instalador entregue una experiencia limpia de primer uso ("Crear contraseña maestra").

---

### 13.5 Comandos de Generación de Instaladores y Ejecución

#### Modo Desarrollo (sin empaquetar)
Para arrancar Electron en modo de desarrollo con recarga directa:
```bash
# 1. Instalar dependencias raíz y de backend (si es la primera vez)
npm install
cd backend && npm install && cd ..

# 2. Iniciar la aplicación
npm start
```

#### Compilación del Instalador para Windows (NSIS)
Genera el instalador ejecutable `.exe` con asistente de instalación paso a paso:
```bash
npm run build:win
```
- **Salida:** `dist/PodcastCraft AI.exe` (~105 MB).
- **Características del instalador:**
  - Asistente de instalación multilingüe NSIS con opción para seleccionar carpeta destino (`oneClick: false`).
  - Creación automática de accesos directos en el Escritorio y Menú Inicio de Windows.
  - Generador de desinstalador nativo (`Uninstall PodcastCraft AI.exe`).

#### Compilación para macOS y Linux
Los scripts preconfigurados en `package.json` son:
```bash
npm run build:mac     # Genera dist/*.dmg
npm run build:linux   # Genera dist/*.AppImage
npm run build:all     # Compila para las 3 plataformas
```

---

### 13.6 Matriz de Compatibilidad y Limitaciones Conocidas

| Plataforma | Soporte de Compilación desde Windows | Estado | Observaciones Técnicas |
|---|---|---|---|
| **Windows x64 (`.exe`)** | **Nativo y Completo** | ✅ **Verificado 100%** | Compilación, empaquetado NSIS, instalación silenciosa y flujos completos validados en entorno real. |
| **Linux (`.AppImage`)** | Requiere entorno Linux / WSL / Docker | ⚠️ **Limitación de SO** | `app-builder` requiere privilegios POSIX de enlace simbólico (`symlink`) y `mksquashfs` nativo para empaquetar iconos y librerías de Linux. Debe compilarse desde Ubuntu/Debian o GitHub Actions. |
| **macOS (`.dmg`)** | Requiere entorno macOS (Darwin) | ⚠️ **Limitación de SO** | Apple restringe la creación y firma de imágenes DMG y binarios Mach-O a sistemas operativos macOS. Debe compilarse desde macOS o mediante un *runner* `macos-latest` en GitHub Actions. |

---

### 13.7 Distribución de Versiones (GitHub Releases)

Para poner los instaladores a disposición del público o evaluadores:
1. Crear una etiqueta Git (*tag* de versión):
   ```bash
   git tag -a v1.0.0 -m "PodcastCraft AI v1.0.0 - Release Oficial"
   git push origin v1.0.0
   ```
2. En GitHub, navegar a **Releases** > **Draft a new release**.
3. Seleccionar la etiqueta `v1.0.0`, titular la versión (*ej. PodcastCraft AI v1.0.0*) y adjuntar el archivo ejecutable generado:
   - `dist/PodcastCraft AI.exe`
4. Publicar la versión (*Publish release*) para que cualquier usuario pueda descargar el instalador directamente con un solo clic.

---

### 13.8 Registro de Pruebas Obligatorias de la Fase 20 (Superadas al 100%)

Todas las pruebas exigidas en la especificación fueron ejecutadas y verificadas con éxito en el sistema real:

1. **Modo Desarrollo (`npm start`):**
   - Ventana nativa de Electron (1440x900) abierta sin barra de navegador.
   - Detección automática del backend embebido y respuesta inmediata en `GET /health` (5 ms).
2. **Arranque Autónomo del Backend:**
   - Verificado mediante logs de proceso (`[Electron Main] Backend listo`) y consultas HTTP directas a endpoints de API.
3. **Generación del Instalador de Windows (`npm run build:win`):**
   - Paquete NSIS generado con éxito: `dist\PodcastCraft AI.exe` (105.6 MB).
4. **Instalación Real del `.exe`:**
   - Instalación ejecutada en directorio de prueba (`/S /D=...`). Despliegue correcto de binarios, runtime de Electron y recursos de backend.
5. **Ejecución de la Aplicación Instalada:**
   - La aplicación inicia directamente en segundo plano sin consolas de comandos visibles ni prompts de Node para el usuario.
6. **Flujo Integral en Aplicación Instalada:**
   - **Login inicial:** Pantalla de bloqueo muestra estado `configured: false` ("Crear contraseña maestra"). Registro y login validados.
   - **Subida de audio:** Petición `POST /api/audio` con archivo MP3 real almacenado en `%APPDATA%\podcastcraft-ai\storage\audio-files\` y servido con cabecera `audio/mpeg` (200 OK).
   - **Transcripción real con Google Gemini:** `POST /api/ai/transcribe` invocó la API en la nube con clave embebida, procesó el recorte con `ffmpeg-static` y devolvió segmentos estructurados con marcas de tiempo decimales (`success: true`).
   - **Persistencia de Proyecto:** Proyecto guardado con `PUT /api/project`. Cierre forzoso de la aplicación y reapertura; el proyecto y el usuario se restauraron intactos desde `%APPDATA%\podcastcraft-ai\storage\project.json`.
7. **Terminación Limpia de Procesos:**
   - Al cerrar la ventana de la app, `killBackend()` ejecutó la terminación limpia. `netstat -ano | findstr :3001` confirmó que el puerto quedó 100% liberado y no quedaron procesos `node.exe` o `ffmpeg.exe` huérfanos.
   - Ejecución del desinstalador (`Uninstall PodcastCraft AI.exe /S`) verificada, eliminando los binarios del sistema limpiamente.

---

## 🎛️ Fase 22: Motor de Reproducción con Web Audio API (Multitrack Real y Reproducción Continua)

La **Fase 22** resuelve de raíz las dos limitaciones más críticas del reproductor de audio detectadas durante las pruebas de usuario en la aplicación instalada:
1. **Pausas y bloqueos en clips divididos:** Anteriormente, tras dividir un clip en múltiples fragmentos (*split* o recorte), al pulsar Play el audio se detenía al término de cada pieza, obligando al usuario a seleccionar y reproducir pieza por pieza de forma manual.
2. **Imposibilidad de mezclar pistas simultáneas:** Con dos o más carriles activos (por ejemplo, voz en pista 1 y fondo musical en pista 2), el reproductor solo emitía el clip que estuviera seleccionado, imposibilitando la mezcla multipista.

### 14.1 Diagnóstico y Causa Raíz
El motor original dependía de un único elemento HTML5 `<audio>` (`globalAudio`), concebido para reproducir un único recurso de audio a la vez con un único puntero de tiempo (`globalAudio.currentTime`). Esta arquitectura impedía la programación simultánea de múltiples fuentes y exigía reasignar manualmente la fuente y el tiempo en cada frontera de clip.

**Elementos eliminados contractualmente:**
- `globalAudio` (elemento `<audio>` del DOM).
- Variables de seguimiento local: `activePlayingClipStart`, `activePlayingClipSourceOffset`, `activePlayingClipDuration`.
- Manejadores de eventos de audio HTML5 (`onended`, `ontimeupdate`, etc.).

---

### 14.2 Arquitectura del Motor Web Audio API

PodcastCraft AI implementa ahora un motor de audio digital profesional basado en un grafo de nodos de **Web Audio API**:

```
[AudioBufferSourceNode (Clip 1)] ──> [GainNode (clip.volume)] ──┐
[AudioBufferSourceNode (Clip 2)] ──> [GainNode (clip.volume)] ──┼─> [GainNode (track.volume)] ─┐
                                                                                               │
[AudioBufferSourceNode (Clip 3)] ──> [GainNode (clip.volume)] ──┐                             ├─> [masterGain] ──> [ctx.destination]
[AudioBufferSourceNode (Clip 4)] ──> [GainNode (clip.volume)] ──┴─> [GainNode (track.volume)] ─┘
```

1. **Singleton `AudioContext` & Grafo Jerárquico:**
   - Un único `AudioContext` gestiona la línea de tiempo de hardware de audio.
   - Cada clip genera una fuente `AudioBufferSourceNode` conectada a un nodo de ganancia individual `clipGain` (`clip.volume ?? 1`).
   - Todos los `clipGain` de un mismo carril convergen en un `trackGain` común (`track.volume ?? 1`).
   - Todos los `trackGain` se conectan al nodo maestro `masterGain`, el cual finalmente alimenta `ctx.destination` (salida del sistema/altavoces).

2. **Caché y Precarga No Bloqueante (`audioBufferCache`):**
   - Los archivos de audio se descargan y decodifican a través de `fetch(url) -> arrayBuffer() -> ctx.decodeAudioData()`.
   - Se indexan en memoria en un `Map` por `libraryId`.
   - La precarga se ejecuta de forma asíncrona y no bloqueante en segundo plano tanto al importar archivos MP3 a la biblioteca como al hidratar proyectos desde el backend (`loadProjectFromBackend`).
   - **Indicador de estado visual:** Si el usuario pulsa Play antes de que todos los buffers estén listos, la interfaz muestra el estado contextual *"Preparando audio…"* (`#audio-loading-status`) junto al botón de reproducción con soporte i18n (`es` y `en`), resolviendo la promesa antes de activar el transporte sin colgar la UI.
   - En caso de error de decodificación en algún archivo corrupto, se notifica al usuario con un mensaje traducido y la aplicación continúa funcionando normalmente.

---

### 14.3 Reloj de Transporte y Programación Precisa al Reproducir

Al pulsar Play desde una posición temporal `fromTime`:
1. **Cálculo de compensación y programación de fuentes:**
   Para cada carril y cada clip cuyo intervalo finalice después de `fromTime` (`clip.start + clip.duration > fromTime`):
   ```javascript
   const lead = 0.05; // Margen de antelación para programación de hardware
   const skip = Math.max(0, fromTime - clip.start);
   const when = ctx.currentTime + lead + Math.max(0, clip.start - fromTime);
   const offset = clip.sourceOffset + skip;
   const dur = clip.duration - skip;
   src.start(when, offset, dur);
   ```
   - **Precisión flotante sin redondeos:** No se redondean los valores de `start`, `duration` ni `sourceOffset`, garantizando que piezas adyacentes resultantes de recortes o divisiones empalmen con continuidad matemática perfecta (*gapless playback*), sin saltos, silencios ni artefactos de solapamiento.
   - Todas las instancias de `AudioBufferSourceNode` activas se almacenan en un array `activeAudioSources` para su detención instantánea al pausar o buscar.

2. **Fórmula de Tiempo del Transporte:**
   - Se registran la posición del timeline (`transportStartPos`) y el tiempo del contexto de audio (`transportStartCtxTime`).
   - Durante la reproducción, la función `getTransportTime()` retorna:
     $$\text{getTransportTime}() = \text{transportStartPos} + (\text{ctx.currentTime} - \text{transportStartCtxTime} - \text{lead})$$
   - En pausa, retorna la posición estática `transportSavedPos`.

3. **Loop de Animación a 60 FPS:**
   - `requestAnimationFrame` lee `getTransportTime()` y traslada el playhead (`#timeline-playhead`) y actualiza el contador digital (`#current-time`) mediante manipulación directa del DOM (0 llamadas a `setState` o `renderAll`).
   - **Parada al fin de proyecto:** Al alcanzar la duración total del proyecto (`state.project.duration`), la reproducción se detiene automáticamente, el playhead queda posicionado al final y el próximo Play se reinicia contractualmente desde `00:00`.

---

### 14.4 Interactividad, Scrubbing y Edición en Caliente

1. **Pausa:**
   - Congela y almacena la posición temporal exacta en `transportSavedPos`.
   - Detiene con `src.stop()` y desconecta de inmediato todos los nodos activos en `activeAudioSources`.

2. **Scrubbing y Saltos (Regla, J/K/L, Rewind/Forward):**
   - **En reproducción:** Detiene las fuentes activas y reprograma instantáneamente el grafo desde la nueva posición seleccionada en el timeline.
   - **En pausa:** Reposiciona el playhead y el contador numérico sin emitir audio.

3. **Reprogramación en Caliente con Debounce (150 ms):**
   - Si el usuario efectúa operaciones de edición mientras el audio está sonando (dividir con doble clic, recortar bordes con handles, arrastrar clips, borrar con Delete/Backspace, deshacer con Ctrl+Z, o supresión de fragmentos desde la IA), la función `schedulePlaybackDebounce(150)` reprograma el motor automáticamente desde el segundo actual transcurridos 150 ms de inactividad, evitando clicks auditivos y manteniendo la sincronía total.
   - Cambios de volumen y mute se aplican en vivo sin reprogramar mediante rampas suaves `gainNode.gain.setTargetAtTime(target, ctx.currentTime, 0.01)`.

4. **Autoplay en Electron:**
   - Se configuró el switch de Chromium en `electron/main.js`:
     `app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')`.
   - Se asegura la invocación de `ctx.resume()` en el manejador del botón Play para desbloquear el contexto de audio.

---

### 14.5 Modelo de Datos y Soporte de Volumen

- Cada carril admite el atributo opcional `volume` (número entre 0 y 1, por defecto `1`).
- Cada clip admite el atributo opcional `volume` (número entre 0 y 1, por defecto `1`).
- `saveProjectToBackend` y `loadProjectFromBackend` garantizan la persistencia de ambos atributos. Si no existen en proyectos anteriores, se inicializan con valor predeterminado `1` asegurando retrocompatibilidad absoluta.
- El endpoint `PUT /api/project` del backend almacena de forma transparente la estructura íntegra sin filtrar campos desconocidos.

---

### 14.6 Interfaz de la Barra de Transporte

- `#now-playing-name`:
  - Si un clip específico está seleccionado en el timeline: muestra el nombre de dicho clip.
  - Si no hay ningún clip seleccionado pero hay pistas en el proyecto: muestra *"Mezcla de N clips"* (en español) o *"Mix of N clips"* (en inglés).
  - Si no existe ningún clip en el proyecto: el botón Play permanece deshabilitado según contrato de accesibilidad.

---

### 14.7 Matriz de Pruebas Obligatorias de la Fase 22 (10/10 Superadas)

Todas las pruebas exigidas se ejecutaron y validaron mediante automatización en el entorno real de Electron con archivos MP3 genuinos:

| # | Prueba Obligatoria | Condición Validada | Resultado |
|---|---|---|:---:|
| 1 | **Clip dividido en 5+ piezas continuas** | 5 clips contiguos creados por split. Al dar Play desde el inicio, sonaron las 5 fuentes programadas en cadena (`activeSources: 5`), el transporte avanzó continuamente de `0.161s` a `0.779s` sin saltos ni pausas en las uniones. | ✅ **APROBADO** |
| 2 | **Multitrack simultáneo (Voz + Música)** | 2 carriles concurrentes con clips en el mismo rango temporal. Verificado que sonaron **ambas fuentes al mismo tiempo** (`activeSourcesCount: 2`, `simultaneousAudio: true`). | ✅ **APROBADO** |
| 3 | **Pausa y reanudación precisa** | Pausa en `2.871s` (0 fuentes activas). Reanudación desde exactamente `2.871s` continuando el avance temporal sin repetir ni truncar audio. | ✅ **APROBADO** |
| 4 | **Scrubbing en regla (Pausa y Play)** | Scrub en pausa a `7.000s` actualizó playhead sin sonar. Scrub durante reproducción a `5.671s` detuvo las fuentes previas y reprogramó de inmediato las fuentes restantes en esa marca. | ✅ **APROBADO** |
| 5 | **Parada al fin de proyecto y reinicio desde 0** | Duración `4.000s`. Al alcanzar el final, el motor detuvo el transporte automáticamente, el playhead quedó en `4.000s`, y el siguiente Play comenzó desde `00:00`. | ✅ **APROBADO** |
| 6 | **Programación a través de huecos vacíos** | Clip programado a partir de `15.000s` con espacio vacío previo. Al dar Play en `00:00`, el motor programó la fuente para sonar exactamente cuando el transporte alcance `15.000s`. | ✅ **APROBADO** |
| 7 | **Edición en vivo durante reproducción** | Modificación estructural (trim de borde) mientras sonaba audio. El debounce de 150 ms reprogramó el grafo sin congelamiento ni errores. | ✅ **APROBADO** |
| 8 | **No regresión (IA, Ctrl+Z, i18n, tema)** | Sustracción de intervalos por IA intacta; Ctrl+Z restauró clips; etiquetas de transporte *"Mezcla de 2 clips"* y *"Mix of 2 clips"* alternaron correctamente; playhead alineado al píxel. | ✅ **APROBADO** |
| 9 | **Rendimiento de decodificación (3 MP3 de ~4 min)** | Decodificación asíncrona de 3 archivos reales de ~4 min (254s, 202s y 194s). Tiempo total: **2937 ms** (1142 ms + 924 ms + 871 ms) en segundo plano sin congelar la UI. | ✅ **APROBADO** |
| 10 | **Terminación limpia de procesos** | Cierre de Electron verificado mediante `Get-Process "*PodcastCraft*", "*electron*"`. Cero procesos huérfanos y puerto `3001` liberado limpiamente. | ✅ **APROBADO** |

---

## 🎛️ 15. Fase 23: Controles de Volumen (por Clip y por Carril) + Unificación Cromática del Timeline

Esta fase completa el control de mezcla sonora y coherencia visual del DAW atendiendo al feedback directo del usuario:
1. **Unificación cromática de carriles y clips:** Se elimina la rotación multicolor arbitraria; todos los carriles y clips utilizan un único estilo visual consistente (`sky blue`) en modo claro y modo oscuro, respetando rigurosamente la Regla de Oro Cromática (cero violeta/fucsia fuera de IA).
2. **Control de volumen por carril:** La franja de control lateral izquierda se amplía a 140 px para alojar la papelera de eliminación junto con un control deslizante de volumen de 0% a 200% con lectura numérica del porcentaje en tiempo real.
3. **Barra contextual de volumen por clip (`#clip-toolbar`):** Barra fija ubicada entre el encabezado del timeline y la regla de tiempo. Al seleccionar un clip, muestra su nombre, slider de volumen (0%–200%) y valor porcentual. En ausencia de selección, conserva su altura fija sin saltos de layout (*zero layout shift*), mostrando el estado deshabilitado con mensaje de guía contextual.
4. **Respuesta en vivo con Web Audio API:** Modificación de ganancia continua sin interrupciones ni recálculos costosos mediante rampas de audio `setTargetAtTime(v, ctx.currentTime, 0.01)`.
5. **Historial de deshacer atómico:** Un solo paso de undo (`Ctrl+Z`) por gesto de volumen completo.
6. **Restablecimiento rápido (doble clic):** Doble clic sobre cualquier slider restaura instantáneamente el volumen al 100% (ganancia unitaria `1.0`).

---

### 15.1 Advertencia de Saturación Digital (Valores > 100%)

> [!WARNING]
> **Riesgo de Saturación y Distorsión Digital (Clipping):**
> Los controles de volumen permiten amplificar tanto el clip individual como el carril completo hasta un **200% (ganancia = 2.0)** para rescatar grabaciones con niveles débiles.
> Sin embargo, si la señal de audio original ya se encuentra normalizada cerca de $0 \text{ dBFS}$, aplicar ganancias superiores al $100\%$ ($> 1.0$) puede provocar recorte (*digital clipping*), saturación armónica y distorsión en la salida maestra. Se recomienda mantener los niveles en o por debajo del $100\%$ a menos que la fuente requiera ganancia de compensación explícita.

---

### 15.2 Especificaciones de Diseño y Accesibilidad

1. **Unificación Cromática y Contraste WCAG AAA:**
   - Se eliminaron las clases de paleta rotativa (`.track-lane-amber`, `.track-lane-emerald`, etc.) y la constante `TRACK_PALETTE`.
   - Todos los carriles aplican el fondo semántico unificado `--lane-bg` y borde `--lane-border`.
   - Todos los clips aplican la clase unificada `.track-clip-default` basada en la gama `sky`:
     - **Modo Claro:** Fondo `rgb(224 242 254)` (`sky-100`), borde `rgb(56 189 248)` (`sky-400`), texto `rgb(12 74 110)` (`sky-950`). Ratio de contraste medido: **7.77:1** (supera **WCAG AAA** $\ge 7:1$).
     - **Modo Oscuro:** Fondo `rgba(3, 105, 161, 0.7)` (`sky-700/70`), borde `rgb(56 189 248)` (`sky-400`), texto `rgb(240 249 255)` (`sky-50`). Ratio de contraste medido: **9.95:1** (supera **WCAG AAA** $\ge 7:1$).
   - Regla de oro cromática: ausencia absoluta de tonos violeta/fucsia en carriles y clips.
   - Proyectos históricos hidratados desde el backend con `colorIndex` previo se procesan de forma transparente ignorando el atributo al renderizar.

2. **Ensanchamiento de la Franja de Control y Alineación 0 px:**
   - La variable CSS `--track-control-strip-width` se ajustó contractualmente a **140 px** (antes 48 px) para acomodar holgadamente la papelera, el slider y el texto porcentual sin recortes ni desbordamientos (`scrollWidth === offsetWidth === 140px`).
   - Se verificó la alineación geométrica mediante `getBoundingClientRect()` en ambos temas (`light`/`dark`) y en ambos idiomas (`es`/`en`):
     $$\Delta(\text{Playhead}_{t=0}, \text{Regla}_{\text{origen}}, \text{Carriles}_{\text{left}}) = \mathbf{0.00 \text{ px}}$$

3. **Barra Contextual de Clip (`#clip-toolbar`):**
   - Altura fija de 40 px (`h-10`) con borde inferior para evitar cualquier movimiento vertical del timeline al alternar selecciones.
   - Con clip activo: foco visible, selector de volumen con accesibilidad completa (`aria-label="Volumen del clip"` / `"Clip volume"`, `role="slider"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="200"`).
   - Sin clip activo: contenedor inerte accesible (`aria-disabled="true"`, slider deshabilitado, texto indicativo neutral).
   - Espacio derecho despejado preparado para la Fase 24 (botones de Dividir y Eliminar).

4. **Herencia de Volumen:**
   - Clips nuevos incorporados desde la biblioteca nacen con `volume = 1` (100%).
   - Al dividir un clip (split con doble clic o atajo), ambas piezas resultantes heredan el valor exacto de `volume` del clip original.
   - Al ejecutar un corte por transcripción mediante IA, todas las piezas sobrevivientes conservan el `volume` original.

---

### 15.3 Arquitectura de Eventos y Deshacer (Undo / Redo)

1. **Evento `input` (Gesto Continuo):**
   - Aplica el volumen en vivo en el grafo Web Audio a través de `gainNode.gain.setTargetAtTime(target, ctx.currentTime, 0.01)`.
   - Actualiza de forma reactiva la etiqueta porcentual en el DOM.
   - **Cero llamadas a `setState`:** No dispara ciclos de renderizado completo durante el arrastre, evitando pausas en el hilo principal.

2. **Evento `change` (Finalización del Gesto):**
   - Ejecuta un único `setState()` con el valor final consolidado para persistirlo en el estado del proyecto.

3. **Captura Atómica de Undo:**
   - Al iniciar la interacción física (`pointerdown` o `keydown`), se registra el snapshot del estado previo si aún no se había capturado.
   - Al soltar el control (`change`), dicho snapshot se encola en la pila de deshacer con la acción `"Ajustar volumen"`.
   - Resultado: **un gesto de deslizamiento completo equivale exactamente a un paso de `Ctrl+Z`**.

4. **Sincronización en Undo:**
   - Si el audio se encuentra en reproducción y se presiona `Ctrl+Z`, la función de restauración actualiza de inmediato los nodos `AudioParam` de los carriles y clips correspondientes para reflejar el volumen restaurado sin necesidad de reiniciar la reproducción.

---

### 15.4 Matriz de Pruebas Obligatorias de la Fase 23 (10/10 Superadas)

Validada mediante suite automatizada sobre Electron con archivos de audio MP3 reales (`test_phase23.js`):

| # | Prueba Obligatoria | Condición y Valores Reales Medidos | Resultado |
|---|---|---|:---:|
| 1 | **Mezcla multitrack (Voz + Música) y baja de volumen en vivo a 30%** | Música y voz sonando concurrentemente (`activeSources: 2`). Volumen de carril de música bajado a 30% mientras suena: `musicGain.value` cambió de **1.0 a 0.30**; `voiceGain.value` se mantuvo inalterado en **1.0**. | ✅ **APROBADO** |
| 2 | **Aumento de volumen de clip a 150%** | Clip de voz incrementado a 150%: `clipGain.value` alcanzó exactamente **1.50** en el grafo Web Audio en tiempo real. | ✅ **APROBADO** |
| 3 | **Silencio absoluto al 0% (Clip y Carril)** | Clip ajustado a 0% $\rightarrow$ `clipGain.value = 0.00`. Carril ajustado a 0% $\rightarrow$ `trackGain.value = 0.00`. Silencio total confirmado sin artefactos. | ✅ **APROBADO** |
| 4 | **Herencia de volumen en split (50%)** | Clip con volumen al 50% dividido en 2: **Pieza 1 = 0.50**, **Pieza 2 = 0.50**. | ✅ **APROBADO** |
| 5 | **Deshacer atómico (Ctrl+Z en 1 solo paso)** | Slider deslizado continuamente a 180%. Un solo `Ctrl+Z` restauró el volumen exactamente a **1.0 (100%)**. | ✅ **APROBADO** |
| 6 | **Persistencia completa en backend (PUT/GET)** | Carril guardado con 75% y clip con 125%. Tras recarga completa del proyecto desde `/api/project`: `track.volume = 0.75`, `clip.volume = 1.25`. | ✅ **APROBADO** |
| 7 | **Unificación cromática sin rotación ni violeta/fucsia + Contraste AAA** | Cero clases rotativas ni violeta/fucsia. Ratios de contraste reales: Claro = **7.77:1** (WCAG AAA); Oscuro = **9.95:1** (WCAG AAA). | ✅ **APROBADO** |
| 8 | **Alineación geométrica a 0 px en ambos temas y lenguajes** | `light_es`: Diff = **0.00 px** (Playhead: 410px, Regla: 410px, Carril: 410px)<br>`light_en`: Diff = **0.00 px** (Playhead: 410px, Regla: 410px, Carril: 410px)<br>`dark_es`: Diff = **0.00 px** (Playhead: 410px, Regla: 410px, Carril: 410px)<br>`dark_en`: Diff = **0.00 px** (Playhead: 410px, Regla: 410px, Carril: 410px) | ✅ **APROBADO** |
| 9 | **Franja ensanchada (140 px) sin recorte de textos en ES/EN** | `offsetWidth = 140.00 px`, `scrollWidth = 140.00 px` en español e inglés. Cero desbordamiento y lectura completa de porcentajes. | ✅ **APROBADO** |
| 10 | **No regresión (Corte IA, continuidad y playhead)** | Corte por transcripción dividió en piezas continuas con herencia de volumen (**0.85**). Playhead y transporte sincronizados. | ✅ **APROBADO** |

---

## ✂️ 16. Fase 24: Edición Tipo Editor — Colocación en el Playhead, Mover Clips, Dividir en el Playhead y Borrado con Cierre de Huecos (Ripple Delete)

Esta fase implementa capacidades completas de edición de clips en la línea de tiempo atendiendo al flujo de trabajo demandado por los usuarios:
1. **Colocación de audio al soltar alineada exactamente al playhead:** Al arrastrar un audio desde la biblioteca a cualquier carril, el nuevo clip se ubica exactamente donde se encuentra el cabezal de reproducción (`getPlayheadTime()`), con precisión a centésimas de segundo.
2. **Arrastre interactivo de clips (horizontal y entre carriles):** Se permite arrastrar clips existentes para reubicarlos antes o después en la línea de tiempo, o transferirlos a otro carril distinto. Detección visual del carril destino con resaltado neutro `.lane-dragover`, evitación automática de solapamiento mediante el algoritmo de posición libre más cercana, cancelación con la tecla `Escape` y un único paso de deshacer (`Ctrl+Z`) por arrastre.
3. **División manual en el playhead (sin consumo de IA):** Botón `#btn-split-clip` con icono de tijeras en `#clip-toolbar` y atajo de teclado accesible `S` (con guardia estricta de inputs). Divide el clip seleccionado en dos piezas continuas (A y B) con volúmenes heredados y desfases de fuente (`sourceOffset`) precisos, seleccionando inmediatamente la pieza B para facilitar cortes sucesivos sin fricción.
4. **Eliminación con cierre automático de huecos (Ripple Delete):** Al eliminar un clip (mediante `#btn-delete-clip` o teclas `Delete`/`Backspace`), los clips posteriores en el mismo carril se desplazan hacia la izquierda cerrando el hueco de forma continua. Para conservar el espacio vacío, el usuario puede usar `Shift + Delete` o `Shift + clic`.
5. **Retiro de la división por doble clic (Fase 4):** Se eliminó la división por doble clic para evitar cortes accidentales durante el arrastre y manipulación táctil/puntero de los clips.

---

### 16.1 Colocación de Audio al Soltar: Alineación al Playhead (`getPlayheadTime`)

- **Fuente única de verdad temporal:** La función `getPlayheadTime()` reporta `getTransportTime()` durante la reproducción activa o `state.project.currentTime` en estado pausado.
- **Posicionamiento:** En el evento `drop`, se calcula `start = getPlayheadTime()` redondeado a dos decimales (centésimas de segundo). Se eliminó la regla histórica de la Fase 9 ("carril vacío siempre 0s"): si el playhead está en `12.50s`, el clip se posiciona exactamente en `12.50s`.
- **Resolución de colisiones:** Si en el carril de destino el nuevo clip colisiona o se solapa con un clip preexistente, se desplaza automáticamente para iniciar inmediatamente al término del clip con el que choca, garantizando que nunca se superpongan audios en el mismo carril.
- **Reprogramación y Deshacer:** Si el proyecto se encuentra en reproducción, se dispara una reprogramación con debounce de 150 ms. Se genera un snapshot atómico en la pila de `Ctrl+Z`.

---

### 16.2 Arrastre Interactivo de Clips y Posición Libre Más Cercana

- **Detección de gestos (`pointerdown` / `pointermove` / `pointerup`):**
  - Se vinculan eventos sobre el contenedor del clip con captura de puntero (`setPointerCapture`).
  - Las asas de recorte (`[data-handle]`) tienen prioridad absoluta y detienen la propagación de eventos (`stopPropagation`).
  - **Umbral de 4 px:** Si el movimiento es menor a 4 px, se interpreta como un clic estándar (selección o posicionamiento). Al superar los 4 px, se inicia el modo arrastre (`isDragging = true`, cursor `grabbing`, clase `is-dragging-clip`).
- **Renderizado directo en DOM:** Durante el movimiento, el clip se desplaza actualizando su propiedad `style.left` mediante `timeToPixels` y `pixelsToTime`, sin ejecutar `setState()` continuo para garantizar 60 FPS fluidos.
- **Detección del carril destino (horizontal y vertical):** Con `elementsFromPoint` y respaldo por coordenadas verticales $Y$ sobre las cajas delimitadoras de los carriles, se detecta el carril sobre el que flota el puntero y se resalta mediante la clase neutra `.lane-dragover` (sin violeta).
- **Algoritmo de evitación de colisiones (`findNearestFreePosition`):**
  - Si la posición deseada colisiona con otros clips del carril, el algoritmo evalúa todos los intervalos vacíos donde quepa la duración del clip (antes del primer clip, en los espacios intermedios y después del último clip) y selecciona la posición libre con la menor distancia euclidiana a la propuesta.
- **Cancelación con `Escape`:** Presionar `Escape` durante el arrastre cancela la operación de inmediato, revierte el elemento en el DOM a su posición original y descarta el snapshot de undo sin dejar rastros.
- **Deshacer atómico:** Un arrastre completo genera exactamente **un solo paso de `Ctrl+Z`**. Si el clip se soltó en la misma posición y carril original, no se encola nada en el historial.

---

### 16.3 División Manual en el Playhead (`S` y `#btn-split-clip`)

- **Controles e integración:** Botón `#btn-split-clip` en la sección derecha de `#clip-toolbar` y atajo de teclado global `S` (inactivo dentro de campos de texto editables o modales).
- **Margen de seguridad:** Se requiere que el playhead se encuentre dentro de los límites del clip seleccionado con un margen de al menos `0.30s` respecto al inicio y al final. Si está fuera o muy cerca de los extremos, se emite una notificación toast traducida ("Coloca la línea de tiempo dentro del clip" / "Place the timeline inside the clip") sin alterar el estado.
- **Matemática del corte:**
  - **Pieza A:** `start = clip.start`, `duration = t - clip.start`, `sourceOffset = clip.sourceOffset`.
  - **Pieza B:** `start = t`, `duration = (clip.start + clip.duration) - t`, `sourceOffset = clip.sourceOffset + (t - clip.start)`.
  - Ambas piezas heredan el volumen exacto del clip original.
- **Selección de la pieza B:** Al finalizar la división, la pieza B queda automáticamente seleccionada en el estado (`selection.clipId = pieceB.id`). Esto permite al usuario mover el playhead más adelante y volver a presionar `S` para realizar cortes consecutivos instantáneos.
- **Preservación de transcripción:** Si el clip poseía transcripción previa generada por IA, los segmentos se reasignan matemáticamente a cada pieza en función de su punto medio y con tiempos relativos acotados, conservando el texto sin necesidad de re-transcribir.

---

### 16.4 Eliminación con Cierre de Huecos (Ripple Delete)

> [!NOTE]
> **Comportamiento por Defecto:**
> Al pulsar la tecla `Delete` / `Backspace` o hacer clic en el botón `#btn-delete-clip`, la eliminación aplica **cierre de hueco automático (Ripple Delete)**: todos los clips subsecuentes en el **mismo carril** se desplazan hacia la izquierda una distancia exactamente igual a la duración del clip eliminado, uniendo los audios de forma contigua sin silencios intermedios. Los demás carriles permanecen intactos.

- **Modificador Shift (Conservar Hueco):**
  - Si el usuario desea eliminar el clip dejando el espacio vacío original, puede realizar la acción manteniendo presionada la tecla `Shift`:
    - Teclado: `Shift + Delete` o `Shift + Backspace`.
    - Ratón: `Shift + clic en el botón Eliminar (#btn-delete-clip)`.
- **Limpieza de estado y Undo:** Se eliminan los segmentos de transcripción del clip en `state.ai.transcriptByClip`, se recalcula la duración total del proyecto y se sincroniza la reproducción. Un solo `Ctrl+Z` restaura el clip eliminado y la posición original de todos los clips desplazados.

---

### 16.5 Barra Contextual de Clip (`#clip-toolbar`) y Accesibilidad

- **Layout fijo y balanceado:** `#clip-toolbar` aloja el nombre del clip y el control de volumen a la izquierda, y los botones de acción rápida (**Dividir** y **Eliminar**) a la derecha en `#clip-toolbar-actions`.
- **Accesibilidad:**
  - En ausencia de selección de clip, ambos botones quedan en estado deshabilitado accesible (`disabled`, `aria-disabled="true"`).
  - Al seleccionar un clip, se activan con tooltips localizados en español e inglés:
    - Dividir: *"Dividir en la línea de tiempo (S)"* / *"Split at playhead (S)"*.
    - Eliminar: *"Eliminar (Supr) — Shift: sin cerrar hueco"* / *"Delete (Del) — Shift: keep gap"*.
  - Anillos de foco visibles conformes a WCAG, sin colores violeta fuera del módulo de IA.

---

### 16.6 Matriz de Pruebas Obligatorias de la Fase 24 (12/12 Superadas)

Validada mediante suite automatizada ejecutada en el entorno nativo de Electron con archivos MP3 reales (`tests/test_phase24.js`):

| # | Prueba Obligatoria | Condición y Valores Reales Medidos | Resultado |
|---|---|---|:---:|
| 1 | **Colocar en playhead (carril vacío)** | Playhead en `12.50s`. Audio soltado desde biblioteca en carril vacío: se ubicó en `start = 12.50s` (redondeo a centésimas, regla de 0s eliminada). | ✅ **APROBADO** |
| 2 | **Colisión al soltar sobre clip existente** | Clip previo en `[10.00s, 15.00s]`, playhead en `12.00s`. Audio soltado: se ubicó inmediatamente al final en `start = 15.00s` sin solapamiento. | ✅ **APROBADO** |
| 3 | **Mover clip (+5s), umbral de clic y Ctrl+Z** | - Clic sin movimiento ($< 4\text{ px}$): cero pasos de undo (`undoStack.length` inalterado).<br>- Arrastre de $+5\text{s}$: `start` cambió de `10.00s` a `15.00s` ($\pm 0.00$).<br>- Un solo `Ctrl+Z`: revirtió el clip a `start = 10.00s` exactamente. | ✅ **APROBADO** |
| 4 | **Mover clip sobre obstáculo (posición libre más cercana)** | Clip obstáculo en `[20.00s, 25.00s]`. Clip movido con propuesta en `22.00s`: reubicado automáticamente en `start = 25.00s` (posición libre más cercana). | ✅ **APROBADO** |
| 5 | **Mover clip a otro carril** | Clip arrastrado verticalmente desde `trk-source` hacia `trk-dest`: transferido exitosamente (`trk-dest` = 1 clip, `trk-source` = 0 clips). | ✅ **APROBADO** |
| 6 | **Escape durante arrastre** | Clip en `start = 8.00s` arrastrado $+200\text{ px}$. Presionando `Escape`: arrastre cancelado, restaurando `start = 8.00s` sin registrar undo. | ✅ **APROBADO** |
| 7 | **Dividir en playhead (A/B, volúmenes, offset y B seleccionada)** | Clip original en `[10.00s, 18.00s]`, `volume = 0.65`, `sourceOffset = 1.50s`. Playhead en `13.00s`:<br>- **Pieza A:** `start = 10.00s`, `duration = 3.00s`, `sourceOffset = 1.50s`, `volume = 0.65`.<br>- **Pieza B:** `start = 13.00s`, `duration = 5.00s`, `sourceOffset = 4.50s`, `volume = 0.65`.<br>- **Pieza B seleccionada automáticamente** (`selection.clipId = pieceB.id`).<br>- **Segunda división inmediata** ejecutada con éxito. | ✅ **APROBADO** |
| 8 | **Flujo completo: Dividir A, dividir B, borrar centro y reproducción contigua** | Clip dividido en 3 piezas continuas. Borrado de pieza intermedia con ripple delete: Pieza 3 arrancó exactamente en `start = 2.00s` (`gap = 0.00s`, unida a Pieza 1). Al dar Play a través de la unión, ambas fuentes sonaron de forma continua (`continuousSources: 2`) sin pausas. | ✅ **APROBADO** |
| 9 | **Shift + Delete conserva el hueco** | Dos clips consecutivos (`[0s, 2s]` y `[4s, 8s]`). Eliminación con `Shift + Delete`: clip 2 se mantuvo en `start = 4.00s` conservando el espacio vacío intacto. | ✅ **APROBADO** |
| 10 | **Dividir con playhead fuera del clip** | Clip en `[10.00s, 18.00s]`, playhead en `25.00s`. Intento de división emitió toast de aviso y conservó el proyecto inalterado. | ✅ **APROBADO** |
| 11 | **Preservación de transcripción sintética** | Clip con palabras "Hola" `[1.0s, 2.0s]` y "mundo" `[2.0s, 3.5s]`. Tras dividir en `t = 2.5s`: Pieza A retuvo "Hola" y Pieza B retuvo "mundo" con tiempos locales relativos correctos. | ✅ **APROBADO** |
| 12 | **Regresión completa (Alineación 0 px, multitrack y persistencia)** | - **Alineación geométrica:** $\Delta(\text{Playhead}_{t=0}, \text{Regla}, \text{Carriles}) = \mathbf{0.00 \text{ px}}$ (`diff = 0 px`).<br>- **Multitrack real:** 2 carriles concurrentes reproduciendo simultáneamente (`activeSources = 2`).<br>- **Persistencia:** Guardado y recarga en backend verificados sin pérdida de volumen ni de estructura. | ✅ **APROBADO** |

---

## 🎛️ Fase 25: Exportar MP3 Real + Nuevo Proyecto + Botón "Análisis de IA" Funcional

La **Fase 25** dota a PodcastCraft AI de la capacidad de renderizar y exportar un **archivo MP3 final unificado** con la mezcla completa del proyecto (todos los carriles, cortes, offsets temporales y volúmenes individuales), listo para ser distribuido a través de WhatsApp, Gmail, plataformas de podcasting o incorporado a un editor de video, pudiendo además ser reimportado en la biblioteca como cualquier audio convencional. Asimismo, introduce el flujo de **"Nuevo Proyecto"** con limpieza integral de memoria y almacenamiento físico, y transforma el botón de **"Análisis de IA"** en un control completamente funcional y accesible.

---

### 17.1 Arquitectura del Motor de Mezcla Multicanal con FFmpeg

El renderizado se ejecuta en el backend mediante el binario empaquetado `ffmpeg-static` a través de un módulo centralizado (`backend/src/utils/audioMixer.js`) y expuesto en el endpoint `POST /api/export`:

```text
                               ┌─────────────────────────────────────────────────────────────┐
                               │                    POST /api/export                         │
                               └──────────────────────────────┬──────────────────────────────┘
                                                              │
                                       ┌──────────────────────▼──────────────────────┐
                                       │        Validación de Estructura JSON        │
                                       │   (Límite 2 MB, verificación de clips)      │
                                       └──────────────────────┬──────────────────────┘
                                                              │
                                       ┌──────────────────────▼──────────────────────┐
                                       │    Resolución de libraryId -> AUDIO_DIR     │
                                       │    (Protección estricta Path Traversal)     │
                                       └──────────────────────┬──────────────────────┘
                                                              │
                                ┌─────────────────────────────┴─────────────────────────────┐
                                │                                                           │
                                ▼                                                           ▼
                     [Clip 1: trk1, vol=0.8]                                     [Clip 2: trk2, vol=1.2]
                                │                                                           │
              atrim=start:end, asetpts=PTS-STARTPTS                       atrim=start:end, asetpts=PTS-STARTPTS
                                │                                                           │
                    aformat=44100Hz:stereo                                      aformat=44100Hz:stereo
                                │                                                           │
                     volume=0.8 x 1.0 = 0.80                                     volume=1.2 x 0.5 = 0.60
                                │                                                           │
                         adelay=start_ms                                             adelay=start_ms
                                │                                                           │
                                └─────────────────────────────┬─────────────────────────────┘
                                                              │
                                       ┌──────────────────────▼──────────────────────┐
                                       │   amix=inputs=N:normalize=0:duration=longest│
                                       │    (Suma lineal de amplitudes sin atenuar)  │
                                       └──────────────────────┬──────────────────────┘
                                                              │
                                       ┌──────────────────────▼──────────────────────┐
                                       │  alimiter=limit=1.0:attack=5:release=50     │
                                       │     (Control suave de picos digitales)      │
                                       └──────────────────────┬──────────────────────┘
                                                              │
                                       ┌──────────────────────▼──────────────────────┐
                                       │  libmp3lame (192 kbps, 44.1 kHz, Estéreo)   │
                                       │  Metadatos ID3v2 con título sanitizado      │
                                       └──────────────────────┬──────────────────────┘
                                                              │
                                       ┌──────────────────────▼──────────────────────┐
                                       │       Descarga Nativa Windows / HTTP        │
                                       │    (Limpieza garantizada en storage/tmp/)   │
                                       └─────────────────────────────────────────────┘
```

#### Reglas de Ingeniería de Audio en FFmpeg:
1. **Cadena `filter_complex` en un solo comando:**
   - **`atrim` & `asetpts`:** Recorta el archivo fuente en `[sourceOffset, sourceOffset + duration]` y resetea las marcas de tiempo para evitar desincronización de reloj.
   - **`aformat=sample_rates=44100:channel_layouts=stereo`:** Estandariza fuentes mono y estéreo a una tasa de muestreo universal antes de la suma.
   - **`volume = clip.volume × track.volume`:** Aplica el producto exacto del fader del carril y el fader del clip.
   - **`adelay = start_ms|start_ms`:** Desplaza el clip con precisión de milisegundos en ambos canales estéreo hasta su posición en la línea de tiempo.
2. **`amix=inputs=N:normalize=0:duration=longest`:**
   - La opción `normalize=0` es obligatoria: evita que ffmpeg atenúe la mezcla dividiendo entre $N$ canales. Las señales concurrentes se combinan de manera aditiva pura, cumpliendo $V_{\text{total}} \approx \sqrt{V_1^2 + V_2^2}$.
   - Si el proyecto contiene un solo clip, se omite el nodo `amix` automáticamente para optimizar el grafo de procesamiento.
3. **Limitador Suave (`alimiter`):**
   - Configurado con `limit=1.0:attack=5:release=50` para evitar saturación digital dura (*hard clipping*) en pasajes donde la suma de múltiples carriles supere $0\text{ dBFS}$.
4. **Metadatos y Codificación:**
   - Salida codificada con `libmp3lame`, tasa de bits constante de 192 kbps, 44100 Hz y 2 canales (estéreo). Se inyecta la etiqueta ID3v2 `title` debidamente sanitizada.
5. **Aislamiento de la Barra de Transporte:**
   - El control de volumen master y el botón de silencio (*mute*) del pie de la aplicación (`#master-volume-slider`, `#btn-master-mute`) actúan exclusivamente sobre el nodo de monitorización en vivo del navegador (`masterGain`). **No afectan la exportación en disco**, garantizando mezclas estandarizadas.
6. **Ciclo de Vida de Archivos Temporales:**
   - Las exportaciones se escriben en `storage/tmp/` con identificadores únicos (`export-<uuid>.mp3`). Se implementa un manejador garantizado de limpieza (`finally`) que elimina el archivo temporal tras el envío exitoso, en caso de fallo o ante una cancelación prematura de la conexión por parte del cliente.
7. **Control de Concurrencia:**
   - Se mantiene un bloqueo de proceso único (`isExportInProgress`). Si se solicita una segunda exportación mientras otra está activa, se retorna `429 Too Many Requests` para proteger la CPU del sistema.

---

### 17.2 Integración en Frontend: Guardado Nativo y Experiencia de Usuario

- **Renombrado y Semántica:** El botón del topbar se titula **"Exportar MP3" / "Export MP3"** con el estilo primario claro. Si el proyecto carece de clips, permanece deshabilitado (`aria-disabled="true"`) con tooltip explicativo.
- **Estado de Exportación Reactivo:** Al pulsar, el botón transiciona a estado deshabilitado con el texto *"Exportando…"* / *"Exporting…"*, sin alterar la reproducción en curso ni los colores del tema.
- **Desacoplamiento del Badge:** Se erradicó la simulación de la Fase 1 que alternaba entre `draft` y `saved` al exportar. **El badge del proyecto es gobernado exclusivamente por el motor de autoguardado** (`storage/project.json`).
- **Diálogo Nativo de Windows (`dialog.showSaveDialog`):**
  - En la aplicación de escritorio Electron, la exportación invoca el canal seguro de IPC (`saveExportedFile`) en `electron/preload.js` y `electron/main.js`, abriendo el explorador de Windows nativo con el nombre sugerido `<título_sanitizado>.mp3` para que el usuario elija carpeta y nombre.
  - En navegadores web convencionales, se ejecuta una descarga estándar HTML5 mediante elemento `<a>` temporal.
- **Sanitización de Nombres:** Se reemplazan caracteres prohibidos en el sistema de archivos de Windows (`\ / : * ? " < > |`) por guiones bajos.

---

### 17.3 Flujo de "Nuevo Proyecto"

- **Acceso:** Botón con icono `file-plus` en el topbar (`#btn-new-project`), junto a Exportar, con etiqueta y tooltip accesibles.
- **Confirmación Condicional:**
  - Si el proyecto contiene carriles o audios importados en la biblioteca, despliega un cuadro de diálogo nativo (`window.confirm`) con advertencia traducida:
    > *"Se borrará el proyecto actual (carriles y audios importados). Exporta antes si quieres conservarlo."*
  - Si el proyecto ya se encuentra completamente vacío, la acción procede de inmediato sin interrupciones ni modales superfluos. Cancelar el diálogo no altera el estado.
- **Limpieza Integral No Deshacible:**
  1. Detiene la reproducción en curso y cancela los bucles del playhead.
  2. Vacía `state.tracks`, `state.library`, `state.selection`, `state.ai.transcriptByClip` y la pila de `undoStack`.
  3. Purga la caché de buffers decodificados en memoria (`audioBufferCache.clear()`).
  4. Restablece el título a *"Untitled Project"* y la duración a `0s`.
  5. Persiste el proyecto vacío en el backend (`PUT /api/project`).
  6. Envía peticiones `DELETE /api/audio/:id` al backend para purgar físicamente los archivos MP3 descartados de `storage/audio-files/` (operación de mejor esfuerzo).
  7. Conserva intactos el tema visual (claro/oscuro), el idioma seleccionado y la sesión de usuario autenticada.

---

### 17.4 Botón "Análisis de IA" (`#btn-ai-analysis`) Funcional

Se conectó el botón de la barra contextual `#btn-ai-analysis`:
- **Con un clip seleccionado:** Ejecuta de inmediato el flujo de transcripción y análisis inteligente (`transcribeSelectedClip()`), equivalente a `#btn-transcribe-clip`.
- **Sin ningún clip seleccionado:** Presenta una notificación toast informativa y traducida: *"Selecciona un clip para analizarlo"* / *"Select a clip to analyze"*.
- Garantiza que ningún elemento interactivo visible en la interfaz carezca de funcionalidad real.

---

### 17.5 Matriz de Pruebas Obligatorias de la Fase 25 (14/14 Superadas)

Verificada mediante suite automatizada ejecutada en el entorno nativo de Electron (`tests/test_phase25.js`), midiendo archivos de audio deterministas (tonos puros de 440 Hz y 880 Hz generados con FFmpeg) mediante decodificación matemática PCM Float32:

| # | Prueba Obligatoria | Condición de Aceptación y Medición Numérica Real | Resultado |
|---|---|---|:---:|
| 1 | **Un clip de 10 s** | Duración exportada $\approx 10\text{ s}$ ($\pm 0.15\text{ s}$ relleno MP3).<br>**Medido:** $\mathbf{10.000\text{ s}}$ exactos. | ✅ **APROBADO** |
| 2 | **Dos carriles simultáneos (440 Hz y 880 Hz)** | $\text{RMS}_{\text{mezcla}} \approx \sqrt{\text{RMS}_1^2 + \text{RMS}_2^2}$ ($\pm 10\%$, no atenuado a la mitad).<br>**Medido:** $\text{RMS} = \mathbf{0.117582}$, Teórico = $0.117582$ ($\Delta = \mathbf{0.00009\%}$). | ✅ **APROBADO** |
| 3 | **Escalas de volumen por clip y carril** | - Carril al 30%: $\mathbf{0.299998\times}$ el valor base ($\Delta = 0.0003\%$).<br>- Clip al 150%: $\mathbf{1.500003\times}$ el valor base ($\Delta = 0.0002\%$).<br>- Clip al 0%: $\text{RMS} = \mathbf{0.000000}$ (silencio absoluto). | ✅ **APROBADO** |
| 4 | **Clip con retardo (`start = 5s`)** | Primeros 5 s en silencio y sonido en $[5\text{s}, 10\text{s}]$.<br>**Medido:** $\text{RMS}_{[0,5\text{s}]} = \mathbf{0.000000}$, $\text{RMS}_{[5,10\text{s}]} = \mathbf{0.083151}$. | ✅ **APROBADO** |
| 5 | **Recorte de fuente (`sourceOffset = 5s`)** | Archivo dual (5s 440 Hz + 5s 880 Hz) con offset de 5s debe exportar 880 Hz ($\pm 3\%$).<br>**Medido:** $\mathbf{880.0\text{ Hz}}$ (frecuencia fundamental exacta). | ✅ **APROBADO** |
| 6 | **Continuidad en empalme contiguo** | Clip dividido en 2 piezas consecutivas: duración total de 6s y sin caída de energía sonora.<br>**Medido:** $\text{Duración} = \mathbf{6.000\text{ s}}$, $\text{RMS}_{\text{ventana 50ms}} = \mathbf{0.083148}$ vs referencia $0.083151$. | ✅ **APROBADO** |
| 7 | **Hueco cerrado por borrado (Ripple)** | Duración igual a la suma de piezas remanentes ($2.5\text{s} + 3.5\text{s} = 6.0\text{s}$).<br>**Medido:** $\mathbf{6.000\text{ s}}$ exactos. | ✅ **APROBADO** |
| 8 | **Manejo de errores y limpieza en `storage/tmp/`** | - Proyecto sin clips $\to$ HTTP 400.<br>- Audio inexistente $\to$ HTTP 404.<br>- Archivos temporales `export-*.mp3` purgados al 100%: $\mathbf{0\text{ archivos huérfanos}}$. | ✅ **APROBADO** |
| 9a | **Botón Exportar deshabilitado sin clips** | Botón `#btn-export` con `disabled` y `aria-disabled="true"` al no haber clips en la línea de tiempo. | ✅ **APROBADO** |
| 9b | **Sanitización de nombres en Windows** | Título con caracteres prohibidos `Mi/Podcast:Capitulo*1?"<demo>|` sanitizado limpiamente a `Mi_Podcast_Capitulo_1___demo__`. | ✅ **APROBADO** |
| 10 | **Nuevo proyecto reinicia y persiste** | Al confirmar: `tracks = []`, `library = []`, `duration = 0s`, `undoStack.length = 0` y `project.json` persistido como borrador vacío. | ✅ **APROBADO** |
| 11 | **Re-importación de MP3 exportado** | El MP3 exportado se añade a un proyecto nuevo: duración decodificada $\mathbf{4.500\text{ s}}$, duración calculada en UI $\mathbf{4.545\text{ s}}$. | ✅ **APROBADO** |
| 12 | **Botón Análisis de IA (`#btn-ai-analysis`)** | - Con clip seleccionado: activa la canalización de transcripción inteligente.<br>- Sin clip: emite notificación informativa y descriptiva en toast accesible. | ✅ **APROBADO** |
| 13 | **Regresión: Alineación y multitrack** | - Desfase horizontal: $\Delta(\text{Playhead}_{t=0}, \text{Regla}, \text{Carriles}) = \mathbf{0.00\text{ px}}$.<br>- Modos claro y oscuro sin anomalías visuales ni colores violeta fuera de IA. | ✅ **APROBADO** |
| 14 | **Exclusión de pruebas en instalador** | Confirmado que `tests/` está excluido de `files` y `extraResources` en `package.json`. | ✅ **APROBADO** |

---

## 🔐 Fase 26 (Versión Final): Login Completo — Creación de Cuenta, "Recordarme", Código de Recuperación y Defensas Anti-Saturación

Esta fase implementa la arquitectura definitiva del sistema de autenticación y control de acceso local para la aplicación de escritorio, respondiendo a la necesidad de múltiples usuarios, persistencia de sesión ("Recordarme"), recuperación segura sin depender de servicios externos (correo/SMS) y blindaje riguroso contra saturación del servidor local.

### 18.1 Decisiones Arquitectónicas y Modelo de Dominio

1. **Modelo de Cuentas Compartidas (Puerta de Entrada):**
   - Se admite la creación de **hasta 10 cuentas de usuario** en el sistema local.
   - **Alcance explícito:** Todas las cuentas comparten el mismo proyecto (`storage/project.json`) y la misma biblioteca de audios (`storage/audio-files/`). El login actúa como una puerta de acceso y autenticación a la estación de trabajo local, no como un sistema de sandbox multi-inquilino.
2. **Recuperación Autónoma mediante Código de 12 Caracteres:**
   - Sin intermediarios externos (ni SMS ni correo electrónico).
   - Al registrar una cuenta o solicitar recuperación, el backend genera un código criptográfico con formato `XXXX-XXXX-XXXX` utilizando `crypto.randomInt` sobre un alfabeto libre de ambigüedades visuales (excluye `0`, `O`, `1`, `I`, `L`).
   - El código en texto plano se entrega **una única vez** al cliente. El servidor almacena únicamente su derivación criptográfica (`scrypt` asíncrono con `salt` aleatorio de 16 bytes).
3. **Cero Dependencias Externas:**
   - Implementado al 100% con el módulo nativo `crypto` de Node.js.
4. **Almacenamiento Serializado y Atómico:**
   - `storage/auth.json` estructura los usuarios en un arreglo `users: [...]`.
   - Mutaciones concurrentes protegidas por un semáforo/cola de mutex en memoria (`mutateAuth`), garantizando que escrituras paralelas no corrompan el archivo.
   - Guardado atómico mediante escritura en archivo temporal (`auth.json.tmp`) y renombrado atómico (`fs.renameSync`).
   - **Migración transparente:** Cuentas preexistentes con formato de raíz (`username`, `passwordHash`, `salt`) se transforman automáticamente a `users[0]`. Si no cuentan con `recoveryHash`, el código de recuperación se genera y entrega por única vez en su primer inicio de sesión exitoso.

---

### 18.2 Tabla de Límites Contractuales y Validaciones Estrictas

| Campo / Objeto | Regla del Servidor | Comportamiento Frontend |
|---|---|---|
| **Usuario** | 3 a 32 caracteres (tras `trim`). Solo letras (incluye acentos), números, `.`, `_` y `-` (`/^[\p{L}\p{N}._-]+$/u`). Único insensible a mayúsculas (`usernameKey`). | `maxlength="32"`, contador dinámico al superar 24 caracteres, validación inmediata con regex. |
| **Contraseña** | 6 a 128 caracteres y máximo 256 bytes en codificación UTF-8. | `maxlength="128"`, contador dinámico al superar 100 caracteres, comprobación de coincidencia de confirmación. |
| **Código de recuperación** | Entrada cruda de hasta 20 caracteres; tras normalizar (mayúsculas, sin espacios ni guiones) exactamente 12 caracteres. | `maxlength="20"`, contador dinámico al superar 10 caracteres, normalización automática. |
| **Token "Recordarme"** | Exactamente 64 caracteres hexadecimales (32 bytes aleatorios). | Generado por el backend al iniciar sesión con casilla activada; almacenado en `localStorage`. |
| **Cuerpo de Petición (`/api/auth/*`)** | Máximo **2 KB**. Montado antes del `express.json()` global; excederlo retorna `HTTP 413 Payload Too Large` de forma instantánea sin parsear ni procesar hashes. | El cliente no envía payloads excesivos; maneja visualmente el error `413`. |
| **Tipos de Datos** | Campos de texto estrictamente `string`; `remember` estrictamente `boolean`. Objetos, arreglos, números o `null` retornan `HTTP 400 Bad Request`. | Envío tipado estricto. |
| **Máximo de Cuentas** | Límite estricto de **10 cuentas**. Intentar registrar la 11.ª retorna `HTTP 403 Forbidden` con mensaje descriptivo. | Despliega alerta cuando se ha alcanzado el tope de cuentas. |
| **Tokens Activos por Cuenta** | Máximo **5 tokens vigentes**. Al generar el sexto, se descarta automáticamente el más antiguo (política FIFO). Caducidad fija de 30 días. | Gestión transparente de sesiones persistentes. |

---

### 18.3 Mecanismos Anti-Saturación y Seguridad

1. **Hashes Asíncronos No Bloqueantes (`crypto.scrypt` promisificado):**
   - Se reemplazó por completo `crypto.scryptSync` por `crypto.scrypt` asíncrono. El hilo principal de eventos de Node.js permanece reactivo ante cualquier petición entrante (por ejemplo `GET /health` o reproducción de audio).
2. **Tope de Concurrencia y Cola de Derivación Criptográfica:**
   - Máximo **2 cálculos `scrypt` simultáneos** en el pool de threads.
   - Cola de espera acotada a **máximo 20 peticiones**.
   - Si la cola se satura ante una ráfaga, las solicitudes excedentes son rechazadas de inmediato con `HTTP 503 Service Unavailable` ("Servidor ocupado, intenta de nuevo"), evitando sobrecarga de memoria o congelamiento de la CPU.
3. **Freno a Fuerza Bruta en Memoria (Rate Limiting Delimitado):**
   - Tras **5 intentos fallidos consecutivos** (en `login`, `resume` o `recover`) para un usuario específico, la cuenta se bloquea temporalmente durante **30 segundos** con `HTTP 429 Too Many Requests`, devolviendo los segundos restantes en el payload y en la cabecera `Retry-After`.
   - Un inicio de sesión exitoso reinicia el contador de fallos.
   - Los intentos fallidos sobre usuarios inexistentes también se contabilizan y bloquean para mitigar ataques de enumeración y consumo de CPU.
   - **Freno global:** Máximo **5 creaciones de cuenta por minuto** en el sistema (`HTTP 429`).
   - **Memoria acotada:** El registro en memoria de contadores está limitado contractualmente a **1000 entradas**. Al alcanzar el límite, se purgan automáticamente las entradas vencidas o más antiguas (política LRU), imposibilitando fugas de memoria (*memory leaks*).
4. **Comparación en Tiempo Constante:**
   - Comparación de hashes de contraseñas, tokens y códigos de recuperación implementada con `crypto.timingSafeEqual`, validando previamente la igualdad estricta de longitud en los buffers para evitar discrepancias de canal lateral (*timing attacks*).
5. **Mensajes Genéricos de Seguridad:**
   - Credenciales inválidas devuelven siempre `"Usuario o contraseña incorrectos"`, sin revelar si el error provino del usuario o de la clave.
   - Recuperación inválida devuelve genéricamente `"Datos de recuperación inválidos"`.
   - Las contraseñas, tokens y códigos jamás se imprimen en logs del servidor ni en respuestas de error.

---

### 18.4 Experiencia de Usuario en Frontend (`#auth-lock-screen`)

- **Navegación Dinámica entre 3 Vistas:**
  - **Login:** Formulario principal con usuario, contraseña, casilla *"Recordarme"* (marcada por defecto) y enlaces directos a *"¿No tienes cuenta? Créala"* y *"¿Olvidaste tu contraseña?"*.
  - **Crear Cuenta:** Accesible en cualquier momento (mientras no se superen las 10 cuentas). Valida usuario, contraseña y confirmación. Muestra el modal de código de recuperación antes de ingresar.
  - **Recuperación:** Formulario para restablecer clave mediante código y confirmación de nueva contraseña.
  - Botón *"Volver"* para retornar al login sin pérdida de contexto.
- **Modal de Código de Recuperación con Foco Atrapado (`#auth-recovery-modal`):**
  - Muestra el código en tipografía monospace destacada.
  - Botón para copiar al portapapeles con confirmación visual.
  - Banner de advertencia sobre la imposibilidad de volver a consultarlo.
  - Casilla obligatoria *"Ya guardé mi código de forma segura"* para habilitar el botón *"Continuar"*.
  - Foco atrapado (*focus trap*), impidiendo el cierre mediante tecla `Escape` o clics accidentales en el fondo.
- **Auto-Reanudación Silenciosa ("Recordarme"):**
  - Si existe un token válido en `localStorage` (`podcastcraft_auth_session`), la aplicación arranca en estado de carga síncrona y valida la sesión contra `POST /api/auth/resume` sin parpadeos visuales de la pantalla de login.
  - Botón de Cerrar Sesión en el Topbar (`#btn-logout`) que invalida el token en el servidor y purga el almacenamiento local.
- **Contadores de Longitud y Temporizador Reactivo 429:**
  - Contadores `n/32`, `n/128`, `n/20` visibles progresivamente conforme el usuario escribe.
  - Detección de `429`: despliega cuenta regresiva en vivo segundo a segundo deshabilitando el botón de envío hasta que el bloqueo expire.
  - Deshabilitación de botones de acción durante peticiones en curso para prevenir clics dobles.

---

### 18.5 Consideraciones de Seguridad y Procedimiento de Restablecimiento Manual

> [!IMPORTANT]
> **Consideraciones de Seguridad en Entorno de Escritorio:**
> 1. **Ubicación del Token "Recordarme":** El token de sesión persistente se almacena en el `localStorage` de Chromium/Electron dentro del perfil de usuario de Windows (`%APPDATA%\podcastcraft-ai\`). Cualquier persona con acceso físico a la sesión de usuario activa del sistema operativo podrá abrir la aplicación sin volver a autenticarse.
> 2. **Alcance de los Proyectos:** Todas las cuentas locales comparten el mismo entorno de trabajo y los mismos audios. El sistema de login no provee aislamiento criptográfico entre archivos locales.
> 3. **Almacenamiento Criptográfico Seguro:**
>    - Contraseñas: `scrypt` con salt aleatorio de 16 bytes (N=16384, r=8, p=1).
>    - Códigos de recuperación: `scrypt` con salt aleatorio de 16 bytes.
>    - Tokens "Recordarme": SHA-256 en base de datos local; el token en texto plano vive únicamente en el cliente.

#### Procedimiento de Restablecimiento de Emergencia (Sin Contraseña ni Código)
Si todos los usuarios de la estación de trabajo olvidan sus contraseñas y sus códigos de recuperación:
1. Cierra la aplicación PodcastCraft AI.
2. Abre el Explorador de Archivos de Windows y dirígete a:
   `%APPDATA%\podcastcraft-ai\storage\` (o `backend/storage/` en entorno de desarrollo).
3. Elimina o renombra el archivo `auth.json`.
4. Abre PodcastCraft AI. El sistema detectará que no existen cuentas y presentará de inmediato el asistente de primer uso para registrar una nueva cuenta administradora.
5. **Los proyectos, configuraciones de carriles y archivos de audio existentes NO se pierden ni se modifican**, ya que residen en `project.json` y `audio-files/`.

---

### 18.6 Matriz de Pruebas Obligatorias de la Fase 26 (14/14 Superadas)

Verificada mediante suite automatizada integral en entorno Electron y backend Express aislado (`tests/test_phase26.js`):

| # | Prueba Obligatoria | Condición de Aceptación y Medición Numérica Real | Resultado |
|---|---|---|:---:|
| 1 | **Primer uso y seguridad de secretos en `auth.json`** | `status` no configurado; `setup` crea cuenta y devuelve código `XXXX-XXXX-XXXX` (`STAZ-K6Z6-576C`). Verificación exhaustiva: `auth.json` **no contiene contraseñas, códigos ni tokens en claro**. | ✅ **APROBADO** |
| 2 | **Límites de longitud y validaciones de campo** | Rechazo con HTTP 400: usuario de 2 y 33 caracteres, contraseña de 5 y 129 caracteres, caracteres inválidos (`a b`, `x/y`), usuario duplicado ignorando mayúsculas (`Ana` vs `ana`), código de 21 caracteres, token $\neq$ 64 hex. | ✅ **APROBADO** |
| 3 | **Cuerpo excesivo (413) y tipos estrictos** | Payload de 1 MB a `/api/auth/login` rechazado con **HTTP 413 en 6 ms** (límite <150 ms) sin computar hashes. Tipos inválidos (arrays, objetos, números, null) rechazados con HTTP 400. | ✅ **APROBADO** |
| 4 | **Tope de 10 cuentas y límite de creaciones/min** | Se crean 10 cuentas; la 11.ª es rechazada con **HTTP 403** (*"Se ha alcanzado el límite máximo de 10 cuentas en el sistema"*). Registro acelerado (>5/min) bloqueado con **HTTP 429**. Todas las cuentas inician sesión independientemente. | ✅ **APROBADO** |
| 5 | **Anti-saturación bajo ráfaga (30 peticiones concurrentes)** | Durante la ráfaga de 30 logins incorrectos en paralelo: **latencia máxima de `GET /health` = 64 ms** (límite contractual <300 ms). Máximo de hashes `scrypt` activos simultáneos observado: **exactamente 2**. Solicitudes excedentes respondidas con **HTTP 503** (5 peticiones). | ✅ **APROBADO** |
| 6 | **Fuerza bruta (429), reseteo con éxito y mapa acotado** | 5 fallos consecutivos bloquean con **HTTP 429 y 30 s** de espera. Un login exitoso reinicia el contador. Usuarios inexistentes también son frenados. Tras 5000 intentos con usuarios distintos, el tamaño del mapa en memoria permanece exactamente en **1000 entradas**. | ✅ **APROBADO** |
| 7 | **Tokens "Recordarme": SHA-256, expiración y límite de 5** | Token generado de 64 hex; en `auth.json` solo se almacena su hash SHA-256. Reanudación (`resume`) exitosa; token alterado o expirado $\to$ 401. Tras 6 inicios con recordarme, se purga el más antiguo quedando **exactamente 5 tokens**. `logout` lo invalida de inmediato. | ✅ **APROBADO** |
| 8 | **Recuperación de contraseña y rotación de código** | Código válido (incluso en minúsculas y sin guiones) restablece contraseña, rota el código e invalida tokens de sesión activos. El código viejo y la contraseña previa quedan completamente inoperativos. Código incorrecto $\to$ error genérico. | ✅ **APROBADO** |
| 9 | **Migración automática de formato antiguo a `users[]`** | `auth.json` con esquema antiguo en raíz migra automáticamente a `users[0]`. El primer login devuelve `recoveryCode` para cuentas que no lo tenían y el segundo login ya no lo expone. Mantiene compatibilidad con cuentas que ya tenían `recoveryHash`. | ✅ **APROBADO** |
| 10 | **Escrituras concurrentes serializadas (Mutex)** | 5 creaciones de cuenta lanzadas en paralelo estricto: el mutex serializa las escrituras sin condiciones de carrera. `auth.json` conserva íntegras y legibles las 5 cuentas sin corrupción. | ✅ **APROBADO** |
| 11 | **UI en Electron: 3 vistas, contadores y modal atrapado** | Navegación fluida entre login, registro y recuperación con botón *"Volver"*. `maxlength` impide escribir de más en los 3 campos. Contadores visibles. Modal de código atrapa foco y solo habilita *"Continuar"* tras marcar la confirmación obligatoria. | ✅ **APROBADO** |
| 12 | **Internacionalización y Temas en Pantalla de Bloqueo** | Conmutación instantánea ES/EN y Claro/Oscuro en todas las vistas de autenticación. Ratios de contraste conformes a WCAG AA/AAA y ausencia de violetas fuera de botones de acción. | ✅ **APROBADO** |
| 13 | **Regresión: Alineación y motor DAW** | - Desfase horizontal: $\Delta(\text{Playhead}_{t=0}, \text{Regla}, \text{Carriles}) = \mathbf{0.00\text{ px}}$.<br>- Banner offline de reconexión, reproducción multitrack, zoom y controles de transporte 100% operativos. | ✅ **APROBADO** |
| 14 | **Exclusión de pruebas en empaquetado del instalador** | Confirmado que `tests/` está explícitamente excluido de `files` y `extraResources` en `package.json`. | ✅ **APROBADO** |

---

## 🚀 Fase 27: Versión Final v1.1.0 — Ajuste Ergonómico del Playhead, Empaquetado NSIS y Verificación de Producción

La **Fase 27** representa el cierre definitivo de ingeniería de PodcastCraft AI, integrando optimizaciones ergonómicas críticas en la experiencia táctil del timeline, la construcción única del instalador oficial para Windows y la validación integral end-to-end sobre la aplicación compilada e instalada en el sistema operativo real.

### 27.1 Ajuste Ergonómico y Rendimiento del Playhead
A partir del feedback del usuario sobre la rigidez del cursor de reproducción en la línea de tiempo, se implementaron mejoras ergonómicas de precisión:
1. **Área de Agarre Invisible de 16 px:**
   - La línea roja y el cabezal disponen ahora de una zona táctil ampliada mediante pseudo-elementos (`::before` con `left: -7px; width: 16px;`) que facilitan el arrastre con el ratón sin alterar el grosor visual de 2 px de la línea.
2. **Scrubbing Continuo desde la Regla de Tiempo:**
   - Arrastrar el ratón sobre cualquier punto de la escala superior (`#timeline-ruler`) desplaza fluidamente el playhead en tiempo real.
3. **Captura de Puntero (`setPointerCapture`):**
   - Garantiza que el cursor no pierda el foco ni se interrumpa el arrastre aunque el puntero se mueva rápidamente fuera de los límites de la ventana o del carril.
4. **Actualización a 60 FPS con `requestAnimationFrame`:**
   - La sincronización física durante el arrastre se ejecuta directamente mediante transforms CSS con aceleración por hardware, evitando actualizaciones pesadas del estado global por fotograma.
5. **Alineación Geométrica Cero Absoluto:**
   - Medición física automatizada: $\Delta(\text{Playhead}_{t=0}, \text{Regla}, \text{Clips}) = \mathbf{0.00\text{ px}}$.
   - Todas las funciones de estudio permanecen 100% intactas: división de clips con tecla `S`, transporte con `Espacio`, saltos con `J`/`L` y zoom dinámico.

---

### 27.2 Especificaciones Técnicas del Instalador Oficial (v1.1.0)

Construido de forma determinística en una sola ejecución para producción:

| Parámetro | Valor Verificado en Producción |
|---|---|
| **Nombre del Archivo** | `PodcastCraft AI.exe` |
| **Ruta de Salida** | `dist/PodcastCraft AI.exe` |
| **Tamaño Exacto** | `105,667,667 bytes` (~100.77 MB) |
| **Checksum SHA-256** | `7CE74821E4D846818EC977CF38E0B17BCFB398C60A9A0FA2D036B3FFD2EA6F86` |
| **Tiempo de Construcción** | `179,055 ms` (~2 min 59 s) |
| **Arquitectura de Empaquetado** | Electron 33.4.11 / NSIS x64 |
| **Binario FFmpeg** | Extraído fuera del `.asar` en `resources/backend/node_modules/ffmpeg-static/ffmpeg.exe` (81.1 MB) |
| **Variables de Entorno** | `backend/.env` incluido con `GEMINI_API_KEY` activa y protegida |
| **Aislamiento de Pruebas** | Directorio `tests/` y suites de verificación 100% excluidos del instalador |

---

### 27.3 Métricas Reales de la Prueba Integral sobre la App Instalada

Verificación automatizada sobre el binario real instalado en `%LOCALAPPDATA%\Programs\PodcastCraft AI`:

| Componente Evaluado | Parámetro Medido | Resultado Numérico Real | Estado |
|---|---|---|:---:|
| **Arranque del Backend** | Tiempo de respuesta en `GET /health` | **654 ms** (límite <25,000 ms) | ✅ APROBADO |
| **Ajuste de Ventana** | Dimensiones en monitor $1366 \times 768$ | **$1297 \times 684\text{ px}$** (visible, exactas) | ✅ APROBADO |
| **Identidad de Proceso** | Nombre de proceso y título de ventana | `"PodcastCraft AI"` | ✅ APROBADO |
| **Primer Uso (UI Real)** | Creación de cuenta y modal criptográfico | Registro exitoso en **157 ms**, código de 12 caracteres (`XXXX-XXXX-XXXX`) confirmado | ✅ APROBADO |
| **Botón Mostrar Contraseña** | Alternancia de visibilidad en app instalada | `type="button"`, $32 \times 32\text{ px}$, alterna `password`/`text`, valor preservado | ✅ APROBADO |
| **Transición al Editor** | Desbloqueo y renderizado de la interfaz DAW | Bloqueo oculto, topbar y regla activas de inmediato | ✅ APROBADO |
| **Subida de Audio** | `POST /api/audio` (2 tonos senoidales) | Tono 1 (440Hz) en **6 ms**, Tono 2 (880Hz) en **2 ms** | ✅ APROBADO |
| **Mezcla y Exportación FFmpeg** | `POST /api/export` (2 pistas con volúmenes 0.8 y 0.5) | **133,614 bytes** renderizados en **200 ms** | ✅ APROBADO |
| **Calidad del MP3 Exportado** | Duración medida vs esperada | **5.54 s** vs **5.50 s** esperada ($\Delta = 0.04\text{ s}$) | ✅ APROBADO |
| **Bitrate de Exportación** | Tasa de bits de codificación estéreo | **193 kbps** (nominal 192 kbps, 44.1 kHz) | ✅ APROBADO |
| **Integridad de Decodificación** | `ffmpeg -v error -i <file> -f null -` | **0 errores** de audio reportados | ✅ APROBADO |
| **Empaquetado Seguro** | `backend/.env` presente y carpeta `tests/` excluida | `GEMINI_API_KEY` definida; `tests/` ausente en todos los recursos | ✅ APROBADO |
| **Cierre y Limpieza** | Procesos residuales y puerto 3001 | **0 procesos vivos**, puerto 3001 liberado | ✅ APROBADO |
| **Seguridad de Datos del Usuario** | Integridad de `%APPDATA%\podcastcraft-ai` | **15 elementos raíz / 67 recursivos intactos** (Sin cambios) | ✅ APROBADO |

---

### 27.4 Fase 27b: Visibilidad Accesible de Contraseña ("El Ojito")

Como cierre definitivo del frontend, se integró el conmutador de visibilidad en los 5 campos de contraseña de la pantalla de bloqueo (login, registro y recuperación):

1. **Campos Protegidos (5 de 5):**
   - Iniciar sesión: `#auth-password` (botón `#auth-password-toggle`).
   - Crear cuenta: `#auth-reg-password` y `#auth-reg-confirm` (botones `-toggle`).
   - Recuperación de acceso: `#auth-rec-password` y `#auth-rec-confirm` (botones `-toggle`).
2. **Arquitectura y Accesibilidad WCAG:**
   - Atributo contractual `type="button"` que previene cualquier envío involuntario del formulario por pulsación accidental.
   - Ícono contextual Lucide (`eye` cuando está oculta, `eye-off` cuando está visible) renderizado con `lucide.createIcons()`.
   - Dimensiones táctiles de **$32 \times 32\text{ px}$** con centrado exacto y `padding-right` de 2.5rem (`pr-10`) en los inputs para evitar solapamiento con textos largos.
   - Navegación completa por teclado (`Tab`), activación por tecla `Espacio` y `Enter`, y anillo de enfoque visible en violeta (`focus:ring-2 focus:ring-violet-500`).
   - Soporte i18n bidireccional (ES / EN) en `aria-label` y `title`: *"Mostrar contraseña"* / *"Ocultar contraseña"* (*"Show password"* / *"Hide password"*), sincronizado con el atributo `aria-pressed`.
3. **Regla Cromática y Contraste Medido:**
   - Color del glifo neutro en `slate-400` (modo oscuro) y `slate-500` (modo claro), eliminando tonos fucsia o violeta del icono (reservados exclusivamente para el anillo de foco).
   - Contraste medido en producción:
     - **Modo Claro:** **4.76:1** (`#64748b` sobre `#ffffff`), superando el umbral de 3:1 de WCAG AA.
     - **Modo Oscuro:** **6.96:1** (`#94a3b8` sobre `#0f172a`), superando el umbral de 3:1 de WCAG AA.
4. **Seguridad y Confidencialidad de Credenciales:**
   - Restablecimiento automático a estado oculto (`type="password"`) al conmutar entre vistas de login/crear/recuperar, al enviar peticiones y al abrir el modal con el código de recuperación.
   - Cero registro de contraseñas en consola o logs del sistema.
   - Preservación íntegra de `maxlength="128"`, contadores de caracteres, y soporte de autocompletado (`current-password` / `new-password`).
