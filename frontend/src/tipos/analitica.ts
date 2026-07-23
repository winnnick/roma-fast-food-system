import type {
  MetodoPago,
} from "./caja";

import type {
  NivelStockInventario,
  TipoMovimientoInventario,
  UnidadBaseInventario,
} from "./inventario";

export type PeriodoRapidoAnalitica =
  | "Hoy"
  | "Últimos 7 días"
  | "Este mes"
  | "Mes anterior"
  | "Personalizado";

export interface FiltroPeriodoAnalitica {
  fechaDesde: string;
  fechaHasta: string;
}

export interface VariacionIndicador {
  valorActual: number;
  valorAnterior: number;
  porcentaje: number;
}

export interface IndicadoresComerciales {
  ventasNetas: number;
  ventasBrutas: number;
  ventasPendientes: number;

  pedidosRegistrados: number;
  pedidosCobrados: number;
  pedidosPendientes: number;
  pedidosAnulados: number;

  ticketPromedio: number;
  descuentosOtorgados: number;
  porcentajeAnulacion: number;

  clientesIdentificados: number;

  variacionVentas: VariacionIndicador;
  variacionPedidos: VariacionIndicador;
  variacionTicket: VariacionIndicador;
}

export interface ResumenMetodoPagoAnalitica {
  metodo: MetodoPago;
  cantidadPagos: number;

  totalCobrado: number;
  montoEfectivo: number;
  montoQr: number;

  porcentajeMonto: number;
}

export interface PuntoVentasDiarias {
  fecha: string;
  etiqueta: string;

  ventasCobradas: number;
  pedidosRegistrados: number;
  pedidosCobrados: number;
  pedidosAnulados: number;
}

export interface PuntoVentasHora {
  hora: number;
  etiqueta: string;

  ventasCobradas: number;
  pedidosRegistrados: number;
}

export interface ProductoVendidoAnalitica {
  productoId: number;
  codigoProducto: string;
  nombreProducto: string;

  cantidadVendida: number;
  cantidadPedidos: number;

  importeBruto: number;
  importeNetoEstimado: number;
}

export interface ActividadUsuarioAnalitica {
  usuarioId: number | null;
  usuarioNombre: string;

  ventasRegistradas: number;
  montoVentasRegistradas: number;

  cobrosRealizados: number;
  montoCobrado: number;

  movimientosInventario: number;
  movimientosCajaManuales: number;

  aperturasCaja: number;
  cierresCaja: number;

  eventosAuditoria: number;
  totalAcciones: number;
}

export type ModuloActividadOperativa =
  | "Ventas"
  | "Caja"
  | "Inventario"
  | "Recetas"
  | "Auditoría";

export type NivelActividadOperativa =
  | "Normal"
  | "Atención"
  | "Crítico";

export interface ActividadOperativa {
  id: string;
  fechaHora: string;

  modulo: ModuloActividadOperativa;
  accion: string;
  descripcion: string;

  usuarioId: number | null;
  usuarioNombre: string;

  referencia: string | null;
  monto: number | null;

  nivel: NivelActividadOperativa;
  fuente: "Operación" | "Auditoría";
}

export type TipoAlertaAdministrativa =
  | "Caja"
  | "Cobros"
  | "Inventario"
  | "Recetas"
  | "Arqueos"
  | "Descuentos";

export type PrioridadAlertaAdministrativa =
  | "Baja"
  | "Media"
  | "Alta"
  | "Crítica";

export interface AlertaAdministrativa {
  id: string;
  tipo: TipoAlertaAdministrativa;
  prioridad: PrioridadAlertaAdministrativa;

  titulo: string;
  descripcion: string;

  cantidad: number | null;
  monto: number | null;

  ruta: string;
}

export interface InsumoAlertaAnalitica {
  id: number;
  codigo: string;
  nombre: string;

  stockActual: number;
  stockMinimo: number | null;
  unidadBase: UnidadBaseInventario;

  nivel: NivelStockInventario;
}

export interface ResumenInventarioAnalitica {
  insumosActivos: number;
  insumosStockBajo: number;
  insumosStockNegativo: number;

  productosActivosSinReceta: number;

  entradasRegistradas: number;
  ajustesRegistrados: number;
  conteosRegistrados: number;
  mermasRegistradas: number;

  costoConsumoValorado: number;
  costoMermasValoradas: number;

  coberturaValoracionPorcentaje: number;

  valorInventarioPositivo: number;
  valorDeficitInventario: number;

  alertasStock: InsumoAlertaAnalitica[];

  movimientosPorTipo: Array<{
    tipo: TipoMovimientoInventario;
    cantidad: number;
  }>;
}

export interface EstadoCajaAnalitica {
  cajaAbierta: boolean;
  sesionCajaId: number | null;

  usuarioAperturaNombre: string | null;
  fechaHoraApertura: string | null;

  montoInicial: number;
  efectivoEsperado: number;

  ingresosManualesPeriodo: number;
  egresosManualesPeriodo: number;

  sesionesCerradasPeriodo: number;
  sesionesConDiferencia: number;

  diferenciaAcumulada: number;
  ultimaDiferencia: number | null;
}

export interface PanelAdministrativo {
  periodo: FiltroPeriodoAnalitica;
  periodoAnterior: FiltroPeriodoAnalitica;

  generadoEn: string;

  comerciales: IndicadoresComerciales;
  caja: EstadoCajaAnalitica;
  inventario: ResumenInventarioAnalitica;

  metodosPago: ResumenMetodoPagoAnalitica[];
  ventasPorDia: PuntoVentasDiarias[];
  ventasPorHora: PuntoVentasHora[];

  productosMasVendidos: ProductoVendidoAnalitica[];
  actividadPorUsuario: ActividadUsuarioAnalitica[];

  alertas: AlertaAdministrativa[];
  actividadReciente: ActividadOperativa[];
}
