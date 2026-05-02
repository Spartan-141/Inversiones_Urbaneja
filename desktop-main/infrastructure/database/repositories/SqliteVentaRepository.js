'use strict';
const { getDb } = require('../connection/Database');
const { format } = require('date-fns');

class SqliteVentaRepository {
  async create(data) {
    const db = getDb();
    const { lastID } = await db.run(`
      INSERT INTO ventas (subtotal, descuento_otorgado, total, estado, cliente_nombre, saldo_pendiente, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [data.subtotal, data.descuento_otorgado, data.total, data.estado, data.cliente_nombre, data.saldo_pendiente, data.notas]);
    return lastID;
  }

  async createDetalle(d) {
    const db = getDb();
    await db.run(`
      INSERT INTO detalle_venta (venta_id, tipo, ref_id, nombre, cantidad, unidad_medida, precio_unitario, subtotal, cantidad_hojas_gastadas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [d.venta_id, d.tipo, d.ref_id, d.nombre, d.cantidad, d.unidad_medida, d.precio_unitario, d.subtotal, d.cantidad_hojas_gastadas]);
  }

  async createPago(p) {
    const db = getDb();
    await db.run(`
      INSERT INTO pagos (venta_id, metodo, monto)
      VALUES (?, ?, ?)
    `, [p.venta_id, p.metodo, p.monto]);
  }

  async getPaginated({ page = 1, perPage = 25, fechaDesde, fechaHasta, estado, cliente }) {
    const db = getDb();
    let query = 'FROM ventas WHERE 1=1';
    const params = [];

    if (fechaDesde) { query += ' AND date(fecha) >= date(?)'; params.push(fechaDesde); }
    if (fechaHasta) { query += ' AND date(fecha) <= date(?)'; params.push(fechaHasta); }
    if (estado)     { query += ' AND estado = ?'; params.push(estado); }
    if (cliente)    { query += ' AND cliente_nombre LIKE ?'; params.push(`%${cliente}%`); }

    const { total } = await db.get(`SELECT COUNT(*) as total ${query}`, params);
    const ventas = await db.all(`SELECT * ${query} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, perPage, (page - 1) * perPage]);

    // Resumen
    const resumen = await db.get(`
      SELECT 
        SUM(total) as ingresos,
        SUM(descuento_otorgado) as descuentos,
        SUM(saldo_pendiente) as pendiente_cobrar
      ${query}
    `, params);

    // Pagos por método
    const pagosResumen = await db.all(`
      SELECT p.metodo, SUM(p.monto) as total
      FROM pagos p
      JOIN ventas v ON p.venta_id = v.id
      WHERE 1=1
      ${fechaDesde ? ' AND date(v.fecha) >= date(?)' : ''}
      ${fechaHasta ? ' AND date(v.fecha) <= date(?)' : ''}
      GROUP BY p.metodo
    `, [
      ...(fechaDesde ? [fechaDesde] : []),
      ...(fechaHasta ? [fechaHasta] : [])
    ]);

    return {
      ventas,
      total,
      page,
      pages: Math.ceil(total / perPage),
      resumen: { ...resumen, pagos: pagosResumen }
    };
  }

  async getById(id) {
    const db = getDb();
    const venta = await db.get('SELECT * FROM ventas WHERE id = ?', [id]);
    if (!venta) return null;
    venta.detalles = await db.all('SELECT * FROM detalle_venta WHERE venta_id = ?', [id]);
    venta.pagos = await db.all('SELECT * FROM pagos WHERE venta_id = ?', [id]);
    venta.abonos = await db.all('SELECT * FROM abonos WHERE venta_id = ?', [id]);
    return venta;
  }

  async getCalendario(year, month) {
    const db = getDb();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    return await db.all(`
      SELECT 
        date(fecha) as fecha,
        COUNT(*) as total_ventas,
        SUM(total) as ingresos,
        SUM(CASE WHEN estado = 'credito' THEN 1 ELSE 0 END) as creditos
      FROM ventas
      WHERE strftime('%Y-%m', fecha) = ?
      GROUP BY date(fecha)
    `, [monthStr]);
  }

  async getKpisHoy() {
    const db = getDb();
    const hoy = format(new Date(), 'yyyy-MM-dd');
    
    const ventas = await db.get(`
      SELECT 
        COUNT(*) as total_transacciones,
        SUM(total) as total_ves,
        AVG(total) as promedio_ves
      FROM ventas
      WHERE date(fecha) = ?
    `, [hoy]);

    const topHoy = await db.all(`
      SELECT nombre, SUM(subtotal) as subtotal
      FROM detalle_venta
      WHERE venta_id IN (SELECT id FROM ventas WHERE date(fecha) = ?)
      GROUP BY nombre
      ORDER BY subtotal DESC
      LIMIT 5
    `, [hoy]);

    const stockBajo = await db.all(`
      SELECT nombre, stock_actual, stock_minimo, unidad_medida
      FROM productos
      WHERE stock_actual <= stock_minimo
    `);

    return {
      ventas: {
        total_transacciones: ventas?.total_transacciones || 0,
        total_ves: ventas?.total_ves || 0,
        promedio_ves: ventas?.promedio_ves || 0
      },
      topHoy,
      stockBajo
    };
  }

  async addAbono({ venta_id, metodo, monto }) {
    const db = getDb();
    await db.run('INSERT INTO abonos (venta_id, metodo, monto) VALUES (?, ?, ?)', [venta_id, metodo, monto]);
    await db.run('UPDATE ventas SET saldo_pendiente = MAX(0, saldo_pendiente - ?) WHERE id = ?', [monto, venta_id]);
    await db.run('UPDATE ventas SET estado = "pagada" WHERE id = ? AND saldo_pendiente <= 0.05', [venta_id]);
  }
}

module.exports = { SqliteVentaRepository };

