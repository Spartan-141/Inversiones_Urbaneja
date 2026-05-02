'use strict';
const { getDb } = require('../connection/Database');

class SqliteConfigRepository {
  async get(clave) {
    const db = getDb();
    const row = await db.get('SELECT valor FROM configuracion WHERE clave = ?', [clave]);
    return row ? row.valor : null;
  }

  async getAll() {
    const db = getDb();
    const rows = await db.all('SELECT * FROM configuracion');
    const config = {};
    rows.forEach(r => config[r.clave] = r.valor);
    return config;
  }

  async set(clave, valor) {
    const db = getDb();
    await db.run('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)', [clave, valor]);
  }
}

module.exports = { SqliteConfigRepository };
