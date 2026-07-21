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

export interface DetalleVentaDto {
  productoId: number;
  cantidad: number;
  observacion: string | null;
}

export interface CrearVentaDto {
  clienteId: number | null;
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

  clienteId: number | null;
  clienteNombre: string;

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