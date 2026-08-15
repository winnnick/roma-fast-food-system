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
  CATEGORY_REPOSITORY,
  CLIENT_REPOSITORY,
  PRODUCT_REPOSITORY,
} from './domain/ports/catalog.ports';
import { CategoryOrmEntity } from './infrastructure/persistence/entities/category.orm-entity';
import { ClientOrmEntity } from './infrastructure/persistence/entities/client.orm-entity';
import { ProductOrmEntity } from './infrastructure/persistence/entities/product.orm-entity';
import { TypeOrmCategoryRepository } from './infrastructure/persistence/typeorm-category.repository';
import { TypeOrmClientRepository } from './infrastructure/persistence/typeorm-client.repository';
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm-product.repository';
import { CategoriesController } from './interface/http/categories.controller';
import { ClientsController } from './interface/http/clients.controller';
import { ProductsController } from './interface/http/products.controller';

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
];

@Module({
  imports: [
    CqrsModule,
    ApiSecurityModule,
    TypeOrmModule.forFeature([CategoryOrmEntity, ProductOrmEntity, ClientOrmEntity]),
  ],
  controllers: [CategoriesController, ProductsController, ClientsController],
  providers: [
    CatalogValidationService,
    ...handlers,
    { provide: CATEGORY_REPOSITORY, useClass: TypeOrmCategoryRepository },
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    { provide: CLIENT_REPOSITORY, useClass: TypeOrmClientRepository },
  ],
})
export class OperationsModule {}
