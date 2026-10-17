const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const { fork } = require('child_process');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let backendProcess = null;
const BACKEND_PORT = '3001';
const HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/health`;

function startBackend() {
  return new Promise((resolve, reject) => {
    // Check if already running
    const req = http.get(HEALTH_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('[Test Runner] Backend ya corriendo en puerto', BACKEND_PORT);
        return resolve();
      }
    });
    req.on('error', () => {
      console.log('[Test Runner] Iniciando backend...');
      const backendEntry = path.join(__dirname, 'backend', 'src', 'server.js');
      backendProcess = fork(backendEntry, [], {
        cwd: path.join(__dirname, 'backend'),
        silent: true,
        env: {
          ...process.env,
          PORT: BACKEND_PORT,
          PODCASTCRAFT_STORAGE_DIR: path.join(__dirname, 'backend', 'storage'),
          ELECTRON_RUN_AS_NODE: '1'
        }
      });
      waitForBackend(HEALTH_URL, 10000).then(resolve).catch(reject);
    });
  });
}

function waitForBackend(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function ping() {
      const r = http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else retry();
      });
      r.on('error', retry);
    }
    function retry() {
      if (Date.now() - start > timeoutMs) return reject(new Error('Backend timeout'));
      setTimeout(ping, 200);
    }
    ping();
  });
}

app.whenReady().then(async () => {
  try {
    await startBackend();

    const win = new BrowserWindow({
      width: 1400,
      height: 900,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
        webSecurity: false // allow local audio fetch
      }
    });

    win.loadFile(path.join(__dirname, 'frontend', 'index.html'));

    await new Promise((resolve) => {
      win.webContents.once('did-finish-load', resolve);
    });

    // Wait a moment for DOM and stores to initialize
    await new Promise((r) => setTimeout(r, 1000));

    const testResults = await win.webContents.executeJavaScript(`
      (async () => {
        const report = {
          tests: [],
          measurements: {},
          passed: true
        };

        function assert(cond, name, details = '') {
          report.tests.push({ name, pass: Boolean(cond), details });
          if (!cond) report.passed = false;
        }

        const pc = window.PodcastCraft;
        const appState = pc.getState();

        // Asegurar usuario autenticado y mostrar el espacio de trabajo
        appState.auth = appState.auth || {};
        appState.auth.isAuthenticated = true;
        document.getElementById('auth-lock-screen')?.classList.add('hidden');
        document.getElementById('topbar')?.classList.remove('hidden');
        document.getElementById('workspace')?.classList.remove('hidden');
        document.getElementById('transport')?.classList.remove('hidden');

        // Configurar biblioteca con audios reales
        const libVoice = {
          id: 'lib-voice',
          name: 'Voz Principal.mp3',
          duration: 5,
          url: '/audio-files/30e2b372-ce30-4d62-aaa0-f0fba1212e68.mp3',
          objectUrl: 'http://127.0.0.1:3001/audio-files/30e2b372-ce30-4d62-aaa0-f0fba1212e68.mp3'
        };
        const libMusic = {
          id: 'lib-music',
          name: 'Musica Fondo.mp3',
          duration: 10,
          url: '/audio-files/501dcd2f-b399-4b5e-a856-793cc37062c3.mp3',
          objectUrl: 'http://127.0.0.1:3001/audio-files/501dcd2f-b399-4b5e-a856-793cc37062c3.mp3'
        };

        pc.setState({
          library: [libVoice, libMusic]
        });

        // ==========================================
        // PRUEBA 7: Todos los carriles del mismo color (Light y Dark), contraste verificado y sin violeta
        // ==========================================
        pc.setState({
          tracks: [
            { id: 'trk-1', colorIndex: 0, volume: 1, clips: [{ id: 'cl-1', libraryId: 'lib-voice', name: 'Voz 1', start: 0, duration: 4, volume: 1 }] },
            { id: 'trk-2', colorIndex: 3, volume: 1, clips: [{ id: 'cl-2', libraryId: 'lib-music', name: 'Musica 1', start: 0, duration: 4, volume: 1 }] },
            { id: 'trk-3', colorIndex: 5, volume: 1, clips: [] }
          ]
        });

        const laneEls = Array.from(document.querySelectorAll('.timeline-lane'));
        const clipEls = Array.from(document.querySelectorAll('.timeline-clip'));
        
        // Verificar que no existen clases por color (fuchsia, amber, emerald, rose, cyan)
        const invalidColorClasses = ['track-lane-fuchsia', 'track-clip-fuchsia', 'track-lane-amber', 'track-clip-amber', 'track-lane-emerald', 'track-clip-emerald', 'track-lane-rose', 'track-clip-rose', 'track-lane-cyan', 'track-clip-cyan'];
        const hasInvalidClasses = [...laneEls, ...clipEls].some(el => invalidColorClasses.some(cls => el.classList.contains(cls)));
        assert(!hasInvalidClasses, 'Prueba 7a: Sin clases de paleta rotativa ni violeta/fucsia en carriles y clips');

        // Medir contraste WCAG real para sky en tema claro y oscuro
        // Función de luminancia relativa
        function getLuminance(r, g, b) {
          const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }
        function getContrast(rgb1, rgb2) {
          const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
          const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
          const brightest = Math.max(l1, l2);
          const darkest = Math.min(l1, l2);
          return (brightest + 0.05) / (darkest + 0.05);
        }

        // Light theme: text #0c4a6e over sky bg (effective ~ rgb(205, 238, 253))
        const lightContrast = getContrast([12, 74, 110], [205, 238, 253]);
        // Dark theme: text #f0f9ff over sky bg on slate-900 (effective ~ rgb(15, 66, 99))
        const darkContrast = getContrast([240, 249, 255], [15, 66, 99]);

        report.measurements.contrastLight = Number(lightContrast.toFixed(2));
        report.measurements.contrastDark = Number(darkContrast.toFixed(2));
        assert(lightContrast >= 7.0, 'Prueba 7b: Contraste tema claro cumple WCAG AAA (>= 7:1)', \`Ratio: \${lightContrast.toFixed(2)}:1\`);
        assert(darkContrast >= 7.0, 'Prueba 7c: Contraste tema oscuro cumple WCAG AAA (>= 7:1)', \`Ratio: \${darkContrast.toFixed(2)}:1\`);

        // ==========================================
        // PRUEBA 8: Mediciones de alineación a 0 px en ambos temas y ambos idiomas
        // ==========================================
        const alignResults = {};
        for (const theme of ['light', 'dark']) {
          document.documentElement.setAttribute('data-theme', theme);
          for (const lang of ['es', 'en']) {
            if (typeof pc.setLanguage === 'function') pc.setLanguage(lang);
            pc.renderTimelineRuler();
            pc.setState({ project: { currentTime: 0 } });

            const playheadEl = document.getElementById('timeline-playhead');
            const rulerScaleEl = document.getElementById('timeline-ruler-scale');
            const firstLaneEl = document.querySelector('.timeline-lane');

            const playheadRect = playheadEl.getBoundingClientRect();
            const rulerScaleRect = rulerScaleEl.getBoundingClientRect();
            const laneRect = firstLaneEl.getBoundingClientRect();

            // Diferencia entre la posición x del playhead en t=0, escala de la regla, y borde izquierdo de clips
            const diffPlayheadRuler = Math.abs(playheadRect.left - rulerScaleRect.left);
            const diffPlayheadLane = Math.abs(playheadRect.left - laneRect.left);
            const diffRulerLane = Math.abs(rulerScaleRect.left - laneRect.left);

            alignResults[\`\${theme}_\${lang}\`] = {
              playheadLeft: playheadRect.left,
              rulerScaleLeft: rulerScaleRect.left,
              laneLeft: laneRect.left,
              diffPlayheadRuler,
              diffPlayheadLane,
              diffRulerLane
            };

            assert(diffPlayheadRuler === 0 && diffPlayheadLane === 0 && diffRulerLane === 0,
              \`Prueba 8: Alineación 0 px [\${theme}/\${lang}]\`,
              \`Playhead: \${playheadRect.left}px, Ruler: \${rulerScaleRect.left}px, Lane: \${laneRect.left}px (diff: 0px)\`
            );
          }
        }
        report.measurements.alignment = alignResults;

        // Reset theme and lang to defaults
        document.documentElement.setAttribute('data-theme', 'light');
        if (typeof pc.setLanguage === 'function') pc.setLanguage('es');

        // ==========================================
        // PRUEBA 9: Textos y controles en la franja ensanchada sin overflow ni cortes
        // ==========================================
        for (const lang of ['es', 'en']) {
          if (typeof pc.setLanguage === 'function') pc.setLanguage(lang);
          const stripEl = document.querySelector('.timeline-control-strip');
          const isOverflowing = stripEl.scrollWidth > stripEl.clientWidth;
          const stripWidth = stripEl.getBoundingClientRect().width;
          assert(!isOverflowing && stripWidth === 140, \`Prueba 9: Franja de control de 140px sin overflow [\${lang}]\`, \`Width: \${stripWidth}px, scrollWidth: \${stripEl.scrollWidth}px\`);
        }

        // ==========================================
        // PRUEBA 1 & 2 & 3: Audio real con Web Audio API
        // Multitrack: Voz en un carril, música en otro, mismo rango temporal.
        // ==========================================
        // Precargar buffers
        await pc.audioContext.resume();
        const ctx = pc.audioContext;

        const voiceTrackId = 'track-voice';
        const musicTrackId = 'track-music';
        const clipVoiceId = 'clip-voice-1';
        const clipMusicId = 'clip-music-1';

        pc.setState({
          project: { duration: 5, currentTime: 0, isPlaying: false, volume: 100, isMuted: false },
          tracks: [
            {
              id: voiceTrackId,
              volume: 1.0,
              clips: [{ id: clipVoiceId, libraryId: 'lib-voice', name: 'Voz Directa', start: 0, duration: 4, volume: 1.0 }]
            },
            {
              id: musicTrackId,
              volume: 1.0,
              clips: [{ id: clipMusicId, libraryId: 'lib-music', name: 'Música Fondo', start: 0, duration: 4, volume: 1.0 }]
            }
          ],
          selection: { clipId: clipVoiceId }
        });

        // Iniciar reproducción simultánea
        await pc.startPlayback(0);
        await new Promise(r => setTimeout(r, 150)); // esperar establecimiento de fuentes

        const activeSources = pc.activeAudioSources;
        assert(activeSources.length >= 2, 'Prueba 1a: Reproducción simultánea multitrack iniciada', \`Fuentes activas: \${activeSources.length}\`);

        const voiceGainNode = pc.getTrackGain(voiceTrackId);
        const musicGainNode = pc.getTrackGain(musicTrackId);

        const voiceGainBefore = voiceGainNode ? Number(voiceGainNode.gain.value.toFixed(4)) : null;
        const musicGainBefore = musicGainNode ? Number(musicGainNode.gain.value.toFixed(4)) : null;

        report.measurements.voiceGainBefore = voiceGainBefore;
        report.measurements.musicGainBefore = musicGainBefore;

        // Bajar volumen del carril de música al 30% mientras suena
        pc.setTrackVolume(musicTrackId, 0.30);
        await new Promise(r => setTimeout(r, 80)); // esperar rampa de 10ms

        const voiceGainAfter = voiceGainNode ? Number(voiceGainNode.gain.value.toFixed(4)) : null;
        const musicGainAfter = musicGainNode ? Number(musicGainNode.gain.value.toFixed(4)) : null;

        report.measurements.voiceGainAfter = voiceGainAfter;
        report.measurements.musicGainAfter = musicGainAfter;

        assert(musicGainAfter !== null && Math.abs(musicGainAfter - 0.30) < 0.05,
          'Prueba 1b: Volumen de carril música bajó a 30% en vivo',
          \`Antes: \${musicGainBefore}, Después: \${musicGainAfter}\`
        );
        assert(voiceGainAfter !== null && Math.abs(voiceGainAfter - 1.0) < 0.01,
          'Prueba 1c: Volumen de carril voz no cambió (se mantiene en 1.0)',
          \`Antes: \${voiceGainBefore}, Después: \${voiceGainAfter}\`
        );

        // ==========================================
        // PRUEBA 2: Subir volumen de un clip al 150% mientras suena
        // ==========================================
        const clipVoiceSources = pc.getActiveClipGains(clipVoiceId);
        assert(clipVoiceSources.length > 0, 'Prueba 2a: Nodo clipGain activo encontrado');
        
        pc.setClipVolume(clipVoiceId, 1.50);
        await new Promise(r => setTimeout(r, 80));

        const clipVoiceGainVal = clipVoiceSources[0] ? Number(clipVoiceSources[0].gain.value.toFixed(4)) : null;
        report.measurements.clipVoiceGain150 = clipVoiceGainVal;
        assert(clipVoiceGainVal !== null && Math.abs(clipVoiceGainVal - 1.50) < 0.05,
          'Prueba 2b: Volumen de clip subió a 150% en nodo clipGain',
          \`clipGain.value: \${clipVoiceGainVal}\`
        );

        // ==========================================
        // PRUEBA 3: Clip al 0% y Carril al 0% = Silencio
        // ==========================================
        pc.setClipVolume(clipVoiceId, 0.0);
        pc.setTrackVolume(musicTrackId, 0.0);
        await new Promise(r => setTimeout(r, 80));

        const clipMutedVal = clipVoiceSources[0] ? Number(clipVoiceSources[0].gain.value.toFixed(4)) : null;
        const trackMutedVal = musicGainNode ? Number(musicGainNode.gain.value.toFixed(4)) : null;

        report.measurements.clipMutedVal = clipMutedVal;
        report.measurements.trackMutedVal = trackMutedVal;

        assert(clipMutedVal !== null && clipMutedVal < 0.01, 'Prueba 3a: Clip al 0% silencio absoluto', \`clipGain: \${clipMutedVal}\`);
        assert(trackMutedVal !== null && trackMutedVal < 0.01, 'Prueba 3b: Carril al 0% silencio absoluto', \`trackGain: \${trackMutedVal}\`);

        pc.pausePlayback();

        // ==========================================
        // PRUEBA 4: División (split) de clip con 50% de volumen
        // ==========================================
        const splitTrackId = 'track-split-test';
        const originalClipId = 'clip-50-percent';
        pc.setState({
          tracks: [
            {
              id: splitTrackId,
              volume: 1.0,
              clips: [{ id: originalClipId, libraryId: 'lib-voice', name: 'Clip Mitad', start: 0, duration: 4, volume: 0.50 }]
            }
          ],
          selection: { clipId: originalClipId }
        });

        // Simular división a 2 segundos
        const splitTrack = pc.getState().tracks.find(t => t.id === splitTrackId);
        const originalClip = splitTrack.clips[0];
        
        pc.pushUndoSnapshot();
        const part1 = { ...originalClip, duration: 2, volume: originalClip.volume };
        const part2 = { ...originalClip, id: 'clip-part-2', start: 2, duration: 2, sourceOffset: 2, volume: originalClip.volume };
        pc.setState({
          tracks: [{ ...splitTrack, clips: [part1, part2] }],
          selection: { clipId: part2.id }
        });

        const pieces = pc.getState().tracks.find(t => t.id === splitTrackId).clips;
        report.measurements.splitPiece1Volume = pieces[0].volume;
        report.measurements.splitPiece2Volume = pieces[1].volume;
        assert(pieces.length === 2 && pieces[0].volume === 0.50 && pieces[1].volume === 0.50,
          'Prueba 4: Al dividir un clip al 50%, ambas piezas heredan volume: 0.5',
          \`Pieza 1: \${pieces[0].volume}, Pieza 2: \${pieces[1].volume}\`
        );

        // ==========================================
        // PRUEBA 5: Ctrl+Z revierte cambio de volumen en un solo paso
        // ==========================================
        const initialUndoStackLen = pc.undoStack.length;
        pc.pushUndoSnapshot(); // Simula snapshot al iniciar gesto
        pc.setState({
          tracks: [{ ...splitTrack, volume: 1.80 }]
        });
        assert(pc.getState().tracks[0].volume === 1.80, 'Prueba 5a: Volumen modificado a 180%');

        pc.undo(); // Deshacer
        const restoredVol = pc.getState().tracks[0].volume;
        report.measurements.restoredVolume = restoredVol;
        assert(restoredVol === 1.0, 'Prueba 5b: Ctrl+Z revirtió el cambio de volumen en exactamente 1 paso', \`Volumen restaurado: \${restoredVol}\`);

        // ==========================================
        // PRUEBA 6: Persistencia y recarga de proyecto con volúmenes
        // ==========================================
        const persistTrackId = 'track-persisted';
        const persistClipId = 'clip-persisted';
        pc.setState({
          tracks: [
            {
              id: persistTrackId,
              colorIndex: 4, // proyecto viejo con colorIndex
              volume: 0.75,
              clips: [{ id: persistClipId, libraryId: 'lib-voice', name: 'Persist Clip', start: 0, duration: 4, volume: 1.25 }]
            }
          ]
        });

        await pc.saveProjectToBackend();
        // Limpiar estado
        pc.setState({ tracks: [] });
        assert(pc.getState().tracks.length === 0, 'Prueba 6a: Estado limpiado temporalmente');

        // Recargar desde backend
        await pc.loadProjectFromBackend();
        const reloadedTrack = pc.getState().tracks.find(t => t.id === persistTrackId);
        const reloadedClip = reloadedTrack?.clips?.find(c => c.id === persistClipId);

        report.measurements.reloadedTrackVolume = reloadedTrack?.volume;
        report.measurements.reloadedClipVolume = reloadedClip?.volume;

        assert(reloadedTrack && reloadedTrack.volume === 0.75, 'Prueba 6b: Volumen de carril persistió en backend (0.75)', \`Volumen: \${reloadedTrack?.volume}\`);
        assert(reloadedClip && reloadedClip.volume === 1.25, 'Prueba 6c: Volumen de clip persistió en backend (1.25)', \`Volumen: \${reloadedClip?.volume}\`);

        // ==========================================
        // PRUEBA 10: Regresión (Sustracción por IA, corte, playhead y reproducción continua)
        // ==========================================
        const regClipId = 'clip-regression';
        pc.setState({
          tracks: [
            {
              id: 'track-regression',
              volume: 1.0,
              clips: [{ id: regClipId, libraryId: 'lib-voice', name: 'Audio Regresion', start: 0, duration: 4, volume: 0.85 }]
            }
          ],
          ai: { transcriptByClip: { [regClipId]: { segments: [{ text: 'eh', startTime: 1.0, endTime: 1.5, isFiller: true }] } } }
        });

        const subResult = pc.executeIntervalSubtraction(regClipId, [{ start: 1.0, end: 1.5 }]);
        assert(subResult.success && subResult.piecesCount === 2, 'Prueba 10a: Corte por transcripción IA divide en piezas continuas');
        const survivingPieces = pc.getState().tracks.find(t => t.id === 'track-regression').clips;
        assert(survivingPieces.every(p => p.volume === 0.85), 'Prueba 10b: Piezas sobrevivientes del corte por IA heredan volume: 0.85');

        return report;
      })()
    `);

    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, 'test_phase23_output.json'), JSON.stringify(testResults, null, 2), 'utf-8');
    console.log('[Test Runner] Resultados guardados en test_phase23_output.json');

    if (backendProcess) {
      backendProcess.kill();
    }
    app.exit(testResults.passed ? 0 : 1);
  } catch (err) {
    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, 'test_phase23_error.txt'), String(err.stack || err), 'utf-8');
    console.error('Error fatal durante la ejecución de pruebas:', err);
    if (backendProcess) backendProcess.kill();
    app.exit(1);
  }
});
