import type {
  MetodoPago,
  TipoDescuento,
} from "./caja";

export type EstadoPreparacion =
  | "En preparación"
  | "Listo"
  | "Entregado"
  | "Anulado";

export type EstadoCobro =
  | "Pendiente de cobro"
  | "Cobrada"
  | "Anulada";

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
}

export interface RegistrarCobroVentaDto {
  pagoId: number;

  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  montoDescuento: number;

  totalCobrado: number;
  metodoPago: MetodoPago;

  fechaHoraCobro: string;
}

export interface Venta {
  id: number;
  numeroPedido: string;

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
  fechaHoraInicioPreparacion: string;
  fechaHoraListo: string | null;
  fechaHoraEntregado: string | null;
  fechaHoraCobro: string | null;
  fechaHoraAnulacion: string | null;
  fechaHoraActualizacion: string;
}
