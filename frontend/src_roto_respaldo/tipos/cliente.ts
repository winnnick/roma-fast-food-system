import type {
  Venta,
} from "./venta";

export type EstadoCliente =
  | "Activo"
  | "Inactivo";

export type TipoDocumentoCliente =
  | "CI"
  | "NIT"
  | "Pasaporte"
  | "Otro";

export interface Cliente {
  id: number;
  nombreCompleto: string;
  tipoDocumento:
    TipoDocumentoCliente | null;
  numeroDocumento: string | null;
  telefono: string | null;
  correo: string | null;

  /**
   * Dirección escrita del punto de entrega.
   */
  direccion: string | null;

  /**
   * Barrio, zona o sector para ubicar rápidamente
   * la dirección durante un delivery.
   */
  zona: string | null;

  /**
   * Referencia visual o indicación corta del domicilio.
   */
  referenciaDireccion: string | null;

  /**
   * Enlace compartido de Google Maps u otro servicio.
   */
  ubicacionUrl: string | null;

  /**
   * Indicaciones operativas para la entrega.
   */
  indicacionesEntrega: string | null;

  observaciones: string | null;

  /**
   * Se conserva temporalmente para compatibilidad
   * con la interfaz anterior. En la nueva pantalla
   * se utilizará archivado en lugar de activo/inactivo.
   */
  estado: EstadoCliente;

  archivado: boolean;
  fechaArchivado: string | null;

  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface CrearClienteDto {
  nombreCompleto: string;
  tipoDocumento:
    TipoDocumentoCliente | null;
  numeroDocumento: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;

  /**
   * Campos opcionales durante la transición para que
   * el formulario anterior continúe compilando.
   */
  zona?: string | null;
  referenciaDireccion?: string | null;
  ubicacionUrl?: string | null;
  indicacionesEntrega?: string | null;

  observaciones: string | null;
}

export interface ActualizarClienteDto {
  nombreCompleto: string;
  tipoDocumento:
    TipoDocumentoCliente | null;
  numeroDocumento: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;

  zona?: string | null;
  referenciaDireccion?: string | null;
  ubicacionUrl?: string | null;
  indicacionesEntrega?: string | null;

  observaciones: string | null;
}

export interface ResumenUltimoPedidoCliente {
  ventaId: number;
  numeroPedido: string;
  total: number;
  fechaHoraRegistro: string;
  estadoPreparacion:
    Venta["estadoPreparacion"];
  estadoCobro: Venta["estadoCobro"];
}
