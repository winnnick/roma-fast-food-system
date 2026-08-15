import type {
  CatalogStatus,
  CategorySnapshot,
  ClientSnapshot,
  CreateCategoryInput,
  ProductInventoryControl,
  ProductSnapshot,
  UpdateCategoryInput,
  UpsertClientInput,
  UpsertProductInput,
} from '../catalog/catalog.models';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
export const CLIENT_REPOSITORY = Symbol('CLIENT_REPOSITORY');

export interface CategoryRepositoryPort {
  list(): Promise<CategorySnapshot[]>;
  findById(id: number): Promise<CategorySnapshot | null>;
  nameExists(name: string, excludeId?: number): Promise<boolean>;
  create(input: CreateCategoryInput): Promise<CategorySnapshot>;
  update(id: number, input: UpdateCategoryInput): Promise<CategorySnapshot | null>;
  changeStatus(id: number, status: CatalogStatus): Promise<CategorySnapshot | null>;
}

export interface ProductRepositoryPort {
  list(): Promise<ProductSnapshot[]>;
  findById(id: number): Promise<ProductSnapshot | null>;
  codeExists(code: string, excludeId?: number): Promise<boolean>;
  nameExists(name: string, categoryId: number, excludeId?: number): Promise<boolean>;
  countActiveByCategory(categoryId: number): Promise<number>;
  create(input: UpsertProductInput): Promise<ProductSnapshot>;
  update(id: number, input: UpsertProductInput): Promise<ProductSnapshot | null>;
  changeStatus(id: number, status: CatalogStatus): Promise<ProductSnapshot | null>;
  changeFeatured(id: number, featured: boolean): Promise<ProductSnapshot | null>;
  changeInventoryControl(
    id: number,
    inventoryControl: ProductInventoryControl,
  ): Promise<ProductSnapshot | null>;
}

export interface ClientRepositoryPort {
  list(): Promise<ClientSnapshot[]>;
  findById(id: number): Promise<ClientSnapshot | null>;
  documentExists(documentNumber: string, excludeId?: number): Promise<boolean>;
  create(input: UpsertClientInput): Promise<ClientSnapshot>;
  update(id: number, input: UpsertClientInput): Promise<ClientSnapshot | null>;
  changeArchived(id: number, archived: boolean): Promise<ClientSnapshot | null>;
}
