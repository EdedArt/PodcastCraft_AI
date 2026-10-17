const { contextBridge, ipcRenderer } = require('electron');

// Exposición mínima y segura de utilidades hacia el renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  saveExportedFile: async (payload) => {
    return await ipcRenderer.invoke('save-exported-file', payload);
  }
});
