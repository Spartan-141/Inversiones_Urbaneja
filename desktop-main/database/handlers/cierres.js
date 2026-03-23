'use strict';
const { ipcMain } = require('electron');
const { getDb } = require('../db');

// Get today's sales summary for the close modal
ipcMain.handle('cierres:getResumenHoy', async () => {
  const db = getDb();
  const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const ventas = await db.all(`
    SELECT * FROM ventas
    WHERE fecha >= ? AND fecha < ?
  `, [`${hoy} 00:00:00`, `${hoy} 23:59:59`]);

  let totalVentasCount   = ventas.length;
  let ingresos_usd       = 0;
  let pendiente_cobrar   = 0;
  let efectivo_usd       = 0;
  let efectivo_ves       = 0;
  let digital_ves        = 0;

  for (const v of ventas) {
    ingresos_usd += v.total_usd;
    if (v.estado === 'credito') pendiente_cobrar += v.saldo_pendiente_usd;
  }

  // Aggregate payments
  const pagos = await db.all(`
    SELECT p.metodo, SUM(p.monto_usd) as total_usd, SUM(p.monto_ves) as total_ves
    FROM pagos p
    INNER JOIN ventas v ON p.venta_id = v.id
    WHERE v.fecha >= ? AND v.fecha < ?
    GROUP BY p.metodo
  `, [`${hoy} 00:00:00`, `${hoy} 23:59:59`]);

  const pagosPorMetodo = {};
  for (const p of pagos) {
    pagosPorMetodo[p.metodo] = { total_usd: p.total_usd, total_ves: p.total_ves };
    if (p.metodo === 'efectivo_usd') efectivo_usd += p.total_usd;
    if (p.metodo === 'efectivo_ves') efectivo_ves += p.total_ves;
    if (p.metodo === 'pago_movil' || p.metodo === 'transferencia') digital_ves += p.total_ves;
  }

  // Also include abonos from today
  const abonos = await db.all(`
    SELECT a.metodo, SUM(a.monto_usd) as total_usd, SUM(a.monto_ves) as total_ves
    FROM abonos a
    WHERE a.fecha >= ? AND a.fecha < ?
    GROUP BY a.metodo
  `, [`${hoy} 00:00:00`, `${hoy} 23:59:59`]);

  for (const a of abonos) {
    if (a.metodo === 'efectivo_usd') efectivo_usd += a.total_usd || 0;
    if (a.metodo === 'efectivo_ves') efectivo_ves += a.total_ves || 0;
    if (a.metodo === 'pago_movil' || a.metodo === 'transferencia') digital_ves += a.total_ves || 0;
  }

  return {
    fecha: hoy,
    totalVentasCount,
    ingresos_usd,
    pendiente_cobrar_usd: pendiente_cobrar,
    efectivo_usd_sistema: efectivo_usd,
    efectivo_ves_sistema: efectivo_ves,
    digital_ves_sistema: digital_ves,
    pagosPorMetodo,
  };
});

// Check if today is already closed
ipcMain.handle('cierres:getHoy', async () => {
  const hoy = new Date().toISOString().split('T')[0];
  return await getDb().get('SELECT * FROM cierres_dia WHERE fecha = ?', [hoy]);
});

// Save a daily close record
ipcMain.handle('cierres:cerrar', async (_e, data) => {
  const db = getDb();
  const result = await db.run(`
    INSERT OR REPLACE INTO cierres_dia
      (fecha, tasa_cierre, total_ventas_count, ingresos_usd,
       efectivo_usd_sistema, efectivo_ves_sistema, digital_ves_sistema,
       efectivo_usd_contado, efectivo_ves_contado, digital_ves_contado,
       diferencia_usd, diferencia_ves, pendiente_cobrar_usd, notas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.fecha, data.tasa_cierre, data.totalVentasCount, data.ingresos_usd,
    data.efectivo_usd_sistema, data.efectivo_ves_sistema, data.digital_ves_sistema,
    data.efectivo_usd_contado, data.efectivo_ves_contado, data.digital_ves_contado,
    data.diferencia_usd, data.diferencia_ves, data.pendiente_cobrar_usd,
    data.notas || ''
  ]);
  return { id: result.lastID };
});

// List historical closes
ipcMain.handle('cierres:list', async (_e, limit = 30) => {
  return await getDb().all('SELECT * FROM cierres_dia ORDER BY fecha DESC LIMIT ?', [limit]);
});
