'use strict';
const { contextBridge, ipcRenderer } = require('electron');

ipcRenderer.invoke('log', '--- PRELOAD.JS EXECUTING SECURELY ---').catch(console.error);

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});
