import type { RolUsuario } from "./auth";

export const permisosSistema = [
  "DASHBOARD_VER",

  "USUARIOS_VER",
  "USUARIOS_CREAR",
  "USUARIOS_EDITAR",
  "USUARIOS_DESACTIVAR",
  "ROLES_GESTIONAR",

  "PRODUCTOS_VER",
  "PRODUCTOS_GESTIONAR",

  "VENTAS_VER",
  "VENTAS_CREAR",

  "CAJA_VER",
  "CAJA_GESTIONAR",

  "INVENTARIO_VER",
  "INVENTARIO_GESTIONAR",

  "REPORTES_VER",
] as const;

export type PermisoSistema =
  (typeof permisosSistema)[number];

export interface RolConfiguracion {
  rol: RolUsuario;
  nombre: string;
  descripcion: string;
  editable: boolean;
  permisos: PermisoSistema[];
}