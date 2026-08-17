import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiSecurityModule } from '@roma/shared';
import { CatalogValidationService } from './application/catalog/catalog-validation.service';
import {
  ChangeCategoryStatusHandler,
  CreateCategoryHandler,
  GetCategoryByIdHandler,
  ListCategoriesHandler,
  UpdateCategoryHandler,
} from './application/categories/category.handlers';
import {
  ChangeClientArchivedHandler,
  CreateClientHandler,
  GetClientByIdHandler,
  ListClientsHandler,
  UpdateClientHandler,
} from './application/clients/client.handlers';
import {
  ChangeProductFeaturedHandler,
  ChangeProductInventoryControlHandler,
  ChangeProductStatusHandler,
  CreateProductHandler,
  GetProductByIdHandler,
  ListProductsHandler,
  UpdateProductHandler,
} from './application/products/product.handlers';
import {
  CancelSaleHandler,
  ChangePreparationStartModeHandler,
  ChangePreparationStatusHandler,
  CloseCashSessionHandler,
  CreateSaleHandler,
  EvaluateSaleInventoryHandler,
  GetCashSummaryHandler,
  GetOpenCashSessionHandler,
  GetPreparationConfigurationHandler,
  GetSaleByIdHandler as GetTransactionalSaleByIdHandler,
  ListCashMovementsHandler,
  ListCashSessionsHandler,
  ListSalePaymentsHandler,
  ListSalesHandler,
  OpenCashSessionHandler,
  RegisterManualCashMovementHandler,
  RegisterSalePaymentHandler,
} from './application/transactions/operations.handlers';
import { OperationsRulesService } from './application/transactions/operations-rules.service';
import {
  CATEGORY_REPOSITORY,
  CLIENT_REPOSITORY,
  PRODUCT_REPOSITORY,
} from './domain/ports/catalog.ports';
import { INVENTORY_INTEGRATION } from './domain/ports/inventory-integration.ports';
import { OPERATIONS_TRANSACTION_REPOSITORY } from './domain/ports/operations.ports';
import { CashMovementOrmEntity } from './infrastructure/persistence/entities/cash-movement.orm-entity';
import { CashSessionOrmEntity } from './infrastructure/persistence/entities/cash-session.orm-entity';
import { CategoryOrmEntity } from './infrastructure/persistence/entities/category.orm-entity';
import { ClientOrmEntity } from './infrastructure/persistence/entities/client.orm-entity';
import { OperationsSettingOrmEntity } from './infrastructure/persistence/entities/operations-setting.orm-entity';
import { ProductOrmEntity } from './infrastructure/persistence/entities/product.orm-entity';
import { SaleDetailOrmEntity } from './infrastructure/persistence/entities/sale-detail.orm-entity';
import { SalePaymentOrmEntity } from './infrastructure/persistence/entities/sale-payment.orm-entity';
import { SaleOrmEntity } from './infrastructure/persistence/entities/sale.orm-entity';
import { HttpInventoryIntegration } from './infrastructure/integration/http-inventory.integration';
import { TypeOrmCategoryRepository } from './infrastructure/persistence/typeorm-category.repository';
import { TypeOrmClientRepository } from './infrastructure/persistence/typeorm-client.repository';
import { TypeOrmOperationsTransactionRepository } from './infrastructure/persistence/typeorm-operations-transaction.repository';
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm-product.repository';
import { CashController } from './interface/http/cash.controller';
import { CategoriesController } from './interface/http/categories.controller';
import { ClientsController } from './interface/http/clients.controller';
import { ProductsController } from './interface/http/products.controller';
import { PublicOrdersController } from './interface/http/public-orders.controller';
import { SalesController } from './interface/http/sales.controller';

const handlers = [
  CreateCategoryHandler,
  UpdateCategoryHandler,
  ChangeCategoryStatusHandler,
  ListCategoriesHandler,
  GetCategoryByIdHandler,
  CreateProductHandler,
  UpdateProductHandler,
  ChangeProductStatusHandler,
  ChangeProductFeaturedHandler,
  ChangeProductInventoryControlHandler,
  ListProductsHandler,
  GetProductByIdHandler,
  CreateClientHandler,
  UpdateClientHandler,
  ChangeClientArchivedHandler,
  ListClientsHandler,
  GetClientByIdHandler,
  CreateSaleHandler,
  EvaluateSaleInventoryHandler,
  ChangePreparationStatusHandler,
  CancelSaleHandler,
  ChangePreparationStartModeHandler,
  OpenCashSessionHandler,
  RegisterManualCashMovementHandler,
  CloseCashSessionHandler,
  RegisterSalePaymentHandler,
  ListSalesHandler,
  GetTransactionalSaleByIdHandler,
  GetPreparationConfigurationHandler,
  GetOpenCashSessionHandler,
  ListCashSessionsHandler,
  ListCashMovementsHandler,
  ListSalePaymentsHandler,
  GetCashSummaryHandler,
];

@Module({
  imports: [
    CqrsModule,
    ApiSecurityModule,
    TypeOrmModule.forFeature([
      CategoryOrmEntity,
      ProductOrmEntity,
      ClientOrmEntity,
      CashSessionOrmEntity,
      SaleOrmEntity,
      SaleDetailOrmEntity,
      SalePaymentOrmEntity,
      CashMovementOrmEntity,
      OperationsSettingOrmEntity,
    ]),
  ],
  controllers: [
    CategoriesController,
    ProductsController,
    ClientsController,
    SalesController,
    CashController,
    PublicOrdersController,
  ],
  providers: [
    CatalogValidationService,
    OperationsRulesService,
    ...handlers,
    { provide: INVENTORY_INTEGRATION, useClass: HttpInventoryIntegration },
    { provide: CATEGORY_REPOSITORY, useClass: TypeOrmCategoryRepository },
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    { provide: CLIENT_REPOSITORY, useClass: TypeOrmClientRepository },
    {
      provide: OPERATIONS_TRANSACTION_REPOSITORY,
      useClass: TypeOrmOperationsTransactionRepository,
    },
  ],
})
export class OperationsModule {}
