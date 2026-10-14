const { contextBridge } = require('electron');

// Exposición mínima y segura de utilidades hacia el renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform
});
