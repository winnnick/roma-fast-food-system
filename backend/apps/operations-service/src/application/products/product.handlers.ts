import { BadRequestException, ConflictException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CatalogValidationService } from '../catalog/catalog-validation.service';
import { toProductView, type ProductView } from '../catalog/catalog.views';
import {
  CATEGORY_REPOSITORY,
  PRODUCT_REPOSITORY,
  type CategoryRepositoryPort,
  type ProductRepositoryPort,
} from '../../domain/ports/catalog.ports';
import {
  ChangeProductFeaturedCommand,
  ChangeProductInventoryControlCommand,
  ChangeProductStatusCommand,
  CreateProductCommand,
  UpdateProductCommand,
  type ProductCommandInput,
} from './product.commands';
import { GetProductByIdQuery, ListProductsQuery } from './product.queries';

abstract class ProductHandlerBase {
  constructor(
    protected readonly products: ProductRepositoryPort,
    protected readonly categories: CategoryRepositoryPort,
    protected readonly validation: CatalogValidationService,
  ) {}

  protected async validateInput(
    input: ProductCommandInput,
    excludeId?: number,
    currentCategoryId?: number,
    currentStatus?: 'Activo' | 'Inactivo',
  ) {
    const normalized = this.validation.normalizeProduct(input);
    const category = await this.categories.findById(normalized.categoryId);
    if (!category) throw new BadRequestException('La categoría seleccionada no existe.');

    const categoryChanged =
      currentCategoryId !== undefined && currentCategoryId !== normalized.categoryId;
    if (
      category.status === 'Inactivo' &&
      (excludeId === undefined || categoryChanged || currentStatus === 'Activo')
    ) {
      throw new BadRequestException('No se puede asignar el producto a una categoría inactiva.');
    }

    if (await this.products.codeExists(normalized.code, excludeId)) {
      throw new ConflictException('Ya existe un producto con ese código.');
    }
    if (await this.products.nameExists(normalized.name, normalized.categoryId, excludeId)) {
      throw new ConflictException(
        'Ya existe un producto con ese nombre dentro de la categoría seleccionada.',
      );
    }
    return normalized;
  }
}

@CommandHandler(CreateProductCommand)
export class CreateProductHandler
  extends ProductHandlerBase
  implements ICommandHandler<CreateProductCommand, ProductView>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY) products: ProductRepositoryPort,
    @Inject(CATEGORY_REPOSITORY) categories: CategoryRepositoryPort,
    validation: CatalogValidationService,
  ) {
    super(products, categories, validation);
  }

  async execute(command: CreateProductCommand): Promise<ProductView> {
    return toProductView(await this.products.create(await this.validateInput(command.input)));
  }
}

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler
  extends ProductHandlerBase
  implements ICommandHandler<UpdateProductCommand, ProductView>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY) products: ProductRepositoryPort,
    @Inject(CATEGORY_REPOSITORY) categories: CategoryRepositoryPort,
    validation: CatalogValidationService,
  ) {
    super(products, categories, validation);
  }

  async execute(command: UpdateProductCommand): Promise<ProductView> {
    const current = await this.products.findById(command.id);
    if (!current) throw new NotFoundException('El producto seleccionado no existe.');
    const normalized = await this.validateInput(
      command.input,
      command.id,
      current.categoryId,
      current.status,
    );
    const updated = await this.products.update(command.id, normalized);
    if (!updated) throw new NotFoundException('El producto seleccionado no existe.');
    return toProductView(updated);
  }
}

@CommandHandler(ChangeProductStatusCommand)
export class ChangeProductStatusHandler implements ICommandHandler<
  ChangeProductStatusCommand,
  ProductView
> {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
  ) {}

  async execute(command: ChangeProductStatusCommand): Promise<ProductView> {
    const current = await this.products.findById(command.id);
    if (!current) throw new NotFoundException('El producto seleccionado no existe.');
    if (command.status === 'Activo') {
      const category = await this.categories.findById(current.categoryId);
      if (!category || category.status === 'Inactivo') {
        throw new BadRequestException(
          'No se puede activar un producto asociado a una categoría inactiva.',
        );
      }
    }
    const updated = await this.products.changeStatus(command.id, command.status);
    if (!updated) throw new NotFoundException('El producto seleccionado no existe.');
    return toProductView(updated);
  }
}

@CommandHandler(ChangeProductFeaturedCommand)
export class ChangeProductFeaturedHandler implements ICommandHandler<
  ChangeProductFeaturedCommand,
  ProductView
> {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort) {}

  async execute(command: ChangeProductFeaturedCommand): Promise<ProductView> {
    const current = await this.products.findById(command.id);
    if (!current) throw new NotFoundException('El producto seleccionado no existe.');
    if (current.status === 'Inactivo' && command.featured) {
      throw new BadRequestException('No se puede destacar un producto inactivo.');
    }
    const updated = await this.products.changeFeatured(command.id, command.featured);
    if (!updated) throw new NotFoundException('El producto seleccionado no existe.');
    return toProductView(updated);
  }
}

@CommandHandler(ChangeProductInventoryControlCommand)
export class ChangeProductInventoryControlHandler implements ICommandHandler<
  ChangeProductInventoryControlCommand,
  ProductView
> {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort) {}

  async execute(command: ChangeProductInventoryControlCommand): Promise<ProductView> {
    const updated = await this.products.changeInventoryControl(
      command.id,
      command.inventoryControl,
    );
    if (!updated) throw new NotFoundException('El producto seleccionado no existe.');
    return toProductView(updated);
  }
}

@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery, ProductView[]> {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort) {}
  async execute(): Promise<ProductView[]> {
    return (await this.products.list()).map(toProductView);
  }
}

@QueryHandler(GetProductByIdQuery)
export class GetProductByIdHandler implements IQueryHandler<GetProductByIdQuery, ProductView> {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort) {}
  async execute(query: GetProductByIdQuery): Promise<ProductView> {
    const product = await this.products.findById(query.id);
    if (!product) throw new NotFoundException('El producto seleccionado no existe.');
    return toProductView(product);
  }
}
