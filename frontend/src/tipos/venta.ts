import type {
  MetodoPago,
  TipoDescuento,
} from "./caja";

export type EstadoPreparacion =
  | "En cola"
  | "En preparación"
  | "Entrega directa"
  | "Listo"
  | "Entregado"
  | "Anulado";

export type ModoInicioPreparacion =
  | "En cola"
  | "En preparación";

export type EstadoCobro =
  | "Pendiente de cobro"
  | "Cobrada"
  | "Pendiente de liquidación"
  | "Liquidada"
  | "Anulada";

export type CanalVenta =
  | "Local"
  | "PedidosYa";

/**
 * Permite distinguir cómo se identificó
 * al cliente dentro de la venta.
 *
 * - Consumidor final: no se registra nombre.
 * - Registrado: referencia a un cliente existente.
 * - Ocasional: nombre escrito solamente para el pedido.
 */
export type TipoClienteVenta =
  | "Consumidor final"
  | "Registrado"
  | "Ocasional";

export interface DetalleVentaDto {
  productoId: number;
  cantidad: number;
  observacion: string | null;
}

export interface CrearVentaDto {
  canalVenta?: CanalVenta;
  referenciaPedidosYa?: string | null;

  /**
   * Se mantiene opcional durante la migración
   * para que la interfaz actual siga compilando.
   */
  tipoCliente?: TipoClienteVenta;

  clienteId: number | null;

  /**
   * Nombre escrito por el cajero cuando se trata
   * de un cliente ocasional. No crea un registro
   * en el módulo Clientes.
   */
  clienteNombre?: string | null;

  detalles: DetalleVentaDto[];
  observaciones: string | null;
}

export interface DetalleVenta {
  productoId: number;
  codigoProducto: string;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  observacion: string | null;
  subtotal: number;
  requierePreparacion: boolean;
}

export interface RegistrarCobroVentaDto {
  pagoId: number;

  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  montoDescuento: number;

  /** Total definitivo de la venta luego del descuento. */
  totalVenta: number;

  /**
   * Indica si, considerando todos los abonos registrados,
   * la venta quedó completamente pagada.
   */
  pagoCompleto: boolean;

  metodoPago: MetodoPago;

  fechaHoraCobro: string;
}

export interface Venta {
  id: number;
  numeroPedido: string;

  canalVenta: CanalVenta;
  referenciaPedidosYa: string | null;
  liquidacionPedidosYaId: number | null;
  fechaHoraLiquidacionPedidosYa: string | null;

  tipoCliente: TipoClienteVenta;
  clienteId: number | null;
  clienteNombre: string;

  /**
   * Usuario que registró originalmente el pedido.
   * El cobro puede ser realizado después por otra
   * persona y quedará asociado a su propia caja.
   */
  usuarioRegistroId: number | null;
  usuarioRegistroNombre: string;
  sesionCajaIdRegistro: number | null;

  detalles: DetalleVenta[];
  observaciones: string | null;

  requierePreparacion: boolean;
  subtotal: number;

  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  montoDescuento: number;

  total: number;

  estadoPreparacion:
    EstadoPreparacion;

  estadoCobro:
    EstadoCobro;

  pagoId: number | null;
  metodoPago: MetodoPago | null;

  motivoAnulacion: string | null;

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

export interface LiquidacionPedidosYa {
  id: number;
  numeroLiquidacion: string;
  fechaDesde: string;
  fechaHasta: string;

  ventaIds: number[];
  cantidadPedidos: number;
  montoBruto: number;
  montoRecibido: number;
  diferencia: number;

  usuarioId: number;
  usuarioNombre: string;
  observacion: string | null;
  fechaHoraRegistro: string;
}

export interface RegistrarLiquidacionPedidosYaDto {
  fechaDesde: string;
  fechaHasta: string;
  montoRecibido: number;
  observacion: string | null;
}

export interface ResumenPedidosYaPeriodo {
  fechaDesde: string;
  fechaHasta: string;
  pedidosEnCurso: Venta[];
  cantidadEnCurso: number;
  montoEnCurso: number;
  pedidosPendientes: Venta[];
  cantidadPendiente: number;
  montoPendiente: number;
  pedidosLiquidados: Venta[];
  cantidadLiquidada: number;
  montoLiquidado: number;
  liquidaciones: LiquidacionPedidosYa[];
}

