import { ConflictException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CatalogValidationService } from '../catalog/catalog-validation.service';
import { toCategoryView, type CategoryView } from '../catalog/catalog.views';
import {
  CATEGORY_REPOSITORY,
  PRODUCT_REPOSITORY,
  type CategoryRepositoryPort,
  type ProductRepositoryPort,
} from '../../domain/ports/catalog.ports';
import {
  ChangeCategoryStatusCommand,
  CreateCategoryCommand,
  UpdateCategoryCommand,
} from './category.commands';
import { GetCategoryByIdQuery, ListCategoriesQuery } from './category.queries';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand, CategoryView> {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    private readonly validation: CatalogValidationService,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<CategoryView> {
    const input = this.validation.normalizeCategory(command.name, command.description);
    if (await this.categories.nameExists(input.name)) {
      throw new ConflictException('Ya existe una categoría con ese nombre.');
    }
    return toCategoryView(await this.categories.create(input));
  }
}

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand, CategoryView> {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    private readonly validation: CatalogValidationService,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<CategoryView> {
    if (!(await this.categories.findById(command.id))) {
      throw new NotFoundException('La categoría seleccionada no existe.');
    }
    const input = this.validation.normalizeCategory(command.name, command.description);
    if (await this.categories.nameExists(input.name, command.id)) {
      throw new ConflictException('Ya existe una categoría con ese nombre.');
    }
    const updated = await this.categories.update(command.id, input);
    if (!updated) throw new NotFoundException('La categoría seleccionada no existe.');
    return toCategoryView(updated);
  }
}

@CommandHandler(ChangeCategoryStatusCommand)
export class ChangeCategoryStatusHandler implements ICommandHandler<
  ChangeCategoryStatusCommand,
  CategoryView
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
  ) {}

  async execute(command: ChangeCategoryStatusCommand): Promise<CategoryView> {
    const current = await this.categories.findById(command.id);
    if (!current) throw new NotFoundException('La categoría seleccionada no existe.');

    if (command.status === 'Inactivo') {
      const activeProducts = await this.products.countActiveByCategory(command.id);
      if (activeProducts > 0) {
        throw new ConflictException(
          `No se puede desactivar la categoría porque tiene ${activeProducts} producto(s) activo(s) asociado(s).`,
        );
      }
    }

    const updated = await this.categories.changeStatus(command.id, command.status);
    if (!updated) throw new NotFoundException('La categoría seleccionada no existe.');
    return toCategoryView(updated);
  }
}

@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery, CategoryView[]> {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort) {}

  async execute(): Promise<CategoryView[]> {
    return (await this.categories.list()).map(toCategoryView);
  }
}

@QueryHandler(GetCategoryByIdQuery)
export class GetCategoryByIdHandler implements IQueryHandler<GetCategoryByIdQuery, CategoryView> {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort) {}

  async execute(query: GetCategoryByIdQuery): Promise<CategoryView> {
    const category = await this.categories.findById(query.id);
    if (!category) throw new NotFoundException('La categoría seleccionada no existe.');
    return toCategoryView(category);
  }
}
