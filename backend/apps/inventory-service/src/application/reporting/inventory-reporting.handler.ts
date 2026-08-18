import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { InventoryRepositoryPort } from '../../domain/ports/inventory.ports';
import { INVENTORY_REPOSITORY } from '../../domain/ports/inventory.ports';
import { GetInventoryReportingSnapshotQuery } from './inventory-reporting.query';
import {
  toConsumptionView,
  toCountView,
  toIngredientView,
  toMovementView,
  toRecipeView,
  toSummaryView,
  type IngredientView,
  type InventoryCountView,
  type InventoryMovementView,
  type InventorySummaryView,
  type RecipeView,
  type SaleConsumptionView,
} from '../inventory/inventory.views';

export interface InventoryReportingSnapshotView {
  generatedAt: string;
  ingredients: IngredientView[];
  recipes: RecipeView[];
  movements: InventoryMovementView[];
  consumptions: SaleConsumptionView[];
  counts: InventoryCountView[];
  summary: InventorySummaryView;
}

@QueryHandler(GetInventoryReportingSnapshotQuery)
export class GetInventoryReportingSnapshotHandler implements IQueryHandler<
  GetInventoryReportingSnapshotQuery,
  InventoryReportingSnapshotView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly inventory: InventoryRepositoryPort) {}

  async execute(): Promise<InventoryReportingSnapshotView> {
    const [ingredients, recipes, movements, consumptions, counts, summary] = await Promise.all([
      this.inventory.listIngredients(),
      this.inventory.listRecipes(),
      this.inventory.listMovements({}),
      this.inventory.listSaleConsumptions(),
      this.inventory.listCounts(),
      this.inventory.getSummary(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      ingredients: ingredients.map(toIngredientView),
      recipes: recipes.map(toRecipeView),
      movements: movements.map(toMovementView),
      consumptions: consumptions.map(toConsumptionView),
      counts: counts.map(toCountView),
      summary: toSummaryView(summary),
    };
  }
}
