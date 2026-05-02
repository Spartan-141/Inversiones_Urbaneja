'use strict';
const { getDb } = require('../connection/Database');

class SqliteProductoRepository {
  async getById(id) {
    const db = getDb();
    return await db.get('SELECT * FROM productos WHERE id = ?', [id]);
  }

  async getByCodigo(codigo) {
    const db = getDb();
    return await db.get('SELECT * FROM productos WHERE codigo = ?', [codigo]);
  }

  async getPaginated({ page = 1, perPage = 25, search, categoria_id, bajo_stock }) {
    const db = getDb();
    let query = 'SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (p.nombre LIKE ? OR p.codigo LIKE ? OR p.marca LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (categoria_id) {
      query += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (bajo_stock) {
      query += ' AND p.stock_actual <= p.stock_minimo';
    }

    const countQuery = `SELECT COUNT(*) as total FROM (SELECT id FROM productos p WHERE 1=1 ${search ? ' AND (p.nombre LIKE ? OR p.codigo LIKE ? OR p.marca LIKE ?)' : ''} ${categoria_id ? ' AND p.categoria_id = ?' : ''} ${bajo_stock ? ' AND p.stock_actual <= p.stock_minimo' : ''})`;
    const { total } = await db.get(countQuery, params);

    query += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
    params.push(perPage, (page - 1) * perPage);

    const productos = await db.all(query, params);
    return {
      productos,
      total,
      page,
      pages: Math.ceil(total / perPage)
    };
  }

  async create(data) {
    const db = getDb();
    const { lastID } = await db.run(`
      INSERT INTO productos (codigo, nombre, marca, categoria_id, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, descripcion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.codigo, data.nombre, data.marca, data.categoria_id, data.unidad_medida, data.precio_compra || 0, data.precio_venta || 0, data.stock_actual, data.stock_minimo, data.descripcion]);
    return lastID;
  }

  async update(id, data) {
    const db = getDb();
    await db.run(`
      UPDATE productos SET
        codigo = ?, nombre = ?, marca = ?, categoria_id = ?, unidad_medida = ?,
        precio_compra = ?, precio_venta = ?, stock_actual = ?, stock_minimo = ?, descripcion = ?
      WHERE id = ?
    `, [data.codigo, data.nombre, data.marca, data.categoria_id, data.unidad_medida, data.precio_compra || 0, data.precio_venta || 0, data.stock_actual, data.stock_minimo, data.descripcion, id]);
  }

  async updateStock(id, cantidad) {
    const db = getDb();
    await db.run('UPDATE productos SET stock_actual = ? WHERE id = ?', [cantidad, id]);
  }

  async delete(id) {
    const db = getDb();
    await db.run('DELETE FROM productos WHERE id = ?', [id]);
  }

  async search(queryStr) {
    const db = getDb();
    const s = `%${queryStr}%`;
    return await db.all('SELECT * FROM productos WHERE nombre LIKE ? OR codigo LIKE ? OR marca LIKE ? LIMIT 50', [s, s, s]);
  }

  async getAlertasVencimiento() {
    const db = getDb();
    return await db.all(`
      SELECT *, (julianday(fecha_vencimiento) - julianday('now', 'localtime')) as dias_restantes
      FROM productos
      WHERE fecha_vencimiento IS NOT NULL
      AND (julianday(fecha_vencimiento) - julianday('now', 'localtime')) <= 30
      ORDER BY fecha_vencimiento ASC
    `);
  }
}

module.exports = { SqliteProductoRepository };


