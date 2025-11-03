const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  onNavigate: (callback) => ipcRenderer.on('navigate', callback),
  onShowNotification: (callback) => ipcRenderer.on('show-notification', callback)
});
