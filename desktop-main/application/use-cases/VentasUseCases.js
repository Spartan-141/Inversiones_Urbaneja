'use strict';
const { z } = require('zod');
const { ResultFactory } = require('../../domain/common/Result');

// ─── Zod Schemas ────────────────────────────────────────────────────────────
const DetalleVentaSchema = z.object({
  tipo: z.string().min(1),
  ref_id: z.number().int().positive(),
  nombre: z.string().min(1),
  cantidad: z.number().positive(),
  unidad_medida: z.string().default('unidad'),
  precio_unitario: z.number().min(0),
  subtotal: z.number().min(0),
  cantidad_hojas_gastadas: z.number().min(0).optional().default(0),
});

const PagoSchema = z.object({
  metodo: z.string().min(1),
  monto: z.number().min(0),
});

const CabeceraVentaSchema = z.object({
  subtotal: z.number().min(0),
  descuento_otorgado: z.number().min(0).optional().default(0),
  total: z.number().min(0),
  estado: z.string().default('pagada'),
  cliente_nombre: z.string().optional().default(''),
  saldo_pendiente: z.number().min(0).optional().default(0),
  notas: z.string().optional().default(''),
});

const CrearVentaSchema = z.object({
  cabecera: CabeceraVentaSchema,
  detalles: z.array(DetalleVentaSchema).min(1, 'Debe incluir al menos un producto'),
  pagos: z.array(PagoSchema),
});

// ─── Use Case Implementation ────────────────────────────────────────────────
class VentasUseCases {
  constructor(ventasRepo, productosRepo, insumosRepo, uow) {
    this.ventasRepo = ventasRepo;
    this.productosRepo = productosRepo;
    this.insumosRepo = insumosRepo;
    this.uow = uow;
  }

  async crearVenta(payload) {
    const parsed = CrearVentaSchema.safeParse(payload);
    if (!parsed.success) return ResultFactory.fail(parsed.error.message);

    const { cabecera, detalles, pagos } = parsed.data;

    try {
      await this.uow.start();

      // 1. Insertar cabecera de venta
      const ventaId = await this.ventasRepo.create(cabecera);

      // 2. Insertar detalles y descontar stock
      for (const item of detalles) {
        await this.ventasRepo.createDetalle({ ...item, venta_id: ventaId });

        if (item.tipo === 'producto') {
          const product = await this.productosRepo.getById(item.ref_id);
          if (product) {
            const newStock = Math.max(0, product.stock_actual - item.cantidad);
            await this.productosRepo.updateStock(item.ref_id, newStock);
          }
        }
        // Insumos logic can be added here if needed
      }

      // 3. Insertar pagos
      for (const pago of pagos) {
        await this.ventasRepo.createPago({ ...pago, venta_id: ventaId });
      }

      await this.uow.commit();
      return ResultFactory.ok({ id: ventaId });
    } catch (error) {
      await this.uow.rollback();
      return ResultFactory.fail(error.message);
    }
  }

  async getVentasPaginated(params) {
    try {
      const data = await this.ventasRepo.getPaginated(params);
      return ResultFactory.ok(data);
    } catch (error) {
      return ResultFactory.fail(error.message);
    }
  }

  async getCalendarioMes(year, month) {
    try {
      const data = await this.ventasRepo.getCalendario(year, month);
      return ResultFactory.ok(data);
    } catch (error) {
      return ResultFactory.fail(error.message);
    }
  }

  async getVentaById(id) {
    try {
      const data = await this.ventasRepo.getById(id);
      return ResultFactory.ok(data);
    } catch (error) {
      return ResultFactory.fail(error.message);
    }
  }
}

module.exports = { VentasUseCases };
