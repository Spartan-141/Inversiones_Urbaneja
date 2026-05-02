'use strict';
const { getDb } = require('./Database');

class SqliteUnitOfWork {
  async start() {
    const db = getDb();
    await db.exec('BEGIN TRANSACTION;');
  }

  async commit() {
    const db = getDb();
    await db.exec('COMMIT;');
  }

  async rollback() {
    const db = getDb();
    try {
      await db.exec('ROLLBACK;');
    } catch (e) {
      console.warn('[UoW] Rollback failed (possibly already rolled back):', e.message);
    }
  }
}

module.exports = { SqliteUnitOfWork };
