import type { RolUsuario } from "./auth";

/**
 * Catálogo definitivo de autorizaciones del sistema.
 *
 * Cada permiso representa una capacidad concreta y auditable.
 * Los permisos generales usados durante la migración gradual fueron
 * retirados en el Bloque 9; desde esta versión los módulos trabajan
 * únicamente con autorizaciones granulares.
 */
export const permisosSistema = [
  "DASHBOARD_VER",
  "DASHBOARD_INDICADORES_VER",
  "DASHBOARD_GRAFICOS_VER",
  "DASHBOARD_ALERTAS_VER",
  "DASHBOARD_ACTIVIDAD_VER",
  "DASHBOARD_ALERTAS_GESTIONAR",

  "USUARIOS_VER",
  "USUARIOS_CREAR",
  "USUARIOS_EDITAR",
  "USUARIOS_DESACTIVAR",
  "ROLES_GESTIONAR",

  "PRODUCTOS_VER",
  "PRODUCTOS_CREAR",
  "PRODUCTOS_EDITAR",
  "PRODUCTOS_DESACTIVAR",
  "CATEGORIAS_GESTIONAR",

  "CLIENTES_VER",
  "CLIENTES_CREAR",
  "CLIENTES_EDITAR",
  "CLIENTES_ARCHIVAR",
  "CLIENTES_COMPARTIR",

  "VENTAS_VER",
  "VENTAS_CREAR",
  "VENTAS_PREPARAR",
  "VENTAS_CONFIGURAR_FLUJO",
  "VENTAS_COBRAR",
  "VENTAS_ANULAR",
  "VENTAS_HISTORIAL",
  "VENTAS_COMPARTIR_ENTREGA",

  "CAJA_VER",
  "CAJA_ABRIR",
  "CAJA_INGRESOS",
  "CAJA_EGRESOS",
  "CAJA_CERRAR",
  "CAJA_HISTORIAL",

  "INVENTARIO_VER",
  "INVENTARIO_INSUMOS_CREAR",
  "INVENTARIO_INSUMOS_EDITAR",
  "INVENTARIO_ESTADO_INSUMO",
  "INVENTARIO_ENTRADAS",
  "INVENTARIO_AJUSTES_AUMENTAR",
  "INVENTARIO_AJUSTES_DISMINUIR",
  "INVENTARIO_RECETAS_VER",
  "INVENTARIO_RECETAS_GESTIONAR",
  "INVENTARIO_MOVIMIENTOS_VER",
  "INVENTARIO_CONTEOS_VER",
  "INVENTARIO_CONTEOS_REGISTRAR",

  "REPORTES_VER",
  "REPORTES_RESUMEN",
  "REPORTES_VENTAS",
  "REPORTES_ARQUEOS",
  "REPORTES_INVENTARIO",
  "REPORTES_USUARIOS",
  "REPORTES_BITACORA",
  "REPORTES_PEDIDOSYA",
  "REPORTES_PEDIDOSYA_LIQUIDAR",
  "REPORTES_EXPORTAR",
  "REPORTES_IMPRIMIR",
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
