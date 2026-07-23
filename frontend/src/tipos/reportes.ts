import type {
  MetodoPago,
} from "./caja";

import type {
  EstadoCobro,
  EstadoPreparacion,
} from "./venta";

import type {
  TipoMovimientoInventario,
} from "./inventario";

export type TipoReporteAdministrativo =
  | "Resumen"
  | "Ventas"
  | "Arqueos"
  | "Caja"
  | "Inventario"
  | "Actividad por usuario"
  | "Bitácora";

export interface FiltroReporteAdministrativo {
  fechaDesde: string;
  fechaHasta: string;

  usuarioId?: number;
  metodoPago?: MetodoPago;

  estadoCobro?: EstadoCobro;
  estadoPreparacion?: EstadoPreparacion;

  productoId?: number;
  categoriaId?: number;

  tipoMovimientoInventario?:
    TipoMovimientoInventario;

  texto?: string;
}

export interface ColumnaExportacion<T> {
  encabezado: string;
  obtenerValor: (registro: T) => unknown;
}

export interface DocumentoReporte<T> {
  titulo: string;
  descripcion: string;

  fechaGeneracion: string;
  filtro: FiltroReporteAdministrativo;

  registros: T[];
}

export interface FilaReporteVenta {
  ventaId: number;
  numeroPedido: string;

  fechaHoraRegistro: string;
  fechaHoraCobro: string | null;

  cliente: string;
  productos: string;

  subtotal: number;
  descuento: number;
  total: number;

  metodoPago: MetodoPago | null;
  estadoCobro: EstadoCobro;
  estadoPreparacion: EstadoPreparacion;
}

export interface FilaReporteInventario {
  movimientoId: number;
  fechaHora: string;

  insumo: string;
  tipoMovimiento: TipoMovimientoInventario;

  cantidad: number;
  unidad: string;

  stockAnterior: number;
  stockPosterior: number;

  usuario: string;
  referencia: string | null;
  motivo: string;

  impactoEconomico: number | null;
}

export interface FilaReporteUsuario {
  usuarioId: number | null;
  usuario: string;

  ventasRegistradas: number;
  montoVentasRegistradas: number;

  cobrosRealizados: number;
  montoCobrado: number;

  movimientosInventario: number;
  movimientosCaja: number;

  aperturasCaja: number;
  cierresCaja: number;

  totalAcciones: number;
}
