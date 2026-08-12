import type {
  MetodoPago,
} from "./caja";

import type {
  CanalVenta,
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
  | "Bitácora"
  | "PedidosYa";

export interface ColumnaExportacion<T> {
  encabezado: string;
  obtenerValor: (registro: T) => unknown;
  peso?: number;
  alineacion?: "izquierda" | "centro" | "derecha";
}export interface FilaReporteVenta {
  ventaId: number;
  numeroPedido: string;

  fechaHoraRegistro: string;
  fechaHoraCobro: string | null;

  cliente: string;
  productos: string;
  canalVenta: CanalVenta;
  referenciaPedidosYa: string | null;

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

  eventosAuditoria: number;
  totalAcciones: number;
}
