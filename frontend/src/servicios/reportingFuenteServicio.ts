import type { SesionUsuario } from "../tipos/auth";
import type { RegistroAuditoria } from "../tipos/auditoria";
import type { MovimientoCaja, PagoVenta, SesionCaja } from "../tipos/caja";
import type {
  ConsumoVentaInventario,
  ConteoFisicoInventario,
  InsumoInventario,
  MovimientoInventario,
  RecetaProducto,
  ResumenInventario,
} from "../tipos/inventario";
import type { CategoriaProducto, ProductoMenu } from "../tipos/producto";
import type { Usuario } from "../tipos/usuario";
import type { Venta } from "../tipos/venta";

import { apiReporting, esEstadoErrorApi } from "./apiCliente";

interface SnapshotAuthReporting {
  generatedAt: string;
  users: Usuario[];
  roles: unknown[];
}

interface SnapshotOperationsReporting {
  generatedAt: string;
  categories: CategoriaProducto[];
  products: ProductoMenu[];
  clients: unknown[];
  sales: Venta[];
  payments: PagoVenta[];
  cashSessions: SesionCaja[];
  cashMovements: MovimientoCaja[];
}

interface SnapshotInventoryReporting {
  generatedAt: string;
  ingredients: InsumoInventario[];
  recipes: RecetaProducto[];
  movements: MovimientoInventario[];
  consumptions: ConsumoVentaInventario[];
  counts: ConteoFisicoInventario[];
  summary: ResumenInventario;
}

interface RespuestaDatosReporting {
  generatedAt: string;
  capturedAt: {
    auth: string;
    operations: string;
    inventory: string;
  };
  auth: SnapshotAuthReporting;
  operations: SnapshotOperationsReporting;
  inventory: SnapshotInventoryReporting;
}

export interface FuenteReporting {
  generadoEn: string;
  capturadoEn: RespuestaDatosReporting["capturedAt"];

  ventas: Venta[];
  pagos: PagoVenta[];
  sesionesCaja: SesionCaja[];
  movimientosCaja: MovimientoCaja[];

  insumos: InsumoInventario[];
  movimientosInventario: MovimientoInventario[];
  consumos: ConsumoVentaInventario[];
  conteos: ConteoFisicoInventario[];
  recetas: RecetaProducto[];
  resumenInventario: ResumenInventario;

  productos: ProductoMenu[];
  usuarios: Usuario[];
  auditoria: RegistroAuditoria[];
}

const RECONSTRUIR_AL_CARGAR =
  ((import.meta.env.VITE_REPORTING_REBUILD_ON_LOAD as string | undefined) ??
    "true") === "true";

let fuenteCache: FuenteReporting | null = null;
let cacheHasta = 0;
let cargaEnCurso: Promise<FuenteReporting> | null = null;

function leerPermisosSesion(): string[] {
  const valor = localStorage.getItem("roma-sesion");

  if (!valor) return [];

  try {
    const sesion = JSON.parse(valor) as SesionUsuario;
    return Array.isArray(sesion.usuario?.permisos)
      ? sesion.usuario.permisos
      : [];
  } catch {
    return [];
  }
}

export function usuarioPuedeConsultarReporting(): boolean {
  return leerPermisosSesion().includes("REPORTES_VER");
}

async function cargarAuditoriaSiPermitida(): Promise<RegistroAuditoria[]> {
  if (!leerPermisosSesion().includes("REPORTES_BITACORA")) {
    return [];
  }

  try {
    const respuesta = await apiReporting.get<RegistroAuditoria[]>(
      "/reportes/auditoria",
    );
    return respuesta.data;
  } catch (error) {
    if (esEstadoErrorApi(error, 403)) return [];
    throw error;
  }
}

async function cargarFuente(): Promise<FuenteReporting> {
  if (RECONSTRUIR_AL_CARGAR) {
    await apiReporting.post("/reportes/reconstruir");
  }

  const [respuesta, auditoria] = await Promise.all([
    apiReporting.get<RespuestaDatosReporting>("/reportes/datos"),
    cargarAuditoriaSiPermitida(),
  ]);

  const datos = respuesta.data;

  return {
    generadoEn: datos.generatedAt,
    capturadoEn: datos.capturedAt,

    ventas: [...datos.operations.sales],
    pagos: [...datos.operations.payments],
    sesionesCaja: [...datos.operations.cashSessions],
    movimientosCaja: [...datos.operations.cashMovements],

    insumos: [...datos.inventory.ingredients],
    movimientosInventario: [...datos.inventory.movements],
    consumos: [...datos.inventory.consumptions],
    conteos: [...datos.inventory.counts],
    recetas: [...datos.inventory.recipes],
    resumenInventario: datos.inventory.summary,

    productos: [...datos.operations.products],
    usuarios: [...datos.auth.users],
    auditoria,
  };
}

export async function obtenerFuenteReporting(
  forzar = false,
): Promise<FuenteReporting> {
  const ahora = Date.now();

  if (!forzar && fuenteCache && ahora < cacheHasta) {
    return fuenteCache;
  }

  if (!cargaEnCurso) {
    cargaEnCurso = cargarFuente()
      .then((fuente) => {
        fuenteCache = fuente;
        cacheHasta = Date.now() + 2500;
        return fuente;
      })
      .finally(() => {
        cargaEnCurso = null;
      });
  }

  return cargaEnCurso;
}

export async function obtenerFuenteReportingSiDisponible(): Promise<FuenteReporting | null> {
  if (!usuarioPuedeConsultarReporting()) {
    return null;
  }

  try {
    return await obtenerFuenteReporting();
  } catch (error) {
    if (esEstadoErrorApi(error, 403)) return null;
    throw error;
  }
}

export function invalidarCacheReporting(): void {
  fuenteCache = null;
  cacheHasta = 0;
}
