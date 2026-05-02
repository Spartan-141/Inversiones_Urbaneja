'use strict';
const { getDb } = require('../connection/Database');
const { format } = require('date-fns');

class SqliteCierreRepository {
  async getResumenHoy() {
    const db = getDb();
    const hoy = format(new Date(), 'yyyy-MM-dd');
    
    const resumen = await db.get(`
      SELECT 
        COUNT(*) as totalVentasCount,
        SUM(subtotal) as subtotal,
        SUM(total) as ingresos,
        SUM(descuento_otorgado) as descuentos,
        SUM(saldo_pendiente) as pendiente_cobrar
      FROM ventas
      WHERE date(fecha) = ?
    `, [hoy]);

    const pagos = await db.all(`
      SELECT p.metodo, SUM(p.monto) as total
      FROM pagos p
      JOIN ventas v ON p.venta_id = v.id
      WHERE date(v.fecha) = ?
      GROUP BY p.metodo
    `, [hoy]);

    return {
      fecha: hoy,
      totalVentasCount: resumen?.totalVentasCount || 0,
      ingresos: resumen?.ingresos || 0,
      descuentos: resumen?.descuentos || 0,
      pendiente_cobrar: resumen?.pendiente_cobrar || 0,
      pagos: pagos || []
    };
  }

  async getHoy() {
    const db = getDb();
    const hoy = format(new Date(), 'yyyy-MM-dd');
    return await db.get('SELECT * FROM cierres_dia WHERE fecha = ?', [hoy]);
  }

  async cerrar(data) {
    const db = getDb();
    await db.run(`
      INSERT INTO cierres_dia (
        fecha, total_ventas_count, ingresos, efectivo_sistema, digital_sistema,
        efectivo_contado, digital_contado, diferencia, pendiente_cobrar, ganancia_neta, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.fecha, data.totalVentasCount, data.ingresos, data.efectivo_sistema, data.digital_sistema,
      data.efectivo_contado, data.digital_contado, data.diferencia, data.pendiente_cobrar, data.ganancia_neta, data.notas
    ]);
  }
}

module.exports = { SqliteCierreRepository };
