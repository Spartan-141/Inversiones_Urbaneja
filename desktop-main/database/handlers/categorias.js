'use strict';
const { ipcMain } = require('electron');
const { getDb } = require('../db');

ipcMain.handle('categorias:list', async () => {
  return await getDb().all('SELECT * FROM categorias ORDER BY nombre ASC');
});

ipcMain.handle('categorias:create', async (_e, nombre) => {
  const result = await getDb().run('INSERT INTO categorias (nombre) VALUES (?)', [nombre.trim()]);
  return { id: result.lastID, nombre: nombre.trim() };
});

ipcMain.handle('categorias:update', async (_e, { id, nombre }) => {
  await getDb().run('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre.trim(), id]);
  return true;
});

ipcMain.handle('categorias:delete', async (_e, id) => {
  const db = getDb();
  // Set categoria_id to NULL for products in this category before deleting
  await db.run('UPDATE productos SET categoria_id = NULL WHERE categoria_id = ?', [id]);
  await db.run('DELETE FROM categorias WHERE id = ?', [id]);
  return true;
});
