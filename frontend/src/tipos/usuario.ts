import type { RolUsuario } from "./auth";
import type { PermisoSistema } from "./rol";

export type EstadoUsuario =
  | "Activo"
  | "Inactivo";

export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;

  /** Rol principal de la cuenta. */
  rol: RolUsuario;

  /**
   * Roles efectivos asignados a la cuenta. Incluye el rol principal
   * y, cuando corresponde, roles adicionales otorgados desde
   * Roles y permisos.
   */
  roles: RolUsuario[];

  /**
   * Capacidades concedidas únicamente a esta cuenta. No incluye
   * permisos heredados de sus roles.
   */
  permisosAdicionales: PermisoSistema[];

  estado: EstadoUsuario;
  fechaRegistro: string;
  ultimoAcceso: string | null;
}

export interface CrearUsuarioDto {
  username: string;
  nombreCompleto: string;
  rol: RolUsuario;

  /**
   * Campo conservado por compatibilidad. Los roles adicionales se
   * administran desde Roles y permisos.
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

export interface ActualizarAccesosUsuarioDto {
  roles: RolUsuario[];
  permisosAdicionales: PermisoSistema[];
}
