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

export interface Venta {
  id: number;
  numeroPedido: string;

  clienteId: number | null;
  clienteNombre: string;

  detalles: DetalleVenta[];
  observaciones: string | null;
  total: number;

  estadoPreparacion:
    EstadoPreparacion;

  estadoCobro:
    EstadoCobro;

  motivoAnulacion: string | null;

  fechaHoraRegistro: string;
  fechaHoraInicioPreparacion: string;
  fechaHoraListo: string | null;
  fechaHoraEntregado: string | null;
  fechaHoraAnulacion: string | null;
  fechaHoraActualizacion: string;
}