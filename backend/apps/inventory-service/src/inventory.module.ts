import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiSecurityModule } from '@roma/shared';
import {
  ChangeIngredientStatusHandler,
  CreateIngredientHandler,
  EvaluateSaleInventoryHandler,
  FinishCurrentRecipeHandler,
  GetCurrentRecipeByProductHandler,
  GetIngredientByIdHandler,
  GetInventorySummaryHandler,
  ListIngredientsHandler,
  ListInventoryCountsHandler,
  ListInventoryMovementsHandler,
  ListRecipesHandler,
  ListSaleConsumptionsHandler,
  RegisterInventoryAdjustmentHandler,
  RegisterInventoryCountHandler,
  RegisterInventoryEntryHandler,
  RegisterSaleConsumptionHandler,
  SaveRecipeVersionHandler,
  TreatCancelledSaleInventoryHandler,
  UpdateIngredientHandler,
} from './application/inventory/inventory.handlers';
import { InventoryRulesService } from './application/inventory/inventory-rules.service';
import { SyncProductReferenceHandler } from './application/inventory/product-reference.handler';
import { INVENTORY_REPOSITORY } from './domain/ports/inventory.ports';
import { PRODUCT_REFERENCE_REPOSITORY } from './domain/ports/product-reference.ports';
import { IngredientOrmEntity } from './infrastructure/persistence/entities/ingredient.orm-entity';
import { InventoryCountDetailOrmEntity } from './infrastructure/persistence/entities/inventory-count-detail.orm-entity';
import { InventoryCountOrmEntity } from './infrastructure/persistence/entities/inventory-count.orm-entity';
import { InventoryMovementOrmEntity } from './infrastructure/persistence/entities/movement.orm-entity';
import { ProductReferenceOrmEntity } from './infrastructure/persistence/entities/product-reference.orm-entity';
import { RecipeItemOrmEntity } from './infrastructure/persistence/entities/recipe-item.orm-entity';
import { RecipeOrmEntity } from './infrastructure/persistence/entities/recipe.orm-entity';
import { SaleConsumptionDetailOrmEntity } from './infrastructure/persistence/entities/sale-consumption-detail.orm-entity';
import { SaleConsumptionOrmEntity } from './infrastructure/persistence/entities/sale-consumption.orm-entity';
import { TypeOrmInventoryRepository } from './infrastructure/persistence/typeorm-inventory.repository';
import { TypeOrmProductReferenceRepository } from './infrastructure/persistence/typeorm-product-reference.repository';
import { InventoryController } from './interface/http/inventory.controller';
import { InventoryInternalController } from './interface/http/inventory-internal.controller';

const handlers = [
  CreateIngredientHandler,
  UpdateIngredientHandler,
  ChangeIngredientStatusHandler,
  RegisterInventoryEntryHandler,
  RegisterInventoryAdjustmentHandler,
  SaveRecipeVersionHandler,
  FinishCurrentRecipeHandler,
  RegisterSaleConsumptionHandler,
  TreatCancelledSaleInventoryHandler,
  RegisterInventoryCountHandler,
  ListIngredientsHandler,
  GetIngredientByIdHandler,
  ListRecipesHandler,
  GetCurrentRecipeByProductHandler,
  EvaluateSaleInventoryHandler,
  ListSaleConsumptionsHandler,
  ListInventoryMovementsHandler,
  ListInventoryCountsHandler,
  GetInventorySummaryHandler,
  SyncProductReferenceHandler,
];

@Module({
  imports: [
    CqrsModule,
    ApiSecurityModule,
    TypeOrmModule.forFeature([
      IngredientOrmEntity,
      ProductReferenceOrmEntity,
      RecipeOrmEntity,
      RecipeItemOrmEntity,
      InventoryMovementOrmEntity,
      SaleConsumptionOrmEntity,
      SaleConsumptionDetailOrmEntity,
      InventoryCountOrmEntity,
      InventoryCountDetailOrmEntity,
    ]),
  ],
  controllers: [InventoryController, InventoryInternalController],
  providers: [
    InventoryRulesService,
    ...handlers,
    { provide: INVENTORY_REPOSITORY, useClass: TypeOrmInventoryRepository },
    { provide: PRODUCT_REFERENCE_REPOSITORY, useClass: TypeOrmProductReferenceRepository },
  ],
})
export class InventoryModule {}
