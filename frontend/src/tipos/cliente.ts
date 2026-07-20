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
  direccion: string | null;
  observaciones: string | null;
  estado: EstadoCliente;
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
  observaciones: string | null;
}