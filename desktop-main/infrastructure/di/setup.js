'use strict';
const { SqliteProductoRepository } = require('../database/repositories/SqliteProductoRepository');
const { SqliteVentaRepository } = require('../database/repositories/SqliteVentaRepository');
const { SqliteCategoriaRepository } = require('../database/repositories/SqliteCategoriaRepository');
const { SqliteConfigRepository } = require('../database/repositories/SqliteConfigRepository');
const { SqliteUnitOfWork } = require('../database/connection/SqliteUnitOfWork');
const { VentasUseCases } = require('../../application/use-cases/VentasUseCases');

// Repositories
const productosRepo = new SqliteProductoRepository();
const ventasRepo = new SqliteVentaRepository();
const categoriasRepo = new SqliteCategoriaRepository();
const configRepo = new SqliteConfigRepository();
const uow = new SqliteUnitOfWork();

// Use Cases
const ventasUseCases = new VentasUseCases(ventasRepo, productosRepo, null, uow);

module.exports = {
  ventasUseCases,
  productosRepo,
  categoriasRepo,
  configRepo,
  ventasRepo,
  uow
};
