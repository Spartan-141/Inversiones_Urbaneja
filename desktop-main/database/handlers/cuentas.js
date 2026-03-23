'use strict';
const { ipcMain } = require('electron');
const { getDb } = require('../db');

// List all credit sales with pending balance
ipcMain.handle('cuentas:list', async () => {
  return await getDb().all(`
    SELECT * FROM ventas
    WHERE estado = 'credito' AND saldo_pendiente_usd > 0.001
    ORDER BY fecha DESC
  `);
});

// Get a single credit sale with all related data
ipcMain.handle('cuentas:get', async (_e, id) => {
  const db = getDb();
  const venta  = await db.get('SELECT * FROM ventas WHERE id = ?', [id]);
  if (!venta) return null;
  const detalles = await db.all('SELECT * FROM detalle_venta WHERE venta_id = ?', [id]);
  const pagos    = await db.all('SELECT * FROM pagos WHERE venta_id = ?', [id]);
  const abonos   = await db.all('SELECT * FROM abonos WHERE venta_id = ? ORDER BY fecha ASC', [id]);
  return { ...venta, detalles, pagos, abonos };
});

// Record a partial or full payment on a credit sale
ipcMain.handle('cuentas:abonar', async (_e, { venta_id, pagosArr, tasa }) => {
  const db = getDb();
  try {
    await db.run('BEGIN TRANSACTION');

    const venta = await db.get('SELECT * FROM ventas WHERE id = ?', [venta_id]);
    if (!venta) throw new Error('Venta no encontrada');

    // Sum abono amount in USD
    let totalAbonadoUsd = 0;
    for (const p of pagosArr) {
      totalAbonadoUsd += p.monto_usd;
      await db.run(
        'INSERT INTO abonos (venta_id, metodo, monto_usd, monto_ves) VALUES (?, ?, ?, ?)',
        [venta_id, p.metodo, p.monto_usd, p.monto_ves || 0]
      );
    }

    const nuevoSaldo = Math.max(0, venta.saldo_pendiente_usd - totalAbonadoUsd);
    const nuevoEstado = nuevoSaldo < 0.005 ? 'pagada' : 'credito';

    await db.run(
      'UPDATE ventas SET saldo_pendiente_usd = ?, estado = ? WHERE id = ?',
      [nuevoSaldo, nuevoEstado, venta_id]
    );

    await db.run('COMMIT');
    return { nuevoSaldo, nuevoEstado };
  } catch (err) {
    await db.run('ROLLBACK');
    throw err;
  }
});
