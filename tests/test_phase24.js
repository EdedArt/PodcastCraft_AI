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
    const req = http.get(HEALTH_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('[Test Runner] Backend ya corriendo en puerto', BACKEND_PORT);
        return resolve();
      }
    });
    req.on('error', () => {
      console.log('[Test Runner] Iniciando backend...');
      const rootDir = path.join(__dirname, '..');
      const backendEntry = path.join(rootDir, 'backend', 'src', 'server.js');
      backendProcess = fork(backendEntry, [], {
        cwd: path.join(rootDir, 'backend'),
        silent: true,
        env: {
          ...process.env,
          PORT: BACKEND_PORT,
          PODCASTCRAFT_STORAGE_DIR: path.join(rootDir, 'backend', 'storage'),
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
        webSecurity: false
      }
    });

    win.loadFile(path.join(__dirname, '..', 'frontend', 'index.html'));

    await new Promise((resolve) => {
      win.webContents.once('did-finish-load', resolve);
    });

    // Esperar inicialización del DOM y scripts
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

        // 1. Autenticar usuario y desplegar workspace
        appState.auth = appState.auth || {};
        appState.auth.isAuthenticated = true;
        document.getElementById('auth-lock-screen')?.classList.add('hidden');
        document.getElementById('topbar')?.classList.remove('hidden');
        document.getElementById('workspace')?.classList.remove('hidden');
        document.getElementById('transport')?.classList.remove('hidden');

        // 2. Configurar biblioteca con audios reales
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
        // PRUEBA 1: Playhead en 12.5 s, suelta audio en carril vacío -> start debe ser 12.5 (no 0)
        // ==========================================
        pc.setState({
          tracks: [
            { id: 'trk-empty', volume: 1, clips: [] }
          ],
          project: { duration: 30, currentTime: 12.5, isPlaying: false }
        });
        pc.seekTo(12.5);

        const laneEmpty = document.querySelector('.timeline-lane[data-track-id="trk-empty"]');
        const dropEvent1 = new CustomEvent('drop', { bubbles: true, cancelable: true });
        dropEvent1.dataTransfer = {
          types: [pc.DRAG_MIME],
          getData: () => JSON.stringify({ libraryId: 'lib-voice', name: 'Voz Principal.mp3', duration: 5 })
        };
        dropEvent1.clientX = 500;
        laneEmpty.dispatchEvent(dropEvent1);

        const trackEmptyAfter = pc.getState().tracks.find(t => t.id === 'trk-empty');
        const clipPlaced1 = trackEmptyAfter.clips[0];
        const clipStart1 = clipPlaced1 ? clipPlaced1.start : null;
        report.measurements.dropEmptyStart = clipStart1;
        assert(clipStart1 === 12.5, 'Prueba 1: Playhead en 12.5s coloca clip en start=12.5s (no 0s)', \`start: \${clipStart1}s\`);

        // ==========================================
        // PRUEBA 2: Playhead sobre un clip existente del mismo carril -> se coloca justo después de su final
        // ==========================================
        pc.setState({
          tracks: [
            {
              id: 'trk-col',
              volume: 1,
              clips: [{ id: 'clip-exist-1', libraryId: 'lib-voice', name: 'Existente', start: 10, duration: 5, volume: 1 }]
            }
          ],
          project: { duration: 30, currentTime: 12.0, isPlaying: false }
        });
        pc.seekTo(12.0); // Dentro de [10, 15]

        const laneCol = document.querySelector('.timeline-lane[data-track-id="trk-col"]');
        const dropEvent2 = new CustomEvent('drop', { bubbles: true, cancelable: true });
        dropEvent2.dataTransfer = {
          types: [pc.DRAG_MIME],
          getData: () => JSON.stringify({ libraryId: 'lib-voice', name: 'Nuevo Clip', duration: 4 })
        };
        dropEvent2.clientX = 500;
        laneCol.dispatchEvent(dropEvent2);

        const trackColAfter = pc.getState().tracks.find(t => t.id === 'trk-col');
        const newClipPlaced = trackColAfter.clips.find(c => c.name === 'Nuevo Clip');
        const colStart = newClipPlaced ? newClipPlaced.start : null;
        report.measurements.collisionResolvedStart = colStart;
        assert(colStart === 15, 'Prueba 2: Playhead sobre clip existente coloca el nuevo inmediatamente al final (start=15s)', \`start: \${colStart}s\`);

        // ==========================================
        // PRUEBA 3: Mover un clip +5s: start cambia en 5 (±0.05). Clic sin movimiento no lo mueve. Ctrl+Z revierte en 1 paso
        // ==========================================
        pc.setState({
          tracks: [
            {
              id: 'trk-move',
              volume: 1,
              clips: [{ id: 'clip-move-test', libraryId: 'lib-voice', name: 'Clip Mover', start: 10, duration: 4, volume: 1 }]
            }
          ]
        });

        // 3a. Clic sin movimiento (<4px) no lo mueve y no genera undo
        const undoCountBeforeClick = pc.undoStack.length;
        const clipElMove = document.getElementById('timeline-clip-clip-move-test');
        clipElMove.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 200, button: 0, pointerId: 1 }));
        clipElMove.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 201, clientY: 201, button: 0, pointerId: 1 }));
        const undoCountAfterClick = pc.undoStack.length;
        assert(undoCountBeforeClick === undoCountAfterClick, 'Prueba 3a: Clic sin desplazamiento no genera paso de undo');

        // 3b. Mover +5s
        const pps = pc.getPixelsPerSecond();
        const deltaPx5s = 5 * pps;
        clipElMove.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 200, button: 0, pointerId: 1 }));
        clipElMove.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 200 + deltaPx5s, clientY: 200, pointerId: 1 }));
        clipElMove.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 200 + deltaPx5s, clientY: 200, pointerId: 1 }));

        const clipAfterMove = pc.getState().tracks.find(t => t.id === 'trk-move').clips.find(c => c.id === 'clip-move-test');
        const movedStart = clipAfterMove.start;
        const diffMoved = Math.abs(movedStart - 15);
        report.measurements.movedStart = movedStart;
        assert(diffMoved <= 0.05, 'Prueba 3b: Mover clip +5s desplaza el start a 15s (±0.05)', \`start: \${movedStart}s\`);

        // 3c. Ctrl+Z revierte el movimiento en un solo paso
        pc.undo();
        const clipAfterUndo = pc.getState().tracks.find(t => t.id === 'trk-move').clips.find(c => c.id === 'clip-move-test');
        const revertedStart = clipAfterUndo.start;
        report.measurements.revertedStart = revertedStart;
        assert(revertedStart === 10, 'Prueba 3c: Ctrl+Z revierte el movimiento de clip en un solo paso (start=10s)', \`start: \${revertedStart}s\`);

        // ==========================================
        // PRUEBA 4: Mover un clip sobre otro -> queda en la posición libre más cercana (reporta propuesta y resultado)
        // ==========================================
        const trackWithObstacle = {
          id: 'trk-obs',
          clips: [
            { id: 'clip-obs-1', start: 20, duration: 5 }, // [20, 25]
            { id: 'clip-moving', start: 0, duration: 3 }
          ]
        };
        const proposedStartOverObs = 22.0; // Colisiona con [20, 25]
        const nearestPos = pc.findNearestFreePosition(trackWithObstacle, 'clip-moving', proposedStartOverObs, 3);
        report.measurements.moveOverObstacle = {
          proposed: proposedStartOverObs,
          result: nearestPos
        };
        assert(nearestPos === 25.0, 'Prueba 4: Mover clip sobre obstáculo ubica en posición libre más cercana (propuesto: 22s -> resultado: 25s)', \`propuesto: 22s, resultado: \${nearestPos}s\`);

        // ==========================================
        // PRUEBA 5: Mover un clip a otro carril -> cambia de carril
        // ==========================================
        pc.setState({
          tracks: [
            { id: 'trk-source', volume: 1, clips: [{ id: 'clip-cross-track', libraryId: 'lib-voice', name: 'Cross Track', start: 2, duration: 4, volume: 1 }] },
            { id: 'trk-dest', volume: 1, clips: [] }
          ]
        });
        const clipCrossEl = document.getElementById('timeline-clip-clip-cross-track');
        clipCrossEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 200, button: 0, pointerId: 1 }));
        
        // Simular movimiento vertical sobre el segundo carril
        const laneDest = document.querySelector('.timeline-lane[data-track-id="trk-dest"]');
        const rectLaneDest = laneDest.getBoundingClientRect();
        clipCrossEl.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: rectLaneDest.left + 50, clientY: rectLaneDest.top + 10, pointerId: 1 }));
        clipCrossEl.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: rectLaneDest.left + 50, clientY: rectLaneDest.top + 10, pointerId: 1 }));

        const trkSourceAfter = pc.getState().tracks.find(t => t.id === 'trk-source');
        const trkDestAfter = pc.getState().tracks.find(t => t.id === 'trk-dest');
        const isInDest = trkDestAfter.clips.some(c => c.id === 'clip-cross-track');
        const notInSource = !trkSourceAfter.clips.some(c => c.id === 'clip-cross-track');
        assert(isInDest && notInSource, 'Prueba 5: Mover clip a otro carril transfiere el clip correctamente', \`destClips: \${trkDestAfter.clips.length}, srcClips: \${trkSourceAfter.clips.length}\`);

        // ==========================================
        // PRUEBA 6: Escape durante el arrastre lo cancela y devuelve el clip a su sitio
        // ==========================================
        pc.setState({
          tracks: [
            { id: 'trk-esc', volume: 1, clips: [{ id: 'clip-esc-test', libraryId: 'lib-voice', name: 'Escape Clip', start: 8, duration: 4, volume: 1 }] }
          ]
        });
        const clipEscEl = document.getElementById('timeline-clip-clip-esc-test');
        clipEscEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 200, button: 0, pointerId: 1 }));
        clipEscEl.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 200 + 200, clientY: 200, pointerId: 1 }));
        // Presionar Escape
        document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));

        const trkEscAfter = pc.getState().tracks.find(t => t.id === 'trk-esc');
        const clipEscAfter = trkEscAfter.clips.find(c => c.id === 'clip-esc-test');
        report.measurements.escStart = clipEscAfter.start;
        assert(clipEscAfter.start === 8, 'Prueba 6: Escape cancela el arrastre y devuelve el clip a start=8s', \`start: \${clipEscAfter.start}s\`);

        // ==========================================
        // PRUEBA 7: Dividir con playhead dentro del clip: dos piezas contiguas, volúmenes heredados, sourceOffset de B correcto, B seleccionada, segunda división inmediata
        // ==========================================
        pc.setState({
          tracks: [
            { id: 'trk-split', volume: 1, clips: [{ id: 'clip-split-orig', libraryId: 'lib-voice', name: 'Original', start: 10, duration: 8, sourceOffset: 1.5, volume: 0.65 }] }
          ],
          selection: { clipId: 'clip-split-orig' },
          project: { duration: 30, currentTime: 13.0, isPlaying: false }
        });
        pc.seekTo(13.0); // Dentro de [10, 18], margen 3s y 5s > 0.3s

        const splitRes1 = pc.splitClipAtPlayhead();
        const trkSplitAfter1 = pc.getState().tracks.find(t => t.id === 'trk-split');
        const pieceA = trkSplitAfter1.clips.find(c => c.id === splitRes1.pieceAId);
        const pieceB = trkSplitAfter1.clips.find(c => c.id === splitRes1.pieceBId);

        const contiguous = Math.abs((pieceA.start + pieceA.duration) - pieceB.start) < 0.001;
        const volInherited = pieceA.volume === 0.65 && pieceB.volume === 0.65;
        const expectedBOffset = Math.round((1.5 + (13.0 - 10.0)) * 100) / 100;
        const bOffsetCorrect = Math.abs(pieceB.sourceOffset - expectedBOffset) < 0.01;
        const bSelected = pc.getState().selection.clipId === pieceB.id;

        report.measurements.splitDetails = {
          pieceA: { start: pieceA.start, duration: pieceA.duration, volume: pieceA.volume, sourceOffset: pieceA.sourceOffset },
          pieceB: { start: pieceB.start, duration: pieceB.duration, volume: pieceB.volume, sourceOffset: pieceB.sourceOffset },
          bSelected
        };

        assert(splitRes1.success && contiguous && volInherited && bOffsetCorrect && bSelected,
          'Prueba 7a: Dividir clip crea dos piezas contiguas, volumen heredado (0.65), sourceOffset de B exacto (4.5), y pieza B seleccionada');

        // Segunda división inmediata en pieza B
        pc.seekTo(15.0); // dentro de pieza B [13, 18]
        const splitRes2 = pc.splitClipAtPlayhead();
        assert(splitRes2.success, 'Prueba 7b: Segunda división inmediata sobre la pieza B seleccionada funciona');

        // ==========================================
        // PRUEBA 8: Flujo manual completo: divide en A (2s), divide en B (4s), borra pieza del medio -> hueco se cierra (ripple). Play continuo sin pausas
        // ==========================================
        pc.setState({
          tracks: [
            { id: 'trk-flow', volume: 1, clips: [{ id: 'clip-flow-base', libraryId: 'lib-voice', name: 'Flow Clip', start: 0, duration: 10, sourceOffset: 0, volume: 1 }] }
          ],
          selection: { clipId: 'clip-flow-base' },
          project: { duration: 10, currentTime: 2.0, isPlaying: false }
        });

        // Dividir en 2.0s
        pc.seekTo(2.0);
        const fSplit1 = pc.splitClipAtPlayhead();
        const idMid = fSplit1.pieceBId; // pieza que empieza en 2s

        // Dividir en 4.0s
        pc.seekTo(4.0);
        const fSplit2 = pc.splitClipAtPlayhead();
        const idPiece3 = fSplit2.pieceBId; // pieza que empieza en 4s
        const idPiece2 = fSplit2.pieceAId; // pieza del medio [2, 4], duración 2s

        // Seleccionar pieza del medio y borrar con ripple por defecto
        pc.setState({ selection: { clipId: idPiece2 } });
        pc.deleteSelectedClip({ ripple: true });

        const trkFlowAfterDelete = pc.getState().tracks.find(t => t.id === 'trk-flow');
        const p1 = trkFlowAfterDelete.clips[0];
        const p3 = trkFlowAfterDelete.clips[1];

        const gapClosed = p1.duration === 2.0 && p3.start === 2.0;
        report.measurements.flowRipple = {
          piece1End: p1.start + p1.duration,
          piece3Start: p3.start,
          gap: p3.start - (p1.start + p1.duration)
        };
        assert(gapClosed, 'Prueba 8a: Borrado de pieza del medio cierra el hueco: pieza 3 arranca en t=2.0s (junto a pieza 1)', \`p1End: \${p1.start + p1.duration}s, p3Start: \${p3.start}s\`);

        // Probar reproducción continua a través de la unión
        await pc.startPlayback(0);
        await new Promise(r => setTimeout(r, 400));
        const sourcesCount = pc.activeAudioSources.length;
        report.measurements.continuousActiveSources = sourcesCount;
        assert(sourcesCount === 2, 'Prueba 8b: Reproducción a través de la unión programa ambas fuentes contiguas sin pausa');
        pc.pausePlayback();

        // ==========================================
        // PRUEBA 9: Shift + Delete deja el hueco (sin ripple)
        // ==========================================
        pc.setState({
          tracks: [
            {
              id: 'trk-shift-del',
              volume: 1,
              clips: [
                { id: 'cl-del-1', libraryId: 'lib-voice', name: 'P1', start: 0, duration: 2, volume: 1 },
                { id: 'cl-del-2', libraryId: 'lib-voice', name: 'P2', start: 4, duration: 4, volume: 1 }
              ]
            }
          ],
          selection: { clipId: 'cl-del-1' }
        });
        pc.deleteSelectedClip({ ripple: false });

        const trkShiftAfter = pc.getState().tracks.find(t => t.id === 'trk-shift-del');
        const p2AfterShift = trkShiftAfter.clips.find(c => c.id === 'cl-del-2');
        report.measurements.shiftDeleteP2Start = p2AfterShift.start;
        assert(p2AfterShift.start === 4, 'Prueba 9: Shift + Delete conserva el hueco (P2 permanece en start=4s)', \`start: \${p2AfterShift.start}s\`);

        // ==========================================
        // PRUEBA 10: Dividir con el playhead fuera del clip -> aviso y sin cambios
        // ==========================================
        pc.setState({
          tracks: [
            { id: 'trk-out-clip', volume: 1, clips: [{ id: 'cl-margin-test', libraryId: 'lib-voice', name: 'Margin', start: 10, duration: 5, volume: 1 }] }
          ],
          selection: { clipId: 'cl-margin-test' },
          project: { duration: 30, currentTime: 5.0, isPlaying: false }
        });
        pc.seekTo(5.0); // Completamente fuera de [10, 15]
        const outRes = pc.splitClipAtPlayhead();
        const trkOutAfter = pc.getState().tracks.find(t => t.id === 'trk-out-clip');
        assert(!outRes.success && trkOutAfter.clips.length === 1, 'Prueba 10: Dividir con playhead fuera del clip no produce cambios y retorna fallo');

        // ==========================================
        // PRUEBA 11: Transcripción con segmentos sintéticos: tras división manual, cada pieza conserva sus segmentos con tiempos relativos correctos
        // ==========================================
        const synClipId = 'clip-syn-transcript';
        pc.setState({
          tracks: [
            { id: 'trk-syn', volume: 1, clips: [{ id: synClipId, libraryId: 'lib-voice', name: 'Syn Transcript', start: 0, duration: 10, volume: 1 }] }
          ],
          selection: { clipId: synClipId },
          ai: {
            transcriptByClip: {
              [synClipId]: {
                segments: [
                  { id: 'seg-1', text: 'Hola', startTime: 1.0, endTime: 2.0, isFiller: false },
                  { id: 'seg-2', text: 'mundo', startTime: 7.0, endTime: 8.5, isFiller: false }
                ]
              }
            }
          },
          project: { duration: 10, currentTime: 5.0, isPlaying: false }
        });
        pc.seekTo(5.0);
        const synSplitRes = pc.splitClipAtPlayhead();

        const trkSynAfter = pc.getState().tracks.find(t => t.id === 'trk-syn');
        const synPieceA = trkSynAfter.clips.find(c => c.id === synSplitRes.pieceAId);
        const synPieceB = trkSynAfter.clips.find(c => c.id === synSplitRes.pieceBId);

        const aiState = pc.getState().ai;
        const segsA = aiState.transcriptByClip[synPieceA.id]?.segments || [];
        const segsB = aiState.transcriptByClip[synPieceB.id]?.segments || [];

        const seg1Correct = segsA.length === 1 && segsA[0].text === 'Hola' && segsA[0].startTime === 1.0 && segsA[0].endTime === 2.0;
        const seg2Correct = segsB.length === 1 && segsB[0].text === 'mundo' && segsB[0].startTime === 2.0 && segsB[0].endTime === 3.5;

        report.measurements.transcriptSegments = {
          pieceA: segsA,
          pieceB: segsB
        };

        assert(seg1Correct && seg2Correct, 'Prueba 11: Segmentos de transcripción sintéticos conservados con tiempos relativos correctos en ambas piezas');

        // ==========================================
        // PRUEBA 12: Regresión completa (Alineación 0px, multitrack 2 carriles, volumen, persistencia)
        // ==========================================
        // 12a. Alineación 0.00 px
        pc.seekTo(0);
        const playheadEl = document.getElementById('timeline-playhead')?.getBoundingClientRect();
        const rulerScaleEl = document.getElementById('timeline-ruler-scale')?.getBoundingClientRect();
        const laneEl = document.querySelector('.timeline-lane')?.getBoundingClientRect();

        const diffPHRuler = Math.abs(playheadEl.left - rulerScaleEl.left);
        const diffPHLane = Math.abs(playheadEl.left - laneEl.left);
        report.measurements.alignment = {
          playheadLeft: playheadEl.left,
          rulerLeft: rulerScaleEl.left,
          laneLeft: laneEl.left,
          diffPHRuler,
          diffPHLane
        };
        assert(diffPHRuler < 0.01 && diffPHLane < 0.01, 'Prueba 12a: Alineación geométrica exacta a 0.00 px', \`diff: \${diffPHRuler}px\`);

        // 12b. Multitrack simultáneo real de 2 carriles
        pc.setState({
          tracks: [
            { id: 'trk-r1', volume: 0.8, clips: [{ id: 'cl-r1', libraryId: 'lib-voice', name: 'Track 1', start: 0, duration: 5, volume: 1 }] },
            { id: 'trk-r2', volume: 0.5, clips: [{ id: 'cl-r2', libraryId: 'lib-music', name: 'Track 2', start: 0, duration: 5, volume: 1 }] }
          ]
        });
        await pc.startPlayback(0);
        await new Promise(r => setTimeout(r, 300));
        const activeMultitrackSources = pc.activeAudioSources.length;
        report.measurements.multitrackSourcesCount = activeMultitrackSources;
        assert(activeMultitrackSources === 2, 'Prueba 12b: Multitrack concurrente reproduce ambos carriles simultáneamente');
        pc.pausePlayback();

        // 12c. Persistencia en backend (PUT/GET)
        await pc.saveProjectToBackend();
        await pc.loadProjectFromBackend();
        const loadedTracks = pc.getState().tracks;
        const persistOk = loadedTracks.length === 2 && loadedTracks[0].volume === 0.8 && loadedTracks[1].volume === 0.5;
        assert(persistOk, 'Prueba 12c: Persistencia en backend de proyectos con volumen y estructura de carriles intacta');

        return report;
      })()
    `);

    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, 'test_phase24_output.json'), JSON.stringify(testResults, null, 2), 'utf-8');
    console.log('[Test Runner] Resultados de Fase 24 guardados en test_phase24_output.json');

    if (backendProcess) {
      backendProcess.kill();
    }
    app.exit(testResults.passed ? 0 : 1);
  } catch (err) {
    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, 'test_phase24_error.txt'), String(err.stack || err), 'utf-8');
    console.error('Error fatal durante la ejecución de pruebas:', err);
    if (backendProcess) backendProcess.kill();
    app.exit(1);
  }
});
