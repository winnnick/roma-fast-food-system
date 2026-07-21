export type EstadoCaja =
  | "Abierta"
  | "Cerrada";

export type MetodoPago =
  | "Efectivo"
  | "QR"
  | "Mixto";

export type TipoDescuento =
  | "Ninguno"
  | "Porcentaje"
  | "Monto fijo";

export type TipoMovimientoCaja =
  | "Venta"
  | "Ingreso"
  | "Egreso";

export interface AbrirCajaDto {
  montoInicial: number;
  observacion: string | null;
}

export interface RegistrarMovimientoManualDto {
  tipo: "Ingreso" | "Egreso";
  concepto: string;
  monto: number;
}

export interface CerrarCajaDto {
  montoContado: number;
  observacion: string | null;
}

export interface RegistrarPagoVentaDto {
  ventaId: number;

  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  motivoDescuento: string | null;

  metodoPago: MetodoPago;

  /**
   * Monto del total que se pagará
   * efectivamente en dinero físico.
   *
   * En pago efectivo será igual al total.
   * En QR será cero.
   * En pago mixto será la parte en efectivo.
   */
  montoEfectivo: number;

  /**
   * Cantidad física entregada por el cliente.
   * Permite calcular el cambio.
   */
  montoRecibido: number;

  referenciaQr: string | null;
}

export interface SesionCaja {
  id: number;
  estado: EstadoCaja;

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

export interface MovimientoCaja {
  id: number;
  sesionCajaId: number;

  tipo: TipoMovimientoCaja;
  concepto: string;

  monto: number;
  montoEfectivo: number;
  montoQr: number;

  metodoPago: MetodoPago | null;

  ventaId: number | null;
  numeroPedido: string | null;

  usuarioId: number;
  usuarioNombre: string;

  fechaHoraRegistro: string;
}

export interface PagoVenta {
  id: number;
  sesionCajaId: number;

  ventaId: number;
  numeroPedido: string;

  subtotal: number;

  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  montoDescuento: number;
  motivoDescuento: string | null;

  totalCobrado: number;

  metodoPago: MetodoPago;

  montoEfectivo: number;
  montoQr: number;

  montoRecibido: number;
  cambio: number;

  referenciaQr: string | null;

  usuarioId: number;
  usuarioNombre: string;

  fechaHoraCobro: string;
}

export interface ResumenCaja {
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