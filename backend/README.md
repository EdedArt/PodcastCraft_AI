# PodcastCraft AI — Backend

Servidor Express local para **PodcastCraft AI**, encargado de persistir el estado del proyecto (metadatos, biblioteca, carriles y clips) en un archivo JSON local y gestionar el almacenamiento físico de archivos de audio MP3 en disco.

> **Nota de arquitectura:** El backend fue construido, estructurado y verificado de manera **100% aislada e independiente** a lo largo de 7 fases modulares. Su reconexión con el cliente frontend es un paso separado que se realizará posteriormente con autorización explícita.

---

## 1. Cómo correr el servidor

### Instalación y arranque
```bash
cd backend
npm install
npm start
```

### Configuración del puerto
Por defecto, el servidor escucha en el puerto **`3001`** (`http://localhost:3001`). Para cambiar el puerto de ejecución:

- **Linux / macOS:**
  ```bash
  PORT=4000 npm start
  ```
- **Windows (PowerShell):**
  ```powershell
  $env:PORT=4000; npm start
  ```
- **Windows (CMD):**
  ```cmd
  set PORT=4000 && npm start
  ```

---

## 2. Estructura de carpetas

```text
backend/
├── package.json              # Manifiesto de dependencias (express, cors, multer) y script start
├── package-lock.json         # Árbol exacto de versiones de dependencias
├── .gitignore                # Exclusiones de Git (node_modules, audios subidos, project.json, *.log)
├── README.md                 # Documentación completa y guía de pruebas del backend
├── storage/                  # Directorio de persistencia local en disco
│   ├── audio-files/          # Repositorio físico de audios MP3 subidos (versionado vacío con .gitkeep)
│   │   └── .gitkeep
│   └── project.json          # Archivo de estado del proyecto (creado en runtime si no existe)
└── src/
    ├── server.js             # Entrada principal: middlewares globales (logs, CORS, JSON, estáticos), salud y 404/500
    ├── storage.js            # Módulo de lectura y escritura atómica (temp + rename) para project.json
    └── routes/
        ├── project.js        # Enrutador para consultar (GET) y sobrescribir (PUT) /api/project
        └── audio.js          # Enrutador para subir (POST) y eliminar (DELETE) /api/audio
```

---

## 3. Referencia completa de la API REST

| Método | Endpoint | Descripción | Body esperado | Respuesta exitosa | Posibles errores |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/health` | Chequeo de salud del servicio | Ninguno | `200 OK` `{ "status": "ok" }` | N/A |
| **GET** | `/api/project` | Obtiene el estado actual persistido del proyecto | Ninguno | `200 OK` `{ "project": {...}, "library": [...], "tracks": [...] }` | `500 Internal Server Error` |
| **PUT** | `/api/project` | Sobrescribe el proyecto completo con persistencia atómica | JSON con `{ "project": object, "library": array, "tracks": array }` | `200 OK` (Objeto JSON guardado) | `400 Bad Request` (estructura inválida)<br>`500 Internal Server Error` |
| **POST** | `/api/audio` | Sube un archivo MP3 físico a disco con UUID único | `multipart/form-data` con campo `file` conteniendo un archivo `.mp3` | `201 Created` `{ "id": "lib-import-<uuid>", "name": "...", "url": "/audio-files/<uuid>.mp3", "sizeBytes": N }` | `400 Bad Request` (no es MP3, falta campo `file` o excede 100MB) |
| **DELETE** | `/api/audio/:id` | Elimina el archivo MP3 correspondiente en disco | Ninguno | `200 OK` `{ "deleted": true, "id": "lib-import-<uuid>" }` | `400 Bad Request` (ID inválido o path traversal)<br>`404 Not Found` (archivo no existe)<br>`500 Internal Server Error` |
| **GET** | `/audio-files/:filename` | Servidor estático que entrega el archivo de audio para reproducción | Ninguno | `200 OK` (Stream binario `audio/mpeg` con cabecera `Accept-Ranges: bytes`) | `404 Not Found` (archivo no existe) |

---

## 4. Ejemplos de `curl` listos para probar

### 4.1 Chequeo de salud
```bash
curl.exe -i http://localhost:3001/health
```

### 4.2 Obtener proyecto almacenado
```bash
curl.exe -i http://localhost:3001/api/project
```

### 4.3 Guardar proyecto
```bash
curl.exe -i -X PUT http://localhost:3001/api/project -H "Content-Type: application/json" -d "{\"project\":{\"title\":\"Mi Podcast\",\"status\":\"saved\"},\"library\":[],\"tracks\":[{\"id\":\"track-1\",\"name\":\"Voz\",\"colorIndex\":0,\"clips\":[]}]}"
```

### 4.4 Subir un archivo MP3
```bash
curl.exe -i -X POST http://localhost:3001/api/audio -F "file=@ruta/a/archivo.mp3"
```

### 4.5 Reproducir / descargar un archivo de audio estático
```bash
curl.exe -I http://localhost:3001/audio-files/<uuid>.mp3
```

### 4.6 Eliminar un archivo de audio
```bash
curl.exe -i -X DELETE http://localhost:3001/api/audio/lib-import-<uuid>
```

### 4.7 Verificar ruta no encontrada (404 consistente en JSON)
```bash
curl.exe -i http://localhost:3001/ruta-inexistente
```

---

## 5. Decisiones técnicas documentadas

1. **Persistencia en JSON simple en lugar de SQLite (Fase 2):**  
   Al tratarse de una aplicación de escritorio que se empaquetará mediante Electron, el uso de SQLite requeriría compilar módulos binarios nativos (Node-gyp) específicos para la versión de Node embebida en Electron. Un archivo JSON plano manejado de forma eficiente elimina fricciones de compilación cruzada y simplifica las copias de seguridad.
2. **Escritura atómica de `project.json` (Fase 2):**  
   Para evitar la corrupción del archivo en caso de apagados repentinos o caídas del proceso, la escritura se realiza en `storage/project.json.tmp` y luego se reemplaza atómicamente con `fs.promises.rename`.
3. **Backend agnóstico al modelo de audio / `globalAudio` (Fases 3 y 4):**  
   El frontend gestiona la reproducción mediante una única instancia de audio (`globalAudio`). El backend es agnóstico a esta lógica de reproducción: se limita a persistir y despachar archivos sin restringir una futura evolución hacia mezcla multipista.
4. **Validación estricta de formato MP3 (Fase 4):**  
   `multer` valida mediante `fileFilter` que el archivo entrante posea mimetype `audio/mpeg` o extensión `.mp3`, rechazando cualquier otro archivo antes de ser escrito en disco.
5. **Límite de tamaño de subida a 100 MB (Fase 4):**  
   Se definió una cota de 100 MB para evitar agotamiento de memoria o disco ante peticiones desmedidas.
6. **Protección contra Path Traversal en eliminación (Fase 5):**  
   En `DELETE /api/audio/:id`, se normaliza la ruta absoluta mediante `path.resolve` y se comprueba que permanezca confinada estrictamente dentro del directorio `backend/storage/audio-files/`.
7. **CORS abierto para desarrollo local (Fase 6):**  
   Se habilitó `cors()` abierto (`*`) para admitir la comunicación entre puertos diferentes (ej. frontend en `5500`/Live Server y backend en `3001`). Al empaquetar en Electron, se restringirá según el origen local del protocolo `file://` o `custom://`.

---

## 6. Limitaciones conocidas

- **Cálculo de duración en frontend:** El backend no parsea internamente la cabecera del contenedor MP3 para extraer la duración en segundos. Dicho cálculo se delega al frontend mediante el evento nativo `loadedmetadata` del elemento HTMLAudioElement.
- **Sin autenticación ni control de acceso:** No se implementan tokens JWT ni sesiones, ya que la aplicación opera como una estación de trabajo de escritorio local y monousuario.
- **Servido estático genérico:** `express.static` despacha cualquier archivo residente en `audio-files/` basándose en su nombre UUID, sin autenticación de propietario.
- **Sin recolección automática de audios huérfanos:** Si un usuario sube un archivo MP3 y posteriormente descarta el proyecto sin guardar o elimina el clip sin llamar a `DELETE /api/audio/:id`, el archivo físico permanece en disco. La depuración de huérfanos queda como mejora futura.

---

## 7. Estado del pivote (Resumen de Fases)

| Fase | Alcance | Estado |
| :---: | :--- | :---: |
| **Fase 1** | Esqueleto del servidor Express con `GET /health` en puerto 3001 | **Completada** |
| **Fase 2** | Limpieza de carpeta duplicada, estructura de storage y lectura/escritura atómica de `project.json` | **Completada** |
| **Fase 3** | Rutas `GET /api/project` y `PUT /api/project` con validación de estructura | **Completada** |
| **Fase 4** | Endpoint de subida de audio `POST /api/audio` con `multer`, nombrado UUID y validación MP3 | **Completada** |
| **Fase 5** | Servido de audio estático `/audio-files/` y endpoint `DELETE /api/audio/:id` con protección Path Traversal | **Completada** |
| **Fase 6** | Habilitación de CORS, middleware de logging, 404 en formato JSON y manejo de errores centralizado | **Completada** |
| **Fase 7** | Guía de referencia, suite completa de pruebas de regresión y documentación en `README.md` | **Completada** |
