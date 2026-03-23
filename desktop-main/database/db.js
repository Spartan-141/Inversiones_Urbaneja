'use strict';
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const { app } = require('electron');

let db;

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

async function initDb() {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'urbaneja_pos.db');
    console.log('[DB] Initializing database at:', dbPath);

    db = await open({ filename: dbPath, driver: sqlite3.Database });

    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA foreign_keys = ON;');

    // ─── Schema ──────────────────────────────────────────────────────────────
    await db.exec(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categorias (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS productos (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo            TEXT UNIQUE,
        nombre            TEXT NOT NULL,
        marca             TEXT DEFAULT '',
        categoria_id      INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
        unidad_medida     TEXT NOT NULL DEFAULT 'unidad',
        precio_compra_usd REAL NOT NULL DEFAULT 0,
        precio_venta_usd  REAL NOT NULL DEFAULT 0,
        stock_actual      REAL NOT NULL DEFAULT 0,
        stock_minimo      REAL NOT NULL DEFAULT 0,
        fecha_vencimiento TEXT DEFAULT NULL,
        es_favorito       INTEGER NOT NULL DEFAULT 0,
        descripcion       TEXT DEFAULT '',
        created_at        TEXT DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS ventas (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha                 TEXT DEFAULT (datetime('now','localtime')),
        subtotal_usd          REAL NOT NULL,
        descuento_otorgado_usd REAL NOT NULL DEFAULT 0,
        total_usd             REAL NOT NULL,
        tasa_cambio           REAL NOT NULL,
        estado                TEXT NOT NULL DEFAULT 'pagada',
        cliente_nombre        TEXT DEFAULT '',
        saldo_pendiente_usd   REAL NOT NULL DEFAULT 0,
        notas                 TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS detalle_venta (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id            INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
        tipo                TEXT NOT NULL DEFAULT 'producto',
        ref_id              INTEGER NOT NULL,
        nombre              TEXT NOT NULL,
        cantidad            REAL NOT NULL,
        unidad_medida       TEXT NOT NULL DEFAULT 'unidad',
        precio_unitario_usd REAL NOT NULL,
        subtotal_usd        REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pagos (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
        metodo   TEXT NOT NULL,
        monto_usd REAL NOT NULL,
        monto_ves REAL DEFAULT 0,
        fecha    TEXT DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS abonos (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id  INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
        metodo    TEXT NOT NULL,
        monto_usd REAL NOT NULL,
        monto_ves REAL DEFAULT 0,
        fecha     TEXT DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS cierres_dia (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha                TEXT NOT NULL UNIQUE,
        tasa_cierre          REAL NOT NULL,
        total_ventas_count   INTEGER DEFAULT 0,
        ingresos_usd         REAL DEFAULT 0,
        efectivo_usd_sistema REAL DEFAULT 0,
        efectivo_ves_sistema REAL DEFAULT 0,
        digital_ves_sistema  REAL DEFAULT 0,
        efectivo_usd_contado REAL DEFAULT 0,
        efectivo_ves_contado REAL DEFAULT 0,
        digital_ves_contado  REAL DEFAULT 0,
        diferencia_usd       REAL DEFAULT 0,
        diferencia_ves       REAL DEFAULT 0,
        pendiente_cobrar_usd REAL DEFAULT 0,
        notas                TEXT DEFAULT '',
        cerrado_en           TEXT DEFAULT (datetime('now','localtime'))
      );
    `);

    // ─── Seed defaults ────────────────────────────────────────────────────────
    await db.exec('BEGIN TRANSACTION;');
    const ic = 'INSERT OR IGNORE INTO configuracion VALUES (?, ?)';
    await db.run(ic, ['tasa_del_dia',    '40.00']);
    await db.run(ic, ['nombre_tienda',   'Inversiones Urbaneja']);
    await db.run(ic, ['telefono_tienda', '']);
    await db.run(ic, ['direccion_tienda','Venezuela']);
    await db.run(ic, ['ticket_pie',      '¡Gracias por su compra!']);
    await db.run(ic, ['impresora_ancho', '80']);

    const icat = 'INSERT OR IGNORE INTO categorias (nombre) VALUES (?)';
    for (const c of ['Líquidos', 'Snacks', 'Perecederos', 'Hogar', 'Granos y Pastas', 'Lácteos', 'Panadería', 'Carnes y Embutidos', 'Limpieza', 'Otros']) {
      await db.run(icat, [c]);
    }
    await db.exec('COMMIT;');

    // ─── Migrations ───────────────────────────────────────────────────────────
    // Add es_favorito if missing (for older DBs)
    try { await db.run('ALTER TABLE productos ADD COLUMN es_favorito INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
    try { await db.run('ALTER TABLE productos ADD COLUMN fecha_vencimiento TEXT DEFAULT NULL'); } catch (_) {}
    try { await db.run('ALTER TABLE productos ADD COLUMN unidad_medida TEXT NOT NULL DEFAULT \'unidad\''); } catch (_) {}
    try { await db.run('ALTER TABLE detalle_venta ADD COLUMN unidad_medida TEXT NOT NULL DEFAULT \'unidad\''); } catch (_) {}

    console.log('[DB] Database initialized successfully.');
    return db;
  } catch (error) {
    if (db) { try { await db.exec('ROLLBACK;'); } catch (_) {} }
    console.error('[DB] CRITICAL ERROR during initDb:', error);
    throw error;
  }
}

module.exports = { getDb, initDb };
