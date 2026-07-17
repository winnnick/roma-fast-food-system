export type RolUsuario =
  | "Administrador"
  | "Cajero"
  | "Inventario";

export interface CredencialesLogin {
  username: string;
  password: string;
}

export interface UsuarioSesion {
  id: number;
  username: string;
  nombreCompleto: string;
  rol: RolUsuario;
  permisos: string[];
}

export interface SesionUsuario {
  usuario: UsuarioSesion;
  accessToken: string;
  fechaInicio: string;
}