'use strict';
const { ipcMain } = require('electron');
const { categoriasRepo } = require('../../di/setup');

function registerCategoriasHandlers() {
  ipcMain.handle('categorias:list', async () => {
    return await categoriasRepo.getAll();
  });

  ipcMain.handle('categorias:productos', async () => {
    return await categoriasRepo.getProductos();
  });

  ipcMain.handle('categorias:create', async (event, { nombre }) => {
    return await categoriasRepo.create(nombre);
  });

  ipcMain.handle('categorias:update', async (event, { id, nombre }) => {
    return await categoriasRepo.update(id, nombre);
  });

  ipcMain.handle('categorias:delete', async (event, id) => {
    return await categoriasRepo.delete(id);
  });

  ipcMain.handle('categorias:bulk_assign', async (event, { categoria_id, producto_ids }) => {
    return await categoriasRepo.bulkAssign(categoria_id, producto_ids);
  });
}

module.exports = { registerCategoriasHandlers };
