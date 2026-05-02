'use strict';
const { getDb } = require('../connection/Database');

class SqliteCategoriaRepository {
  async getAll() {
    const db = getDb();
    return await db.all(`
      SELECT c.*, COUNT(p.id) as total_productos
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `);
  }

  async getProductos() {
    const db = getDb();
    return await db.all(`
      SELECT p.id, p.nombre, p.codigo, p.marca, p.categoria_id, p.stock_actual, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.nombre ASC
    `);
  }

  async create(nombre) {
    const db = getDb();
    const { lastID } = await db.run('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
    return { id: lastID, nombre };
  }

  async update(id, nombre) {
    const db = getDb();
    await db.run('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre, id]);
  }

  async delete(id) {
    const db = getDb();
    await db.run('DELETE FROM categorias WHERE id = ?', [id]);
  }

  async bulkAssign(categoria_id, producto_ids) {
    const db = getDb();
    if (!producto_ids || producto_ids.length === 0) return;
    const placeholders = producto_ids.map(() => '?').join(',');
    await db.run(`UPDATE productos SET categoria_id = ? WHERE id IN (${placeholders})`, [categoria_id, ...producto_ids]);
  }
}

module.exports = { SqliteCategoriaRepository };
