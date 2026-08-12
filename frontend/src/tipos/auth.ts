export const rolesUsuario = [
  "Administrador",
  "Cajero",
  "Inventario",
  "Auxiliar",
] as const;

export type RolUsuario =
  (typeof rolesUsuario)[number];

export interface CredencialesLogin {
  username: string;
  password: string;
}

export interface UsuarioSesion {
  id: number;
  username: string;
  nombreCompleto: string;

  /**
   * Rol principal conservado por compatibilidad con
   * auditoría y componentes anteriores.
   */
  rol: RolUsuario;

  /**
   * Roles efectivos del usuario. Para empleados puede
   * contener Cajero, Inventario y/o Auxiliar. Administrador se maneja
   * como rol exclusivo porque ya concede acceso completo.
   */
  roles: RolUsuario[];

  permisos: string[];
}

export interface SesionUsuario {
  usuario: UsuarioSesion;
  accessToken: string;
  fechaInicio: string;
}
