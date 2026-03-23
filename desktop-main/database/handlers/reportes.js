'use strict';
const { ipcMain } = require('electron');
const { getDb } = require('../db');

// Sales summary for a given date range
ipcMain.handle('reportes:ventasPeriodo', async (_e, { fecha_desde, fecha_hasta }) => {
  const db = getDb();
  const desde = fecha_desde + ' 00:00:00';
  const hasta  = fecha_hasta + ' 23:59:59';

  const resumen = await db.get(`
    SELECT
      COUNT(*) AS total_ventas,
      SUM(total_usd) AS ingresos_usd,
      SUM(descuento_otorgado_usd) AS descuentos_usd,
      SUM(CASE WHEN estado='credito' THEN saldo_pendiente_usd ELSE 0 END) AS pendiente_cobrar_usd
    FROM ventas
    WHERE fecha BETWEEN ? AND ?
  `, [desde, hasta]);

  const pagos = await db.all(`
    SELECT p.metodo, SUM(p.monto_usd) as total_usd, SUM(p.monto_ves) as total_ves
    FROM pagos p
    INNER JOIN ventas v ON p.venta_id = v.id
    WHERE v.fecha BETWEEN ? AND ?
    GROUP BY p.metodo
  `, [desde, hasta]);

  const ventas = await db.all(`
    SELECT * FROM ventas WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC
  `, [desde, hasta]);

  return { resumen, pagos, ventas };
});

// Top-selling products
ipcMain.handle('reportes:topProductos', async (_e, { fecha_desde, fecha_hasta, limit = 10 }) => {
  const desde = fecha_desde + ' 00:00:00';
  const hasta  = fecha_hasta + ' 23:59:59';
  return await getDb().all(`
    SELECT d.ref_id, d.nombre, d.unidad_medida,
           SUM(d.cantidad) AS total_cantidad,
           SUM(d.subtotal_usd) AS total_usd,
           COUNT(*) AS veces_vendido
    FROM detalle_venta d
    INNER JOIN ventas v ON d.venta_id = v.id
    WHERE v.fecha BETWEEN ? AND ? AND d.tipo = 'producto'
    GROUP BY d.ref_id
    ORDER BY total_cantidad DESC
    LIMIT ?
  `, [desde, hasta, limit]);
});

// Dashboard KPIs for today
ipcMain.handle('reportes:kpisHoy', async () => {
  const db = getDb();
  const hoy = new Date().toISOString().split('T')[0];
  const desde = `${hoy} 00:00:00`;
  const hasta  = `${hoy} 23:59:59`;

  const ventas = await db.get(`
    SELECT COUNT(*) AS total_transacciones,
           COALESCE(SUM(total_usd), 0) AS total_usd,
           COALESCE(AVG(total_usd), 0) AS promedio_usd
    FROM ventas WHERE fecha BETWEEN ? AND ?
  `, [desde, hasta]);

  const topHoy = await db.all(`
    SELECT d.nombre, SUM(d.cantidad) AS cantidad, SUM(d.subtotal_usd) AS subtotal_usd
    FROM detalle_venta d
    INNER JOIN ventas v ON d.venta_id = v.id
    WHERE v.fecha BETWEEN ? AND ? AND d.tipo = 'producto'
    GROUP BY d.ref_id
    ORDER BY subtotal_usd DESC
    LIMIT 5
  `, [desde, hasta]);

  const stockBajo = await db.all(`
    SELECT id, nombre, unidad_medida, stock_actual, stock_minimo
    FROM productos
    WHERE stock_actual <= stock_minimo AND stock_minimo > 0
    ORDER BY (stock_actual - stock_minimo) ASC
    LIMIT 10
  `);

  return { ventas, topHoy, stockBajo };
});
