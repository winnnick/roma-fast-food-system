import type { RolUsuario } from "./auth";

export type EstadoUsuario =
  | "Activo"
  | "Inactivo";

export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  fechaRegistro: string;
  ultimoAcceso: string | null;
}

export interface CrearUsuarioDto {
  username: string;
  nombreCompleto: string;
  rol: RolUsuario;
  password: string;
}

export interface ActualizarUsuarioDto {
  username: string;
  nombreCompleto: string;
  rol: RolUsuario;
  password?: string;
}