const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const os = require('os');

async function migrate() {
  const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'inversiones-urbaneja-pos', 'urbaneja_pos.db');
  console.log('Migrating DB at:', dbPath);
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    
    await db.exec('BEGIN TRANSACTION;');

    // 1. Rename columns in productos
    try { await db.exec('ALTER TABLE productos RENAME COLUMN precio_compra_usd TO precio_compra'); } catch (e) { console.log('precio_compra already exists or error:', e.message); }
    try { await db.exec('ALTER TABLE productos RENAME COLUMN precio_venta_usd TO precio_venta'); } catch (e) { console.log('precio_venta already exists or error:', e.message); }

    // 2. Fix detalle_venta
    // It has precio_unitario_usd, subtotal_usd, subtotal.
    // We want precio_unitario and subtotal.
    try { await db.exec('ALTER TABLE detalle_venta RENAME COLUMN precio_unitario_usd TO precio_unitario'); } catch (e) { console.log('precio_unitario already exists or error:', e.message); }
    // subtotal already exists, so we just drop subtotal_usd (or ignore it)

    // 3. Fix pagos and abonos
    // They have monto_usd and monto_ves. We want 'monto'.
    // We'll copy monto_ves to a new column 'monto' if needed, or just rename monto_ves.
    try { await db.exec('ALTER TABLE pagos RENAME COLUMN monto_ves TO monto'); } catch (e) { console.log('monto in pagos already exists or error:', e.message); }
    try { await db.exec('ALTER TABLE abonos RENAME COLUMN monto_ves TO monto'); } catch (e) { console.log('monto in abonos already exists or error:', e.message); }

    // 4. Fix ventas
    // It has saldo_pendiente_usd and saldo_pendiente. We just want saldo_pendiente.
    // Nothing to do here since saldo_pendiente exists.

    await db.exec('COMMIT;');
    console.log('Migration completed successfully.');
    await db.close();
  } catch (err) {
    console.error('Migration failed:', err);
    // rollback?
  }
}

migrate();
