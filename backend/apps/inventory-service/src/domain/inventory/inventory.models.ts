export type InventoryUnit = 'g' | 'ml' | 'unidad';
export type IngredientStatus = 'Activo' | 'Inactivo';
export type ShortagePolicy = 'Permitir con advertencia' | 'Bloquear';
export type StockLevel = 'Normal' | 'Bajo' | 'Negativo';
export type ProjectionLevel = 'Normal' | 'Bajo' | 'Negativo' | 'Bloqueado' | 'Insumo inactivo';
export type RecipeStatus = 'Vigente' | 'Histórica';
export type ConsumptionStatus = 'Aplicado' | 'Reintegrado' | 'Clasificado como merma';
export type CancellationTreatment = 'Reintegrar insumos' | 'Registrar como merma';
export type MovementType =
  | 'Stock inicial'
  | 'Entrada'
  | 'Consumo automático'
  | 'Reversión por anulación'
  | 'Merma por anulación'
  | 'Ajuste positivo'
  | 'Ajuste negativo'
  | 'Conteo físico';
export type MovementOrigin =
  'Configuración inicial' | 'Compra' | 'Venta' | 'Anulación' | 'Ajuste manual' | 'Conteo físico';

export interface InventoryActor {
  userId: number;
  userName: string;
}

export interface IngredientSnapshot {
  id: number;
  code: string;
  name: string;
  category: string;
  baseUnit: InventoryUnit;
  purchasePresentation: string;
  purchaseConversionFactor: number;
  stock: number;
  lowStockControl: boolean;
  minimumStock: number;
  shortagePolicy: ShortagePolicy;
  economicControl: boolean;
  averageBaseUnitCost: number | null;
  status: IngredientStatus;
  registeredAt: string;
  updatedAt: string;
  updatedByUserId: number;
  updatedByUserName: string;
}

export interface UpsertIngredientInput {
  code: string;
  name: string;
  category: string;
  baseUnit: InventoryUnit;
  purchasePresentation: string;
  purchaseConversionFactor: number;
  lowStockControl: boolean;
  minimumStock: number;
  shortagePolicy: ShortagePolicy;
  economicControl: boolean;
  currentPresentationCost: number | null;
}

export interface CreateIngredientInput extends UpsertIngredientInput {
  initialPurchaseQuantity: number;
  initialPresentationCost: number | null;
}

export interface InventoryEntryInput extends InventoryActor {
  ingredientId: number;
  purchaseQuantity: number;
  totalCost: number | null;
  reference: string | null;
  reason: string;
}

export interface InventoryAdjustmentInput extends InventoryActor {
  ingredientId: number;
  adjustmentQuantity: number;
  reason: string;
}

export interface ProductReferenceSnapshot {
  productId: number;
  code: string;
  name: string;
  inventoryControl: 'Con receta' | 'No controla inventario';
  status: 'Activo' | 'Inactivo';
}

export interface RecipeIngredientSnapshot {
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  baseUnit: InventoryUnit;
  quantityPerProduct: number;
}

export interface RecipeSnapshot {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  version: number;
  status: RecipeStatus;
  ingredients: RecipeIngredientSnapshot[];
  validFrom: string;
  validUntil: string | null;
  registeredByUserId: number;
  registeredByUserName: string;
}

export interface SaveRecipeInput extends InventoryActor {
  productId: number;
  ingredients: Array<{ ingredientId: number; quantityPerProduct: number }>;
}

export interface SaleInventoryDetailInput {
  productId: number;
  quantity: number;
}

export interface InventoryProjectionSnapshot {
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  baseUnit: InventoryUnit;
  availableQuantity: number;
  requiredQuantity: number;
  resultingBalance: number;
  level: ProjectionLevel;
  minimumStock: number | null;
  shortagePolicy: ShortagePolicy;
  recipeVersionIds: number[];
  relatedProducts: string[];
}

export interface InventoryEvaluationSnapshot {
  blocked: boolean;
  requiresConfirmation: boolean;
  projections: InventoryProjectionSnapshot[];
  alerts: InventoryProjectionSnapshot[];
  productsWithoutRecipe: string[];
}

export interface RegisterSaleConsumptionInput extends InventoryActor {
  saleId: number;
  orderNumber: string;
  details: SaleInventoryDetailInput[];
  authorizeNegativeBalance: boolean;
}

export interface ConsumptionDetailSnapshot {
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  baseUnit: InventoryUnit;
  consumedQuantity: number;
  previousStock: number;
  resultingStock: number;
  appliedUnitCost: number | null;
  appliedTotalCost: number | null;
  recipeVersionIds: number[];
  relatedProducts: string[];
}

export interface SaleConsumptionSnapshot {
  id: number;
  saleId: number;
  orderNumber: string;
  status: ConsumptionStatus;
  authorizedNegativeBalance: boolean;
  details: ConsumptionDetailSnapshot[];
  registeredAt: string;
  treatmentAt: string | null;
  cancellationTreatment: CancellationTreatment | null;
  treatmentReason: string | null;
  registeredByUserId: number;
  registeredByUserName: string;
  treatmentByUserId: number | null;
  treatmentByUserName: string | null;
}

export interface CancellationTreatmentInput extends InventoryActor {
  saleId: number;
  orderNumber: string;
  treatment: CancellationTreatment;
  reason: string;
}

export interface InventoryMovementSnapshot {
  id: number;
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  baseUnit: InventoryUnit;
  type: MovementType;
  origin: MovementOrigin;
  quantity: number;
  classifiedQuantity: number | null;
  previousStock: number;
  resultingStock: number;
  reason: string;
  reference: string | null;
  saleId: number | null;
  orderNumber: string | null;
  recipeVersionIds: number[];
  appliedUnitCost: number | null;
  economicImpact: number | null;
  registeredAt: string;
  userId: number;
  userName: string;
}

export interface InventoryMovementFilter {
  ingredientId?: number;
  type?: MovementType;
  text?: string;
  from?: string;
  to?: string;
}

export interface InventoryCountDetailInput {
  ingredientId: number;
  physicalStock: number;
  reason: string;
}

export interface InventoryCountInput extends InventoryActor {
  observations: string | null;
  details: InventoryCountDetailInput[];
}

export interface InventoryCountDetailSnapshot {
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  baseUnit: InventoryUnit;
  theoreticalStock: number;
  physicalStock: number;
  variation: number;
  reason: string;
  appliedUnitCost: number | null;
  economicImpact: number | null;
}

export interface InventoryCountSnapshot {
  id: number;
  observations: string | null;
  details: InventoryCountDetailSnapshot[];
  registeredAt: string;
  userId: number;
  userName: string;
}

export interface InventorySummarySnapshot {
  activeIngredients: number;
  normalIngredients: number;
  lowIngredients: number;
  negativeIngredients: number;
  positiveInventoryValue: number;
  inventoryDeficitValue: number;
  alerts: IngredientSnapshot[];
  recentMovements: InventoryMovementSnapshot[];
}
