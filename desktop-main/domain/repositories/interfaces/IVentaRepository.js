/**
 * Interface for Venta Repository
 */
class IVentaRepository {
  async getById(id) { throw new Error('Not implemented'); }
  async getPaginated(params) { throw new Error('Not implemented'); }
  async create(venta) { throw new Error('Not implemented'); }
  async createDetalle(detalle) { throw new Error('Not implemented'); }
  async createPago(pago) { throw new Error('Not implemented'); }
  async createAbono(abono) { throw new Error('Not implemented'); }
  async getCalendario(year, month) { throw new Error('Not implemented'); }
}

module.exports = { IVentaRepository };
