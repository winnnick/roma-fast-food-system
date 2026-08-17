import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { InventoryRepositoryPort } from '../../domain/ports/inventory.ports';
import { INVENTORY_REPOSITORY } from '../../domain/ports/inventory.ports';
import { GetInventoryReportingSnapshotQuery } from './inventory-reporting.query';

export interface InventoryReportingSnapshotView {
  generatedAt: string;
  ingredients: Awaited<ReturnType<InventoryRepositoryPort['listIngredients']>>;
  recipes: Awaited<ReturnType<InventoryRepositoryPort['listRecipes']>>;
  movements: Awaited<ReturnType<InventoryRepositoryPort['listMovements']>>;
  consumptions: Awaited<ReturnType<InventoryRepositoryPort['listSaleConsumptions']>>;
  counts: Awaited<ReturnType<InventoryRepositoryPort['listCounts']>>;
  summary: Awaited<ReturnType<InventoryRepositoryPort['getSummary']>>;
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
      ingredients,
      recipes,
      movements,
      consumptions,
      counts,
      summary,
    };
  }
}
