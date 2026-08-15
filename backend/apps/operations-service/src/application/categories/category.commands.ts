import type { CatalogStatus } from '../../domain/catalog/catalog.models';

export class CreateCategoryCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
  ) {}
}

export class UpdateCategoryCommand {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string,
  ) {}
}

export class ChangeCategoryStatusCommand {
  constructor(
    public readonly id: number,
    public readonly status: CatalogStatus,
  ) {}
}
