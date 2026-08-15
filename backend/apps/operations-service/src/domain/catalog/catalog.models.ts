export type CatalogStatus = 'Activo' | 'Inactivo';
export type ProductPreparationMode = 'Requiere preparación' | 'Entrega directa';
export type ProductInventoryControl = 'Con receta' | 'No controla inventario';
export type ClientDocumentType = 'CI' | 'NIT' | 'Pasaporte' | 'Otro';

export interface CategorySnapshot {
  id: number;
  name: string;
  description: string;
  status: CatalogStatus;
  registeredAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  description: string;
}

export type UpdateCategoryInput = CreateCategoryInput;

export interface ProductSnapshot {
  id: number;
  code: string;
  name: string;
  description: string;
  categoryId: number;
  price: number;
  availablePedidosYa: boolean;
  pedidosYaPrice: number | null;
  status: CatalogStatus;
  available: boolean;
  featured: boolean;
  preparationMode: ProductPreparationMode;
  inventoryControl: ProductInventoryControl;
  imageUrl: string | null;
  registeredAt: Date;
  updatedAt: Date;
}

export interface UpsertProductInput {
  code: string;
  name: string;
  description: string;
  categoryId: number;
  price: number;
  availablePedidosYa: boolean;
  pedidosYaPrice: number | null;
  featured: boolean;
  preparationMode: ProductPreparationMode;
  inventoryControl: ProductInventoryControl;
  imageUrl: string | null;
}

export interface ClientSnapshot {
  id: number;
  fullName: string;
  documentType: ClientDocumentType | null;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  zone: string | null;
  addressReference: string | null;
  locationUrl: string | null;
  deliveryInstructions: string | null;
  observations: string | null;
  status: CatalogStatus;
  archived: boolean;
  archivedAt: Date | null;
  registeredAt: Date;
  updatedAt: Date;
}

export interface UpsertClientInput {
  fullName: string;
  documentType: ClientDocumentType | null;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  zone: string | null;
  addressReference: string | null;
  locationUrl: string | null;
  deliveryInstructions: string | null;
  observations: string | null;
}
