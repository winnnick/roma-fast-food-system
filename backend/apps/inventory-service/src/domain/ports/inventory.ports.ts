import type {
  CancellationTreatmentInput,
  CreateIngredientInput,
  IngredientSnapshot,
  IngredientStatus,
  InventoryActor,
  InventoryAdjustmentInput,
  InventoryCountInput,
  InventoryCountSnapshot,
  InventoryEntryInput,
  InventoryEvaluationSnapshot,
  InventoryMovementFilter,
  InventoryMovementSnapshot,
  InventorySummarySnapshot,
  RegisterSaleConsumptionInput,
  RecipeSnapshot,
  SaleConsumptionSnapshot,
  SaleInventoryDetailInput,
  SaveRecipeInput,
  UpsertIngredientInput,
} from '../inventory/inventory.models';

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');

export interface InventoryRepositoryPort {
  listIngredients(): Promise<IngredientSnapshot[]>;
  findIngredientById(id: number): Promise<IngredientSnapshot | null>;
  createIngredient(
    input: CreateIngredientInput,
    actor: InventoryActor,
  ): Promise<IngredientSnapshot>;
  updateIngredient(
    id: number,
    input: UpsertIngredientInput,
    actor: InventoryActor,
  ): Promise<IngredientSnapshot | null>;
  changeIngredientStatus(
    id: number,
    status: IngredientStatus,
    actor: InventoryActor,
  ): Promise<IngredientSnapshot | null>;
  registerEntry(input: InventoryEntryInput): Promise<InventoryMovementSnapshot>;
  registerAdjustment(input: InventoryAdjustmentInput): Promise<InventoryMovementSnapshot>;

  listRecipes(): Promise<RecipeSnapshot[]>;
  findCurrentRecipeByProduct(productId: number): Promise<RecipeSnapshot | null>;
  saveRecipeVersion(input: SaveRecipeInput): Promise<RecipeSnapshot>;
  finishCurrentRecipe(productId: number, actor: InventoryActor): Promise<RecipeSnapshot | null>;

  evaluateSale(details: SaleInventoryDetailInput[]): Promise<InventoryEvaluationSnapshot>;
  registerSaleConsumption(input: RegisterSaleConsumptionInput): Promise<SaleConsumptionSnapshot>;
  applyCancellationTreatment(input: CancellationTreatmentInput): Promise<SaleConsumptionSnapshot>;
  listSaleConsumptions(): Promise<SaleConsumptionSnapshot[]>;

  listMovements(filter: InventoryMovementFilter): Promise<InventoryMovementSnapshot[]>;
  registerCount(input: InventoryCountInput): Promise<InventoryCountSnapshot>;
  listCounts(): Promise<InventoryCountSnapshot[]>;
  getSummary(): Promise<InventorySummarySnapshot>;
}
