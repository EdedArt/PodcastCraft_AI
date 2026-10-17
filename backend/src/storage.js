const fs = require('fs').promises;
const path = require('path');

const STORAGE_DIR = process.env.PODCASTCRAFT_STORAGE_DIR || path.join(__dirname, '..', 'storage');
const AUDIO_DIR = path.join(STORAGE_DIR, 'audio-files');
const TMP_DIR = path.join(STORAGE_DIR, 'tmp');
const PROJECT_FILE = path.join(STORAGE_DIR, 'project.json');
const PROJECT_TMP_FILE = path.join(STORAGE_DIR, 'project.json.tmp');
const AUTH_FILE = path.join(STORAGE_DIR, 'auth.json');
const AUTH_TMP_FILE = path.join(STORAGE_DIR, 'auth.json.tmp');

const INITIAL_PROJECT = {
  project: { title: 'Untitled Project', status: 'draft' },
  library: [],
  tracks: []
};

const INITIAL_AUTH = {
  users: []
};

let authWriteQueue = Promise.resolve();
let authMutex = Promise.resolve();

async function ensureStorageDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.mkdir(AUDIO_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });
}

/**
 * Serializa y escribe los datos del proyecto de manera atómica:
 * 1. Serializa a JSON con formato legible (JSON.stringify(data, null, 2))
 * 2. Escribe en storage/project.json.tmp
 * 3. Renombra project.json.tmp -> project.json (operación atómica)
 * @param {object} data
 */
async function writeProject(data) {
  await ensureStorageDir();
  const serialized = JSON.stringify(data, null, 2);
  await fs.writeFile(PROJECT_TMP_FILE, serialized, 'utf8');
  await fs.rename(PROJECT_TMP_FILE, PROJECT_FILE);
  return data;
}

/**
 * Lee storage/project.json, lo parsea y lo devuelve.
 * Si el archivo no existe, lo crea con el estado inicial y lo devuelve.
 * Si existe pero contiene JSON corrupto/inválido, lanza un error claro.
 * @returns {Promise<object>}
 */
async function readProject() {
  await ensureStorageDir();
  let content;
  try {
    content = await fs.readFile(PROJECT_FILE, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeProject(INITIAL_PROJECT);
      return JSON.parse(JSON.stringify(INITIAL_PROJECT));
    }
    throw err;
  }

  try {
    return JSON.parse(content);
  } catch (parseErr) {
    throw new Error(`El archivo de proyecto en "${PROJECT_FILE}" está corrupto o contiene JSON inválido: ${parseErr.message}`);
  }
}

/**
 * Serializa y escribe las credenciales de autenticación de manera atómica y serializada.
 * @param {object} data { users: [...] }
 */
async function writeAuth(data) {
  await ensureStorageDir();
  const executeWrite = async () => {
    const serialized = JSON.stringify(data, null, 2);
    await fs.writeFile(AUTH_TMP_FILE, serialized, 'utf8');
    await fs.rename(AUTH_TMP_FILE, AUTH_FILE);
    return data;
  };

  authWriteQueue = authWriteQueue.then(executeWrite, executeWrite);
  return authWriteQueue;
}

/**
 * Lee storage/auth.json, lo parsea, migra automáticamente versiones anteriores y lo devuelve.
 * @returns {Promise<{ users: Array<object> }>}
 */
async function readAuth() {
  await ensureStorageDir();
  let content;
  try {
    content = await fs.readFile(AUTH_FILE, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeAuth(INITIAL_AUTH);
      return JSON.parse(JSON.stringify(INITIAL_AUTH));
    }
    throw err;
  }

  let data;
  try {
    data = JSON.parse(content);
  } catch (parseErr) {
    throw new Error(`El archivo de autenticación en "${AUTH_FILE}" está corrupto o contiene JSON inválido: ${parseErr.message}`);
  }

  // Migración automática del formato anterior (campos en la raíz: username, passwordHash, salt)
  if (data && !Array.isArray(data.users)) {
    if (data.username && data.passwordHash && data.salt) {
      const migratedUser = {
        username: data.username,
        usernameKey: data.username.toLowerCase(),
        passwordHash: data.passwordHash,
        salt: data.salt,
        recoveryHash: data.recoveryHash || null,
        recoverySalt: data.recoverySalt || null,
        rememberTokens: Array.isArray(data.rememberTokens) ? data.rememberTokens : []
      };
      const migratedData = { users: [migratedUser] };
      await writeAuth(migratedData);
      return migratedData;
    } else {
      const emptyData = { users: [] };
      await writeAuth(emptyData);
      return emptyData;
    }
  }

  if (!Array.isArray(data.users)) {
    data.users = [];
  }

  return data;
}

/**
 * Ejecuta una mutación atómica sobre auth.json garantizando serialización estricta.
 * @param {Function} mutatorFn Función asíncrona que recibe `auth` y devuelve el auth modificado
 */
async function mutateAuth(mutatorFn) {
  const execute = async () => {
    const auth = await readAuth();
    const result = await mutatorFn(auth);
    const toSave = result !== undefined ? result : auth;
    await writeAuth(toSave);
    return toSave;
  };
  authMutex = authMutex.then(execute, execute);
  return authMutex;
}

module.exports = {
  readProject,
  writeProject,
  readAuth,
  writeAuth,
  mutateAuth,
  STORAGE_DIR,
  AUDIO_DIR,
  TMP_DIR,
  PROJECT_FILE,
  AUTH_FILE
};

