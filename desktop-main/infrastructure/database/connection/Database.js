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
        precio_compra     REAL NOT NULL DEFAULT 0,
        precio_venta      REAL NOT NULL DEFAULT 0,
        stock_actual      REAL NOT NULL DEFAULT 0,
        stock_minimo      REAL NOT NULL DEFAULT 0,
        fecha_vencimiento TEXT DEFAULT NULL,
        es_favorito       INTEGER NOT NULL DEFAULT 0,
        descripcion       TEXT DEFAULT '',
        created_at        TEXT DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS insumos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        tipo TEXT DEFAULT '',
        stock REAL NOT NULL DEFAULT 0,
        stock_minimo REAL NOT NULL DEFAULT 0,
        costo_unitario REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS servicios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        precio REAL NOT NULL DEFAULT 0,
        insumo_id INTEGER REFERENCES insumos(id) ON DELETE SET NULL,
        activo INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS ventas (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha                 TEXT DEFAULT (datetime('now','localtime')),
        subtotal              REAL NOT NULL DEFAULT 0,
        descuento_otorgado    REAL NOT NULL DEFAULT 0,
        total                 REAL NOT NULL DEFAULT 0,
        estado                TEXT NOT NULL DEFAULT 'pagada',
        cliente_nombre        TEXT DEFAULT '',
        saldo_pendiente       REAL NOT NULL DEFAULT 0,
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
        precio_unitario     REAL NOT NULL DEFAULT 0,
        subtotal            REAL NOT NULL DEFAULT 0,
        cantidad_hojas_gastadas REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS pagos (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id  INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
        metodo    TEXT NOT NULL,
        monto     REAL NOT NULL DEFAULT 0,
        fecha     TEXT DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS abonos (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id  INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
        metodo    TEXT NOT NULL,
        monto     REAL NOT NULL DEFAULT 0,
        fecha     TEXT DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS mermas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
        insumo_id INTEGER REFERENCES insumos(id) ON DELETE SET NULL,
        cantidad REAL NOT NULL,
        motivo TEXT NOT NULL,
        notas TEXT DEFAULT '',
        fecha TEXT DEFAULT (datetime('now','localtime'))
      );
    `);

    // Ensure columns exist (Manual migrations)
    try { await db.exec('ALTER TABLE ventas ADD COLUMN subtotal REAL NOT NULL DEFAULT 0'); } catch (e) {}
    try { await db.exec('ALTER TABLE ventas ADD COLUMN total REAL NOT NULL DEFAULT 0'); } catch (e) {}
    try { await db.exec('ALTER TABLE ventas ADD COLUMN descuento_otorgado REAL NOT NULL DEFAULT 0'); } catch (e) {}
    try { await db.exec('ALTER TABLE ventas ADD COLUMN saldo_pendiente REAL NOT NULL DEFAULT 0'); } catch (e) {}
    try { await db.exec('ALTER TABLE detalle_venta ADD COLUMN subtotal REAL NOT NULL DEFAULT 0'); } catch (e) {}
    console.log('[DB] Basic migrations checked.');

    // ─── Seed defaults ────────────────────────────────────────────────────────
    await db.exec('BEGIN TRANSACTION;');
    const ic = 'INSERT OR IGNORE INTO configuracion VALUES (?, ?)';
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

    console.log('[DB] Database initialized successfully.');
    return db;
  } catch (error) {
    if (db) { try { await db.exec('ROLLBACK;'); } catch (_) {} }
    console.error('[DB] CRITICAL ERROR during initDb:', error);
    throw error;
  }
}

module.exports = { getDb, initDb };
