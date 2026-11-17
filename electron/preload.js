const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sonicWaveDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0.0'
});
