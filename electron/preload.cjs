const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('durtupDesktopBridge', {
  isElectron: true,
  isDesktopAdmin: true,
  appName: 'Durtup Enterprise Admin Panel',
  version: '2.0.0',
});
