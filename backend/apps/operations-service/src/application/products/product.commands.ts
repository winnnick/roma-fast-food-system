import type {
  CatalogStatus,
  ProductInventoryControl,
  ProductPreparationMode,
} from '../../domain/catalog/catalog.models';

export interface ProductCommandInput {
  code: string;
  name: string;
  description: string;
  categoryId: number;
  price: number;
  availablePedidosYa?: boolean;
  pedidosYaPrice?: number | null;
  featured: boolean;
  preparationMode?: ProductPreparationMode;
  inventoryControl?: ProductInventoryControl;
  imageUrl?: string | null;
}

export class CreateProductCommand {
  constructor(public readonly input: ProductCommandInput) {}
}

export class UpdateProductCommand {
  constructor(
    public readonly id: number,
    public readonly input: ProductCommandInput,
  ) {}
}

export class ChangeProductStatusCommand {
  constructor(
    public readonly id: number,
    public readonly status: CatalogStatus,
  ) {}
}

export class ChangeProductFeaturedCommand {
  constructor(
    public readonly id: number,
    public readonly featured: boolean,
  ) {}
}

export class ChangeProductInventoryControlCommand {
  constructor(
    public readonly id: number,
    public readonly inventoryControl: ProductInventoryControl,
  ) {}
}
