import type {
  RolUsuario,
} from "./auth";

export type ModuloAuditoria =
  | "Autenticación"
  | "Usuarios"
  | "Roles y permisos"
  | "Productos"
  | "Clientes"
  | "Ventas"
  | "Preparación"
  | "Caja"
  | "Inventario"
  | "Recetas"
  | "Conteos físicos"
  | "Reportes"
  | "Configuración"
  | "Sistema";

export type NivelAuditoria =
  | "Información"
  | "Advertencia"
  | "Crítico";

export type OrigenAuditoria =
  | "Interfaz web"
  | "Proceso automático"
  | "Migración"
  | "Sistema";

export interface RegistroAuditoria {
  id: number;
  fechaHora: string;

  usuarioId: number | null;
  usuarioNombre: string;
  usuarioRol: RolUsuario | null;

  modulo: ModuloAuditoria;
  accion: string;

  entidad: string;
  entidadId: string | number | null;

  descripcion: string;

  datosAnteriores: unknown | null;
  datosPosteriores: unknown | null;

  nivel: NivelAuditoria;
  origen: OrigenAuditoria;
}

export interface RegistrarAuditoriaDto {
  modulo: ModuloAuditoria;
  accion: string;

  entidad: string;
  entidadId?: string | number | null;

  descripcion: string;

  datosAnteriores?: unknown | null;
  datosPosteriores?: unknown | null;

  nivel?: NivelAuditoria;
  origen?: OrigenAuditoria;
}

export interface FiltroAuditoria {
  fechaDesde?: string;
  fechaHasta?: string;

  usuarioId?: number;
  modulo?: ModuloAuditoria;
  nivel?: NivelAuditoria;

  texto?: string;
}

export interface ResumenAuditoria {
  totalEventos: number;
  eventosInformativos: number;
  eventosAdvertencia: number;
  eventosCriticos: number;

  usuariosActivos: number;
  modulosConActividad: number;

  ultimoEvento: RegistroAuditoria | null;
}
