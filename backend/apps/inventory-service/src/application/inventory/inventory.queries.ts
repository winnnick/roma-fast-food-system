import type {
  InventoryMovementFilter,
  SaleInventoryDetailInput,
} from '../../domain/inventory/inventory.models';

export class ListIngredientsQuery {}
export class GetIngredientByIdQuery {
  constructor(public readonly id: number) {}
}
export class ListRecipesQuery {}
export class GetCurrentRecipeByProductQuery {
  constructor(public readonly productId: number) {}
}
export class EvaluateSaleInventoryQuery {
  constructor(public readonly details: SaleInventoryDetailInput[]) {}
}
export class ListSaleConsumptionsQuery {}
export class ListInventoryMovementsQuery {
  constructor(public readonly filter: InventoryMovementFilter) {}
}
export class ListInventoryCountsQuery {}
export class GetInventorySummaryQuery {}
