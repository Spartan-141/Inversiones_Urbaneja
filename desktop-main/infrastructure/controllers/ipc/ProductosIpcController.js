'use strict';
const { ipcMain } = require('electron');
const { productosRepo } = require('../../di/setup');

function registerProductosHandlers() {
  ipcMain.handle('productos:paginated', async (event, params) => {
    return await productosRepo.getPaginated(params);
  });

  ipcMain.handle('productos:search', async (event, query) => {
    return await productosRepo.search(query);
  });

  ipcMain.handle('productos:create', async (event, data) => {
    return await productosRepo.create(data);
  });

  ipcMain.handle('productos:update', async (event, { id, ...data }) => {
    return await productosRepo.update(id, data);
  });

  ipcMain.handle('productos:delete', async (event, id) => {
    return await productosRepo.delete(id);
  });

  ipcMain.handle('productos:alertasVencimiento', async () => {
    return await productosRepo.getAlertasVencimiento();
  });
}

module.exports = { registerProductosHandlers };
