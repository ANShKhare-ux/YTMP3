const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sonicWaveDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0.0',
  getDefaultDownloadsDir: () => ipcRenderer.invoke('desktop:get-default-downloads'),
  chooseDownloadFolder: () => ipcRenderer.invoke('desktop:choose-download-folder'),
  saveJobFile: (payload) => ipcRenderer.invoke('desktop:save-job-file', payload),
  showItemInFolder: (payload) => ipcRenderer.invoke('desktop:show-item-in-folder', payload),
  getServerPort: () => ipcRenderer.invoke('desktop:get-server-port'),
  minimizeToTray: () => ipcRenderer.invoke('desktop:minimize-to-tray'),
  getMinimizeToTray: () => ipcRenderer.invoke('desktop:get-minimize-to-tray'),
  setMinimizeToTray: (enabled) => ipcRenderer.invoke('desktop:set-minimize-to-tray', enabled),
  getGpuMode: () => ipcRenderer.invoke('desktop:get-gpu-mode')
});
