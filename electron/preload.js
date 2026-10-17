const { contextBridge, ipcRenderer } = require('electron');

// Exposición mínima y segura de utilidades hacia el renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  showSaveExportDialog: async (options) => {
    return await ipcRenderer.invoke('show-save-export-dialog', options);
  },
  showItemInFolder: async (filePath) => {
    return await ipcRenderer.invoke('show-item-in-folder', filePath);
  },
  saveAuthSession: async (sessionData) => {
    return await ipcRenderer.invoke('save-auth-session', sessionData);
  },
  loadAuthSession: async () => {
    return await ipcRenderer.invoke('load-auth-session');
  },
  clearAuthSession: async () => {
    return await ipcRenderer.invoke('clear-auth-session');
  },
  saveExportedFile: async (payload) => {
    return await ipcRenderer.invoke('save-exported-file', payload);
  }
});
