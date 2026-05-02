'use strict';
const { ipcMain } = require('electron');
const { configRepo } = require('../../di/setup');

function registerConfigHandlers() {
  ipcMain.handle('config:get_all', async () => {
    return await configRepo.getAll();
  });

  ipcMain.handle('config:set', async (event, { clave, valor }) => {
    return await configRepo.set(clave, valor);
  });
}

module.exports = { registerConfigHandlers };
