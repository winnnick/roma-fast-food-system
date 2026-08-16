import type {
  CashMovementSnapshot,
  CashSessionSnapshot,
  CashSummarySnapshot,
  PreparationStartMode,
  SalePaymentSnapshot,
  SaleSnapshot,
} from '../../domain/operations/operations.models';

export interface SaleView {
  id: number;
  numeroPedido: string;
  canalVenta: SaleSnapshot['salesChannel'];
  referenciaPedidosYa: string | null;
  liquidacionPedidosYaId: number | null;
  fechaHoraLiquidacionPedidosYa: string | null;
  tipoCliente: SaleSnapshot['clientType'];
  clienteId: number | null;
  clienteNombre: string;
  usuarioRegistroId: number;
  usuarioRegistroNombre: string;
  sesionCajaIdRegistro: number;
  detalles: Array<{
    productoId: number;
    codigoProducto: string;
    nombreProducto: string;
    precioUnitario: number;
    cantidad: number;
    observacion: string | null;
    subtotal: number;
    requierePreparacion: boolean;
  }>;
  observaciones: string | null;
  requierePreparacion: boolean;
  subtotal: number;
  tipoDescuento: SaleSnapshot['discountType'];
  valorDescuento: number;
  montoDescuento: number;
  total: number;
  estadoPreparacion: SaleSnapshot['preparationStatus'];
  estadoCobro: SaleSnapshot['paymentStatus'];
  pagoId: number | null;
  metodoPago: SaleSnapshot['accumulatedPaymentMethod'];
  motivoAnulacion: string | null;
  estadoInventario: SaleSnapshot['inventoryStatus'];
  consumoInventarioId: number | null;
  ultimoErrorInventario: string | null;
  fechaHoraInventario: string | null;
  fechaHoraRegistro: string;
  fechaHoraInicioPreparacion: string | null;
  fechaHoraListo: string | null;
  fechaHoraEntregado: string | null;
  usuarioEntregaId: number | null;
  usuarioEntregaNombre: string | null;
  sesionCajaIdEntrega: number | null;
  fechaHoraCobro: string | null;
  fechaHoraAnulacion: string | null;
  fechaHoraActualizacion: string;
}

export interface CashSessionView {
  id: number;
  estado: CashSessionSnapshot['status'];
  usuarioAperturaId: number;
  usuarioAperturaNombre: string;
  montoInicial: number;
  observacionApertura: string | null;
  fechaHoraApertura: string;
  usuarioCierreId: number | null;
  usuarioCierreNombre: string | null;
  montoContado: number | null;
  efectivoEsperado: number | null;
  diferencia: number | null;
  observacionCierre: string | null;
  fechaHoraCierre: string | null;
}

export interface CashMovementView {
  id: number;
  sesionCajaId: number;
  tipo: CashMovementSnapshot['type'];
  concepto: string;
  monto: number;
  montoEfectivo: number;
  montoQr: number;
  metodoPago: CashMovementSnapshot['paymentMethod'];
  ventaId: number | null;
  numeroPedido: string | null;
  usuarioId: number;
  usuarioNombre: string;
  fechaHoraRegistro: string;
}

export interface SalePaymentView {
  id: number;
  sesionCajaId: number;
  ventaId: number;
  numeroPedido: string;
  subtotal: number;
  tipoDescuento: SalePaymentSnapshot['discountType'];
  valorDescuento: number;
  montoDescuento: number;
  motivoDescuento: string | null;
  totalCobrado: number;
  metodoPago: SalePaymentSnapshot['paymentMethod'];
  montoEfectivo: number;
  montoQr: number;
  montoRecibido: number;
  cambio: number;
  referenciaQr: string | null;
  usuarioId: number;
  usuarioNombre: string;
  fechaHoraCobro: string;
}

export interface CashSummaryView {
  sesionCajaId: number;
  montoInicial: number;
  cantidadVentas: number;
  totalVentas: number;
  totalVentasEfectivo: number;
  totalVentasQr: number;
  totalIngresosManuales: number;
  totalEgresosManuales: number;
  efectivoEsperado: number;
}

export interface PreparationConfigurationView {
  modoInicioPreparacion: PreparationStartMode;
}

const iso = (value: Date | null): string | null => (value ? value.toISOString() : null);

export function toSaleView(sale: SaleSnapshot): SaleView {
  return {
    id: sale.id,
    numeroPedido: sale.orderNumber,
    canalVenta: sale.salesChannel,
    referenciaPedidosYa: sale.pedidosYaReference,
    liquidacionPedidosYaId: sale.pedidosYaSettlementId,
    fechaHoraLiquidacionPedidosYa: iso(sale.pedidosYaSettledAt),
    tipoCliente: sale.clientType,
    clienteId: sale.clientId,
    clienteNombre: sale.clientName,
    usuarioRegistroId: sale.registeredByUserId,
    usuarioRegistroNombre: sale.registeredByUserName,
    sesionCajaIdRegistro: sale.registrationCashSessionId,
    detalles: sale.details.map((detail) => ({
      productoId: detail.productId,
      codigoProducto: detail.productCode,
      nombreProducto: detail.productName,
      precioUnitario: detail.unitPrice,
      cantidad: detail.quantity,
      observacion: detail.note,
      subtotal: detail.subtotal,
      requierePreparacion: detail.requiresPreparation,
    })),
    observaciones: sale.observations,
    requierePreparacion: sale.requiresPreparation,
    subtotal: sale.subtotal,
    tipoDescuento: sale.discountType,
    valorDescuento: sale.discountValue,
    montoDescuento: sale.discountAmount,
    total: sale.total,
    estadoPreparacion: sale.preparationStatus,
    estadoCobro: sale.paymentStatus,
    pagoId: sale.lastPaymentId,
    metodoPago: sale.accumulatedPaymentMethod,
    motivoAnulacion: sale.cancellationReason,
    estadoInventario: sale.inventoryStatus,
    consumoInventarioId: sale.inventoryConsumptionId,
    ultimoErrorInventario: sale.inventoryLastError,
    fechaHoraInventario: iso(sale.inventoryUpdatedAt),
    fechaHoraRegistro: sale.registeredAt.toISOString(),
    fechaHoraInicioPreparacion: iso(sale.preparationStartedAt),
    fechaHoraListo: iso(sale.readyAt),
    fechaHoraEntregado: iso(sale.deliveredAt),
    usuarioEntregaId: sale.deliveredByUserId,
    usuarioEntregaNombre: sale.deliveredByUserName,
    sesionCajaIdEntrega: sale.deliveryCashSessionId,
    fechaHoraCobro: iso(sale.fullyPaidAt),
    fechaHoraAnulacion: iso(sale.cancelledAt),
    fechaHoraActualizacion: sale.updatedAt.toISOString(),
  };
}

export function toCashSessionView(session: CashSessionSnapshot): CashSessionView {
  return {
    id: session.id,
    estado: session.status,
    usuarioAperturaId: session.openingUserId,
    usuarioAperturaNombre: session.openingUserName,
    montoInicial: session.initialAmount,
    observacionApertura: session.openingNote,
    fechaHoraApertura: session.openedAt.toISOString(),
    usuarioCierreId: session.closingUserId,
    usuarioCierreNombre: session.closingUserName,
    montoContado: session.countedAmount,
    efectivoEsperado: session.expectedCash,
    diferencia: session.difference,
    observacionCierre: session.closingNote,
    fechaHoraCierre: iso(session.closedAt),
  };
}

export function toCashMovementView(movement: CashMovementSnapshot): CashMovementView {
  return {
    id: movement.id,
    sesionCajaId: movement.cashSessionId,
    tipo: movement.type,
    concepto: movement.concept,
    monto: movement.amount,
    montoEfectivo: movement.cashAmount,
    montoQr: movement.qrAmount,
    metodoPago: movement.paymentMethod,
    ventaId: movement.saleId,
    numeroPedido: movement.orderNumber,
    usuarioId: movement.userId,
    usuarioNombre: movement.userName,
    fechaHoraRegistro: movement.registeredAt.toISOString(),
  };
}

export function toPaymentView(payment: SalePaymentSnapshot): SalePaymentView {
  return {
    id: payment.id,
    sesionCajaId: payment.cashSessionId,
    ventaId: payment.saleId,
    numeroPedido: payment.orderNumber,
    subtotal: payment.subtotal,
    tipoDescuento: payment.discountType,
    valorDescuento: payment.discountValue,
    montoDescuento: payment.discountAmount,
    motivoDescuento: payment.discountReason,
    totalCobrado: payment.appliedAmount,
    metodoPago: payment.paymentMethod,
    montoEfectivo: payment.cashAmount,
    montoQr: payment.qrAmount,
    montoRecibido: payment.receivedAmount,
    cambio: payment.changeAmount,
    referenciaQr: payment.qrReference,
    usuarioId: payment.userId,
    usuarioNombre: payment.userName,
    fechaHoraCobro: payment.paidAt.toISOString(),
  };
}

export function toCashSummaryView(summary: CashSummarySnapshot): CashSummaryView {
  return {
    sesionCajaId: summary.cashSessionId,
    montoInicial: summary.initialAmount,
    cantidadVentas: summary.salesCount,
    totalVentas: summary.totalSales,
    totalVentasEfectivo: summary.totalCashSales,
    totalVentasQr: summary.totalQrSales,
    totalIngresosManuales: summary.manualIncomeTotal,
    totalEgresosManuales: summary.manualExpenseTotal,
    efectivoEsperado: summary.expectedCash,
  };
}
