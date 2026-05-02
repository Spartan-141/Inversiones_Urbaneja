/**
 * Interface for Producto Repository
 */
class IProductoRepository {
  async getById(id) { throw new Error('Not implemented'); }
  async getByCodigo(codigo) { throw new Error('Not implemented'); }
  async getAll(filters) { throw new Error('Not implemented'); }
  async getPaginated(params) { throw new Error('Not implemented'); }
  async create(producto) { throw new Error('Not implemented'); }
  async update(id, producto) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
  async updateStock(id, cantidad) { throw new Error('Not implemented'); }
  async search(query) { throw new Error('Not implemented'); }
}

module.exports = { IProductoRepository };
