import type { RolUsuario } from "./auth";

export type EstadoUsuario =
  | "Activo"
  | "Inactivo";

export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;

  /** Rol principal conservado por compatibilidad. */
  rol: RolUsuario;

  /** Roles efectivos asignados a la cuenta. */
  roles: RolUsuario[];

  estado: EstadoUsuario;
  fechaRegistro: string;
  ultimoAcceso: string | null;
}

export interface CrearUsuarioDto {
  username: string;
  nombreCompleto: string;

  /**
   * Rol principal. Se conserva para que la interfaz actual
   * continúe funcionando durante la transición multirrol.
   */
  rol: RolUsuario;

  /**
   * Cuando se envía, reemplaza a `rol` como fuente de los
   * roles efectivos. La interfaz del siguiente bloque lo usará.
   */
  roles?: RolUsuario[];

  password: string;
}

export interface ActualizarUsuarioDto {
  username: string;
  nombreCompleto: string;
  rol: RolUsuario;
  roles?: RolUsuario[];
  password?: string;
}
