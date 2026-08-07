export type EstadoInsumo =
  | "Activo"
  | "Inactivo";

export type UnidadBaseInventario =
  | "g"
  | "ml"
  | "unidad";

export type PoliticaFaltanteInventario =
  | "Permitir con advertencia"
  | "Bloquear";

export type NivelStockInventario =
  | "Normal"
  | "Bajo"
  | "Negativo";

export type TipoMovimientoInventario =
  | "Stock inicial"
  | "Entrada"
  | "Consumo automático"
  | "Reversión por anulación"
  | "Merma por anulación"
  | "Ajuste positivo"
  | "Ajuste negativo"
  | "Conteo físico";

export type OrigenMovimientoInventario =
  | "Configuración inicial"
  | "Compra"
  | "Venta"
  | "Anulación"
  | "Ajuste manual"
  | "Conteo físico";

export type EstadoReceta =
  | "Vigente"
  | "Histórica";

export type EstadoConsumoVenta =
  | "Aplicado"
  | "Reintegrado"
  | "Clasificado como merma";

export type TratamientoAnulacionInventario =
  | "Reintegrar insumos"
  | "Registrar como merma";

export interface InsumoInventario {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;

  unidadBase: UnidadBaseInventario;

  presentacionCompra: string;
  factorConversionCompra: number;

  stockActual: number;

  controlarStockBajo: boolean;
  stockMinimo: number;

  politicaFaltante:
    PoliticaFaltanteInventario;

  controlEconomico: boolean;
  costoPromedioUnidadBase:
    number | null;

  estado: EstadoInsumo;

  fechaRegistro: string;
  fechaActualizacion: string;

  usuarioActualizacionId: number;
  usuarioActualizacionNombre: string;
}

export interface CrearInsumoDto {
  codigo: string;
  nombre: string;
  categoria: string;

  unidadBase: UnidadBaseInventario;

  presentacionCompra: string;
  factorConversionCompra: number;

  stockInicialCompra: number;

  controlarStockBajo: boolean;
  stockMinimo: number;

  politicaFaltante:
    PoliticaFaltanteInventario;

  controlEconomico: boolean;

  costoPorPresentacionInicial:
    number | null;
}

export interface ActualizarInsumoDto {
  codigo: string;
  nombre: string;
  categoria: string;

  unidadBase: UnidadBaseInventario;

  presentacionCompra: string;
  factorConversionCompra: number;

  controlarStockBajo: boolean;
  stockMinimo: number;

  politicaFaltante:
    PoliticaFaltanteInventario;

  controlEconomico: boolean;

  costoPorPresentacionActual:
    number | null;
}

export interface RegistrarEntradaInventarioDto {
  insumoId: number;

  cantidadPresentaciones: number;

  costoTotal: number | null;

  referencia: string | null;
  motivo: string;
}

export interface RegistrarAjusteManualInventarioDto {
  insumoId: number;

  cantidadAjuste: number;

  motivo: string;
}

export interface IngredienteReceta {
  insumoId: number;
  insumoCodigo: string;
  insumoNombre: string;
  unidadBase: UnidadBaseInventario;

  cantidadPorProducto: number;
}

export interface RecetaProducto {
  id: number;

  productoId: number;
  productoCodigo: string;
  productoNombre: string;

  version: number;
  estado: EstadoReceta;

  ingredientes: IngredienteReceta[];

  fechaVigenciaDesde: string;
  fechaVigenciaHasta: string | null;

  usuarioRegistroId: number;
  usuarioRegistroNombre: string;
}

export interface GuardarRecetaProductoDto {
  productoId: number;

  ingredientes: Array<{
    insumoId: number;
    cantidadPorProducto: number;
  }>;
}

export interface DetalleVentaParaInventario {
  productoId: number;
  cantidad: number;
}

export type NivelProyeccionInventario =
  | "Normal"
  | "Bajo"
  | "Negativo"
  | "Bloqueado"
  | "Insumo inactivo";

export interface ProyeccionInsumoVenta {
  insumoId: number;
  insumoCodigo: string;
  insumoNombre: string;
  unidadBase: UnidadBaseInventario;

  cantidadDisponible: number;
  cantidadRequerida: number;
  saldoResultante: number;

  nivel: NivelProyeccionInventario;

  stockMinimo: number | null;

  politicaFaltante:
    PoliticaFaltanteInventario;

  recetaVersionIds: number[];
  productosRelacionados: string[];
}

export interface EvaluacionInventarioVenta {
  bloqueada: boolean;
  requiereConfirmacion: boolean;

  proyecciones:
    ProyeccionInsumoVenta[];

  alertas:
    ProyeccionInsumoVenta[];

  productosSinReceta: string[];
}

export interface DetalleConsumoVentaInventario {
  insumoId: number;
  insumoCodigo: string;
  insumoNombre: string;
  unidadBase: UnidadBaseInventario;

  cantidadConsumida: number;

  stockAnterior: number;
  stockPosterior: number;

  costoUnitarioAplicado:
    number | null;

  costoTotalAplicado:
    number | null;

  recetaVersionIds: number[];
  productosRelacionados: string[];
}

export interface ConsumoVentaInventario {
  id: number;

  ventaId: number;
  numeroPedido: string;

  estado: EstadoConsumoVenta;

  autorizoSaldoNegativo: boolean;

  detalles:
    DetalleConsumoVentaInventario[];

  fechaHoraRegistro: string;

  fechaHoraTratamiento:
    string | null;

  tratamientoAnulacion:
    TratamientoAnulacionInventario | null;

  usuarioRegistroId: number;
  usuarioRegistroNombre: string;

  usuarioTratamientoId: number | null;
  usuarioTratamientoNombre:
    string | null;
}

export interface RegistrarConsumoVentaDto {
  ventaId: number;
  numeroPedido: string;

  detalles:
    DetalleVentaParaInventario[];

  autorizaSaldoNegativo: boolean;
}

export interface RegistrarTratamientoAnulacionDto {
  ventaId: number;
  numeroPedido: string;

  tratamiento:
    TratamientoAnulacionInventario;

  motivo: string;
}

export interface MovimientoInventario {
  id: number;

  insumoId: number;
  insumoCodigo: string;
  insumoNombre: string;
  unidadBase: UnidadBaseInventario;

  tipo: TipoMovimientoInventario;
  origen: OrigenMovimientoInventario;

  cantidad: number;

  cantidadClasificada:
    number | null;

  stockAnterior: number;
  stockPosterior: number;

  motivo: string;
  referencia: string | null;

  ventaId: number | null;
  numeroPedido: string | null;

  recetaVersionIds: number[];

  costoUnitarioAplicado:
    number | null;

  impactoEconomico:
    number | null;

  fechaHora: string;

  usuarioId: number;
  usuarioNombre: string;
}

export interface FiltroMovimientosInventario {
  insumoId?: number;
  tipo?: TipoMovimientoInventario;
  texto?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface DetalleConteoFisicoDto {
  insumoId: number;
  stockFisico: number;
  motivo: string;
}

export interface DetalleConteoFisico {
  insumoId: number;
  insumoCodigo: string;
  insumoNombre: string;
  unidadBase: UnidadBaseInventario;

  stockTeorico: number;
  stockFisico: number;
  variacion: number;

  motivo: string;

  costoUnitarioAplicado:
    number | null;

  impactoEconomico:
    number | null;
}

export interface ConteoFisicoInventario {
  id: number;

  observaciones: string | null;

  detalles:
    DetalleConteoFisico[];

  fechaHora: string;

  usuarioId: number;
  usuarioNombre: string;
}

export interface RegistrarConteoFisicoDto {
  observaciones: string | null;

  detalles:
    DetalleConteoFisicoDto[];
}

export interface ResumenInventario {
  totalInsumosActivos: number;

  insumosNormales: number;
  insumosBajos: number;
  insumosNegativos: number;

  valorInventarioPositivo: number;
  valorDeficitInventario: number;

  alertas: InsumoInventario[];

  movimientosRecientes:
    MovimientoInventario[];
}
