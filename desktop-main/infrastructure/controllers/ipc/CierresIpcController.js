'use strict';
const { ipcMain } = require('electron');
const { cierreRepo } = require('../../di/setup');

function registerCierresHandlers() {
  ipcMain.handle('cierres:getResumenHoy', async () => {
    return await cierreRepo.getResumenHoy();
  });

  ipcMain.handle('cierres:getHoy', async () => {
    return await cierreRepo.getHoy();
  });

  ipcMain.handle('cierres:cerrar', async (event, data) => {
    return await cierreRepo.cerrar(data);
  });
}

module.exports = { registerCierresHandlers };
