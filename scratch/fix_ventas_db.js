const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const os = require('os');

async function fix() {
  const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'inversiones-urbaneja-pos', 'urbaneja_pos.db');
  console.log('Fixing DB at:', dbPath);
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.exec('BEGIN TRANSACTION;');

    const colsToDropVentas = ['subtotal_usd', 'descuento_otorgado_usd', 'total_usd', 'tasa_cambio', 'saldo_pendiente_usd'];
    for (const col of colsToDropVentas) {
      try {
        await db.exec(`ALTER TABLE ventas DROP COLUMN ${col}`);
        console.log(`Dropped ${col} from ventas`);
      } catch (e) {
        console.log(`Could not drop ${col} from ventas:`, e.message);
      }
    }

    try {
      await db.exec('ALTER TABLE detalle_venta DROP COLUMN subtotal_usd');
      console.log('Dropped subtotal_usd from detalle_venta');
    } catch (e) {
      console.log('Could not drop subtotal_usd from detalle_venta:', e.message);
    }

    await db.exec('COMMIT;');
    console.log('Fix completed successfully.');
    await db.close();
  } catch (err) {
    console.error('Fix failed:', err);
  }
}

fix();
