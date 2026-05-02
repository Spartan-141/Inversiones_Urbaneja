'use strict';
const { ipcMain } = require('electron');
const { ventasUseCases } = require('../../di/setup');

function registerVentasHandlers() {
  ipcMain.handle('ventas:create', async (event, payload) => {
    const result = await ventasUseCases.crearVenta(payload);
    if (!result.isSuccess) throw result.getError();
    return result.getValue();
  });

  ipcMain.handle('ventas:paginated', async (event, params) => {
    const result = await ventasUseCases.getVentasPaginated(params);
    if (!result.isSuccess) throw result.getError();
    return result.getValue();
  });

  ipcMain.handle('ventas:get_by_id', async (event, id) => {
    const result = await ventasUseCases.getVentaById(id);
    if (!result.isSuccess) throw result.getError();
    return result.getValue();
  });

  ipcMain.handle('ventas:calendario', async (event, { year, month }) => {
    const result = await ventasUseCases.getCalendarioMes(year, month);
    if (!result.isSuccess) throw result.getError();
    return result.getValue();
  });

  ipcMain.handle('mermas:create', async (event, data) => {
    const db = require('../../database/connection/Database').getDb();
    // Simple direct insert for mermas for now
    await db.run('INSERT INTO mermas (producto_id, cantidad, motivo, notas) VALUES (?, ?, ?, ?)', [data.producto_id, data.cantidad, data.motivo, data.notas]);
    await db.run('UPDATE productos SET stock_actual = MAX(0, stock_actual - ?) WHERE id = ?', [data.cantidad, data.producto_id]);
  });

  ipcMain.handle('reportes:kpisHoy', async () => {
    // We'll call directly to repo for now or add a use case
    return await require('../../di/setup').ventasRepo.getKpisHoy();
  });

  ipcMain.handle('cuentas:list', async () => {
    return await require('../../di/setup').ventasRepo.getCredits();
  });

  ipcMain.handle('cuentas:abonar', async (event, { venta_id, pagosArr }) => {
    const repo = require('../../di/setup').ventasRepo;
    const uow = require('../../di/setup').uow;
    try {
      await uow.start();
      for (const p of pagosArr) {
        await repo.addAbono({ venta_id, metodo: p.metodo, monto: p.monto });
      }
      await uow.commit();
    } catch (e) {
      await uow.rollback();
      throw e;
    }
  });
}

module.exports = { registerVentasHandlers };
