export const PRODUCT_REFERENCE_REPOSITORY = Symbol('PRODUCT_REFERENCE_REPOSITORY');

export interface ProductReferenceInput {
  productId: number;
  code: string;
  name: string;
  inventoryControl: 'Con receta' | 'No controla inventario';
  status: 'Activo' | 'Inactivo';
}

export interface ProductReferenceRepositoryPort {
  upsert(input: ProductReferenceInput): Promise<void>;
}
