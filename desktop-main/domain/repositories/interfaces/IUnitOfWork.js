/**
 * Interface for Unit of Work (Transaction Management)
 */
class IUnitOfWork {
  async start() { throw new Error('Not implemented'); }
  async commit() { throw new Error('Not implemented'); }
  async rollback() { throw new Error('Not implemented'); }
}

module.exports = { IUnitOfWork };
