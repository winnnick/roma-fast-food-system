import type {
  IngredientSnapshot,
  InventoryCountSnapshot,
  InventoryEvaluationSnapshot,
  InventoryMovementSnapshot,
  InventoryProjectionSnapshot,
  InventorySummarySnapshot,
  RecipeSnapshot,
  SaleConsumptionSnapshot,
} from '../../domain/inventory/inventory.models';

export interface IngredientView {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  unidadBase: IngredientSnapshot['baseUnit'];
  presentacionCompra: string;
  factorConversionCompra: number;
  stockActual: number;
  controlarStockBajo: boolean;
  stockMinimo: number;
  politicaFaltante: IngredientSnapshot['shortagePolicy'];
  controlEconomico: boolean;
  costoPromedioUnidadBase: number | null;
  estado: IngredientSnapshot['status'];
  fechaRegistro: string;
  fechaActualizacion: string;
  usuarioActualizacionId: number;
  usuarioActualizacionNombre: string;
}

export interface RecipeView {
  id: number;
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  version: number;
  estado: RecipeSnapshot['status'];
  ingredientes: Array<{
    insumoId: number;
    insumoCodigo: string;
    insumoNombre: string;
    unidadBase: IngredientSnapshot['baseUnit'];
    cantidadPorProducto: number;
  }>;
  fechaVigenciaDesde: string;
  fechaVigenciaHasta: string | null;
  usuarioRegistroId: number;
  usuarioRegistroNombre: string;
}

export interface InventoryProjectionView {
  insumoId: number;
  insumoCodigo: string;
  insumoNombre: string;
  unidadBase: IngredientSnapshot['baseUnit'];
  cantidadDisponible: number;
  cantidadRequerida: number;
  saldoResultante: number;
  nivel: InventoryProjectionSnapshot['level'];
  stockMinimo: number | null;
  politicaFaltante: InventoryProjectionSnapshot['shortagePolicy'];
  recetaVersionIds: number[];
  productosRelacionados: string[];
}

export interface InventoryEvaluationView {
  bloqueada: boolean;
  requiereConfirmacion: boolean;
  proyecciones: InventoryProjectionView[];
  alertas: InventoryProjectionView[];
  productosSinReceta: string[];
}

export interface InventoryMovementView {
  id: number;
  insumoId: number;
  insumoCodigo: string;
  insumoNombre: string;
  unidadBase: IngredientSnapshot['baseUnit'];
  tipo: InventoryMovementSnapshot['type'];
  origen: InventoryMovementSnapshot['origin'];
  cantidad: number;
  cantidadClasificada: number | null;
  stockAnterior: number;
  stockPosterior: number;
  motivo: string;
  referencia: string | null;
  ventaId: number | null;
  numeroPedido: string | null;
  recetaVersionIds: number[];
  costoUnitarioAplicado: number | null;
  impactoEconomico: number | null;
  fechaHora: string;
  usuarioId: number;
  usuarioNombre: string;
}

export interface SaleConsumptionView {
  id: number;
  ventaId: number;
  numeroPedido: string;
  estado: SaleConsumptionSnapshot['status'];
  autorizoSaldoNegativo: boolean;
  detalles: Array<{
    insumoId: number;
    insumoCodigo: string;
    insumoNombre: string;
    unidadBase: IngredientSnapshot['baseUnit'];
    cantidadConsumida: number;
    stockAnterior: number;
    stockPosterior: number;
    costoUnitarioAplicado: number | null;
    costoTotalAplicado: number | null;
    recetaVersionIds: number[];
    productosRelacionados: string[];
  }>;
  fechaHoraRegistro: string;
  fechaHoraTratamiento: string | null;
  tratamientoAnulacion: SaleConsumptionSnapshot['cancellationTreatment'];
  motivoTratamiento: string | null;
  usuarioRegistroId: number;
  usuarioRegistroNombre: string;
  usuarioTratamientoId: number | null;
  usuarioTratamientoNombre: string | null;
}

export interface InventoryCountView {
  id: number;
  observaciones: string | null;
  detalles: Array<{
    insumoId: number;
    insumoCodigo: string;
    insumoNombre: string;
    unidadBase: IngredientSnapshot['baseUnit'];
    stockTeorico: number;
    stockFisico: number;
    variacion: number;
    motivo: string;
    costoUnitarioAplicado: number | null;
    impactoEconomico: number | null;
  }>;
  fechaHora: string;
  usuarioId: number;
  usuarioNombre: string;
}

export interface InventorySummaryView {
  totalInsumosActivos: number;
  insumosNormales: number;
  insumosBajos: number;
  insumosNegativos: number;
  valorInventarioPositivo: number;
  valorDeficitInventario: number;
  alertas: IngredientView[];
  movimientosRecientes: InventoryMovementView[];
}

export const toIngredientView = (item: IngredientSnapshot): IngredientView => ({
  id: item.id,
  codigo: item.code,
  nombre: item.name,
  categoria: item.category,
  unidadBase: item.baseUnit,
  presentacionCompra: item.purchasePresentation,
  factorConversionCompra: item.purchaseConversionFactor,
  stockActual: item.stock,
  controlarStockBajo: item.lowStockControl,
  stockMinimo: item.minimumStock,
  politicaFaltante: item.shortagePolicy,
  controlEconomico: item.economicControl,
  costoPromedioUnidadBase: item.averageBaseUnitCost,
  estado: item.status,
  fechaRegistro: item.registeredAt,
  fechaActualizacion: item.updatedAt,
  usuarioActualizacionId: item.updatedByUserId,
  usuarioActualizacionNombre: item.updatedByUserName,
});

export const toRecipeView = (item: RecipeSnapshot): RecipeView => ({
  id: item.id,
  productoId: item.productId,
  productoCodigo: item.productCode,
  productoNombre: item.productName,
  version: item.version,
  estado: item.status,
  ingredientes: item.ingredients.map((ingredient) => ({
    insumoId: ingredient.ingredientId,
    insumoCodigo: ingredient.ingredientCode,
    insumoNombre: ingredient.ingredientName,
    unidadBase: ingredient.baseUnit,
    cantidadPorProducto: ingredient.quantityPerProduct,
  })),
  fechaVigenciaDesde: item.validFrom,
  fechaVigenciaHasta: item.validUntil,
  usuarioRegistroId: item.registeredByUserId,
  usuarioRegistroNombre: item.registeredByUserName,
});

const toProjectionView = (item: InventoryProjectionSnapshot): InventoryProjectionView => ({
  insumoId: item.ingredientId,
  insumoCodigo: item.ingredientCode,
  insumoNombre: item.ingredientName,
  unidadBase: item.baseUnit,
  cantidadDisponible: item.availableQuantity,
  cantidadRequerida: item.requiredQuantity,
  saldoResultante: item.resultingBalance,
  nivel: item.level,
  stockMinimo: item.minimumStock,
  politicaFaltante: item.shortagePolicy,
  recetaVersionIds: item.recipeVersionIds,
  productosRelacionados: item.relatedProducts,
});

export const toEvaluationView = (item: InventoryEvaluationSnapshot): InventoryEvaluationView => ({
  bloqueada: item.blocked,
  requiereConfirmacion: item.requiresConfirmation,
  proyecciones: item.projections.map(toProjectionView),
  alertas: item.alerts.map(toProjectionView),
  productosSinReceta: item.productsWithoutRecipe,
});

export const toMovementView = (item: InventoryMovementSnapshot): InventoryMovementView => ({
  id: item.id,
  insumoId: item.ingredientId,
  insumoCodigo: item.ingredientCode,
  insumoNombre: item.ingredientName,
  unidadBase: item.baseUnit,
  tipo: item.type,
  origen: item.origin,
  cantidad: item.quantity,
  cantidadClasificada: item.classifiedQuantity,
  stockAnterior: item.previousStock,
  stockPosterior: item.resultingStock,
  motivo: item.reason,
  referencia: item.reference,
  ventaId: item.saleId,
  numeroPedido: item.orderNumber,
  recetaVersionIds: item.recipeVersionIds,
  costoUnitarioAplicado: item.appliedUnitCost,
  impactoEconomico: item.economicImpact,
  fechaHora: item.registeredAt,
  usuarioId: item.userId,
  usuarioNombre: item.userName,
});

export const toConsumptionView = (item: SaleConsumptionSnapshot): SaleConsumptionView => ({
  id: item.id,
  ventaId: item.saleId,
  numeroPedido: item.orderNumber,
  estado: item.status,
  autorizoSaldoNegativo: item.authorizedNegativeBalance,
  detalles: item.details.map((detail) => ({
    insumoId: detail.ingredientId,
    insumoCodigo: detail.ingredientCode,
    insumoNombre: detail.ingredientName,
    unidadBase: detail.baseUnit,
    cantidadConsumida: detail.consumedQuantity,
    stockAnterior: detail.previousStock,
    stockPosterior: detail.resultingStock,
    costoUnitarioAplicado: detail.appliedUnitCost,
    costoTotalAplicado: detail.appliedTotalCost,
    recetaVersionIds: detail.recipeVersionIds,
    productosRelacionados: detail.relatedProducts,
  })),
  fechaHoraRegistro: item.registeredAt,
  fechaHoraTratamiento: item.treatmentAt,
  tratamientoAnulacion: item.cancellationTreatment,
  motivoTratamiento: item.treatmentReason,
  usuarioRegistroId: item.registeredByUserId,
  usuarioRegistroNombre: item.registeredByUserName,
  usuarioTratamientoId: item.treatmentByUserId,
  usuarioTratamientoNombre: item.treatmentByUserName,
});

export const toCountView = (item: InventoryCountSnapshot): InventoryCountView => ({
  id: item.id,
  observaciones: item.observations,
  detalles: item.details.map((detail) => ({
    insumoId: detail.ingredientId,
    insumoCodigo: detail.ingredientCode,
    insumoNombre: detail.ingredientName,
    unidadBase: detail.baseUnit,
    stockTeorico: detail.theoreticalStock,
    stockFisico: detail.physicalStock,
    variacion: detail.variation,
    motivo: detail.reason,
    costoUnitarioAplicado: detail.appliedUnitCost,
    impactoEconomico: detail.economicImpact,
  })),
  fechaHora: item.registeredAt,
  usuarioId: item.userId,
  usuarioNombre: item.userName,
});

export const toSummaryView = (item: InventorySummarySnapshot): InventorySummaryView => ({
  totalInsumosActivos: item.activeIngredients,
  insumosNormales: item.normalIngredients,
  insumosBajos: item.lowIngredients,
  insumosNegativos: item.negativeIngredients,
  valorInventarioPositivo: item.positiveInventoryValue,
  valorDeficitInventario: item.inventoryDeficitValue,
  alertas: item.alerts.map(toIngredientView),
  movimientosRecientes: item.recentMovements.map(toMovementView),
});
