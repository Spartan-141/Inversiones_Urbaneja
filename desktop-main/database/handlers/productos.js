'use strict';
const { ipcMain } = require('electron');
const { getDb } = require('../db');

// ── List all products with optional filters ───────────────────────────────────
ipcMain.handle('productos:list', async (_e, filters = {}) => {
  const db = getDb();
  let sql = `
    SELECT p.*, c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
  `;
  const where = [];
  const params = [];

  if (filters.categoria_id) { where.push('p.categoria_id = ?'); params.push(filters.categoria_id); }
  if (filters.query) {
    where.push('(p.nombre LIKE ? OR p.codigo LIKE ? OR p.marca LIKE ?)');
    params.push(`%${filters.query}%`, `%${filters.query}%`, `%${filters.query}%`);
  }
  if (filters.unidad_medida) { where.push('p.unidad_medida = ?'); params.push(filters.unidad_medida); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY p.nombre ASC';

  return await db.all(sql, params);
});

// ── Search for POS (fast, minimal fields) ────────────────────────────────────
ipcMain.handle('productos:search', async (_e, q) => {
  const db = getDb();
  const like = `%${q}%`;
  return await db.all(`
    SELECT id, codigo, nombre, marca, unidad_medida, precio_venta_usd,
           stock_actual, es_favorito, categoria_id
    FROM productos
    WHERE (nombre LIKE ? OR codigo LIKE ? OR marca LIKE ?)
    ORDER BY nombre ASC
    LIMIT 20
  `, [like, like, like]);
});

// ── Favorites panel ───────────────────────────────────────────────────────────
ipcMain.handle('productos:favoritos', async () => {
  return await getDb().all(`
    SELECT id, nombre, unidad_medida, precio_venta_usd, stock_actual, categoria_id
    FROM productos
    WHERE es_favorito = 1
    ORDER BY nombre ASC
  `);
});

// ── Expiry alerts ─────────────────────────────────────────────────────────────
ipcMain.handle('productos:alertasVencimiento', async () => {
  return await getDb().all(`
    SELECT id, nombre, unidad_medida, stock_actual, fecha_vencimiento,
           JULIANDAY(fecha_vencimiento) - JULIANDAY('now', 'localtime') AS dias_restantes
    FROM productos
    WHERE fecha_vencimiento IS NOT NULL
      AND fecha_vencimiento != ''
      AND JULIANDAY(fecha_vencimiento) - JULIANDAY('now', 'localtime') <= 7
    ORDER BY dias_restantes ASC
  `);
});

// ── CRUD ──────────────────────────────────────────────────────────────────────
ipcMain.handle('productos:create', async (_e, p) => {
  const db = getDb();
  const result = await db.run(`
    INSERT INTO productos
      (codigo, nombre, marca, categoria_id, unidad_medida, precio_compra_usd,
       precio_venta_usd, stock_actual, stock_minimo, fecha_vencimiento, es_favorito, descripcion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    p.codigo || null, p.nombre, p.marca || '', p.categoria_id || null,
    p.unidad_medida || 'unidad', p.precio_compra_usd || 0, p.precio_venta_usd || 0,
    p.stock_actual || 0, p.stock_minimo || 0,
    p.fecha_vencimiento || null, p.es_favorito ? 1 : 0, p.descripcion || ''
  ]);
  return { id: result.lastID };
});

ipcMain.handle('productos:update', async (_e, p) => {
  await getDb().run(`
    UPDATE productos SET
      codigo = ?, nombre = ?, marca = ?, categoria_id = ?, unidad_medida = ?,
      precio_compra_usd = ?, precio_venta_usd = ?, stock_actual = ?,
      stock_minimo = ?, fecha_vencimiento = ?, es_favorito = ?, descripcion = ?
    WHERE id = ?
  `, [
    p.codigo || null, p.nombre, p.marca || '', p.categoria_id || null,
    p.unidad_medida || 'unidad', p.precio_compra_usd || 0, p.precio_venta_usd || 0,
    p.stock_actual || 0, p.stock_minimo || 0,
    p.fecha_vencimiento || null, p.es_favorito ? 1 : 0, p.descripcion || '', p.id
  ]);
  return true;
});

ipcMain.handle('productos:delete', async (_e, id) => {
  await getDb().run('DELETE FROM productos WHERE id = ?', [id]);
  return true;
});

ipcMain.handle('productos:toggleFavorito', async (_e, id) => {
  const db = getDb();
  const p = await db.get('SELECT es_favorito FROM productos WHERE id = ?', [id]);
  if (!p) return false;
  await db.run('UPDATE productos SET es_favorito = ? WHERE id = ?', [p.es_favorito ? 0 : 1, id]);
  return true;
});

// ── Stock bulk adjust ─────────────────────────────────────────────────────────
ipcMain.handle('productos:ajustarStock', async (_e, { id, delta }) => {
  await getDb().run(
    'UPDATE productos SET stock_actual = MAX(0, stock_actual + ?) WHERE id = ?',
    [delta, id]
  );
  return true;
});
