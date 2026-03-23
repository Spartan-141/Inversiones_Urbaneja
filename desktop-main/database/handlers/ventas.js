'use strict';
const { ipcMain } = require('electron');
const { getDb } = require('../db');

// Create a complete sale (transactional: venta + detalle + pagos + stock deduction)
ipcMain.handle('ventas:create', async (_e, payload) => {
  const db = getDb();
  const { cabecera, detalles, pagos } = payload;

  try {
    await db.run('BEGIN TRANSACTION');

    // 1. Insert sale header
    const ventaInfo = await db.run(`
      INSERT INTO ventas (subtotal_usd, descuento_otorgado_usd, total_usd, tasa_cambio, estado, cliente_nombre, saldo_pendiente_usd, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cabecera.subtotal_usd, cabecera.descuento_otorgado_usd, cabecera.total_usd,
      cabecera.tasa_cambio, cabecera.estado, cabecera.cliente_nombre,
      cabecera.saldo_pendiente_usd, cabecera.notas || ''
    ]);
    const ventaId = ventaInfo.lastID;

    // 2. Insert line items + deduct stock (supports REAL cantidad for kg)
    for (const item of detalles) {
      await db.run(`
        INSERT INTO detalle_venta (venta_id, tipo, ref_id, nombre, cantidad, unidad_medida, precio_unitario_usd, subtotal_usd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ventaId, item.tipo || 'producto', item.ref_id, item.nombre,
        item.cantidad, item.unidad_medida || 'unidad',
        item.precio_unitario_usd, item.subtotal_usd
      ]);

      if (item.tipo === 'producto') {
        // Use REAL subtraction; cantidad can be 0.350 for kg items
        await db.run(
          'UPDATE productos SET stock_actual = MAX(0, stock_actual - ?) WHERE id = ?',
          [item.cantidad, item.ref_id]
        );
      }
    }

    // 3. Insert payment records
    for (const pago of pagos) {
      await db.run(`
        INSERT INTO pagos (venta_id, metodo, monto_usd, monto_ves)
        VALUES (?, ?, ?, ?)
      `, [ventaId, pago.metodo, pago.monto_usd, pago.monto_ves || 0]);
    }

    await db.run('COMMIT');
    return { id: ventaId };
  } catch (err) {
    await db.run('ROLLBACK');
    throw err;
  }
});

ipcMain.handle('ventas:list', async (_e, filters = {}) => {
  const db = getDb();
  let sql = 'SELECT * FROM ventas';
  const where = [];
  const params = [];

  if (filters.estado) { where.push('estado = ?'); params.push(filters.estado); }
  if (filters.fecha_desde) { where.push('fecha >= ?'); params.push(filters.fecha_desde); }
  if (filters.fecha_hasta) { where.push('fecha <= ?'); params.push(filters.fecha_hasta + ' 23:59:59'); }
  if (filters.cliente) { where.push('cliente_nombre LIKE ?'); params.push(`%${filters.cliente}%`); }

  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY fecha DESC';
  if (filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }

  return await db.all(sql, params);
});

ipcMain.handle('ventas:get', async (_e, id) => {
  const db = getDb();
  const venta = await db.get('SELECT * FROM ventas WHERE id = ?', [id]);
  if (!venta) return null;
  const detalles = await db.all('SELECT * FROM detalle_venta WHERE venta_id = ? ORDER BY id ASC', [id]);
  const pagos    = await db.all('SELECT * FROM pagos WHERE venta_id = ? ORDER BY id ASC', [id]);
  const abonos   = await db.all('SELECT * FROM abonos WHERE venta_id = ? ORDER BY fecha ASC', [id]);
  return { ...venta, detalles, pagos, abonos };
});

ipcMain.handle('ventas:ultimas', async (_e, limit = 20) => {
  return await getDb().all('SELECT * FROM ventas ORDER BY fecha DESC LIMIT ?', [limit]);
});

// Update saldo (when an abono is made from CuentasPorCobrar)
ipcMain.handle('ventas:updateSaldo', async (_e, { id, nuevo_saldo, nuevo_estado }) => {
  await getDb().run(
    'UPDATE ventas SET saldo_pendiente_usd = ?, estado = ? WHERE id = ?',
    [nuevo_saldo, nuevo_estado, id]
  );
  return true;
});
