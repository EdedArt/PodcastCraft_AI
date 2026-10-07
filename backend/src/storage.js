const fs = require('fs').promises;
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '..', 'storage');
const PROJECT_FILE = path.join(STORAGE_DIR, 'project.json');
const PROJECT_TMP_FILE = path.join(STORAGE_DIR, 'project.json.tmp');

const INITIAL_PROJECT = {
  project: { title: 'Untitled Project', status: 'draft' },
  library: [],
  tracks: []
};

async function ensureStorageDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
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

module.exports = {
  readProject,
  writeProject,
  STORAGE_DIR,
  PROJECT_FILE
};
