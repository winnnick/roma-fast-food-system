import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type {
  CatalogStatus,
  ProductInventoryControl,
  ProductSnapshot,
  UpsertProductInput,
} from '../../domain/catalog/catalog.models';
import type { ProductRepositoryPort } from '../../domain/ports/catalog.ports';
import { ProductOrmEntity } from './entities/product.orm-entity';

@Injectable()
export class TypeOrmProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async list(): Promise<ProductSnapshot[]> {
    const entities = await this.repository.find({ order: { id: 'DESC' } });
    return entities.map((entity) => this.toSnapshot(entity));
  }

  async findById(id: number): Promise<ProductSnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toSnapshot(entity) : null;
  }

  async codeExists(code: string, excludeId?: number): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('product')
      .where('LOWER(product.code) = LOWER(:code)', { code });
    if (excludeId !== undefined) query.andWhere('product.id <> :excludeId', { excludeId });
    return (await query.getCount()) > 0;
  }

  async nameExists(name: string, categoryId: number, excludeId?: number): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('product')
      .where('LOWER(product.name) = LOWER(:name)', { name })
      .andWhere('product.categoryId = :categoryId', { categoryId });
    if (excludeId !== undefined) query.andWhere('product.id <> :excludeId', { excludeId });
    return (await query.getCount()) > 0;
  }

  countActiveByCategory(categoryId: number): Promise<number> {
    return this.repository.countBy({ categoryId, status: 'Activo' });
  }

  async create(input: UpsertProductInput): Promise<ProductSnapshot> {
    const entity = this.repository.create({
      code: input.code,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      price: input.price,
      availablePedidosYa: input.availablePedidosYa,
      pedidosYaPrice: input.pedidosYaPrice,
      status: 'Activo',
      available: true,
      featured: input.featured,
      preparationMode: input.preparationMode,
      inventoryControl: input.inventoryControl,
      imageUrl: input.imageUrl,
    });
    return this.toSnapshot(await this.repository.save(entity));
  }

  async update(id: number, input: UpsertProductInput): Promise<ProductSnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;
    entity.code = input.code;
    entity.name = input.name;
    entity.description = input.description;
    entity.categoryId = input.categoryId;
    entity.price = input.price;
    entity.availablePedidosYa = input.availablePedidosYa;
    entity.pedidosYaPrice = input.pedidosYaPrice;
    entity.featured = entity.status === 'Activo' ? input.featured : false;
    entity.preparationMode = input.preparationMode;
    entity.inventoryControl = input.inventoryControl;
    entity.imageUrl = input.imageUrl;
    entity.available = entity.status === 'Activo';
    return this.toSnapshot(await this.repository.save(entity));
  }

  async changeStatus(id: number, status: CatalogStatus): Promise<ProductSnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;
    entity.status = status;
    entity.available = status === 'Activo';
    if (status === 'Inactivo') entity.featured = false;
    return this.toSnapshot(await this.repository.save(entity));
  }

  async changeFeatured(id: number, featured: boolean): Promise<ProductSnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;
    entity.featured = featured;
    return this.toSnapshot(await this.repository.save(entity));
  }

  async changeInventoryControl(
    id: number,
    inventoryControl: ProductInventoryControl,
  ): Promise<ProductSnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;
    entity.inventoryControl = inventoryControl;
    return this.toSnapshot(await this.repository.save(entity));
  }

  private toSnapshot(entity: ProductOrmEntity): ProductSnapshot {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      categoryId: entity.categoryId,
      price: entity.price,
      availablePedidosYa: entity.availablePedidosYa,
      pedidosYaPrice: entity.pedidosYaPrice,
      status: entity.status,
      available: entity.available,
      featured: entity.featured,
      preparationMode: entity.preparationMode,
      inventoryControl: entity.inventoryControl,
      imageUrl: entity.imageUrl,
      registeredAt: entity.registeredAt,
      updatedAt: entity.updatedAt,
    };
  }
}
