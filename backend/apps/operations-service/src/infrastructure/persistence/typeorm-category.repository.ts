import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type {
  CatalogStatus,
  CategorySnapshot,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../domain/catalog/catalog.models';
import type { CategoryRepositoryPort } from '../../domain/ports/catalog.ports';
import { CategoryOrmEntity } from './entities/category.orm-entity';

@Injectable()
export class TypeOrmCategoryRepository implements CategoryRepositoryPort {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repository: Repository<CategoryOrmEntity>,
  ) {}

  async list(): Promise<CategorySnapshot[]> {
    const entities = await this.repository.find({ order: { name: 'ASC' } });
    return entities.map((entity) => this.toSnapshot(entity));
  }

  async findById(id: number): Promise<CategorySnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toSnapshot(entity) : null;
  }

  async nameExists(name: string, excludeId?: number): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', { name });

    if (excludeId !== undefined) {
      query.andWhere('category.id <> :excludeId', { excludeId });
    }

    return (await query.getCount()) > 0;
  }

  async create(input: CreateCategoryInput): Promise<CategorySnapshot> {
    const entity = this.repository.create({
      name: input.name,
      description: input.description,
      status: 'Activo',
    });
    return this.toSnapshot(await this.repository.save(entity));
  }

  async update(id: number, input: UpdateCategoryInput): Promise<CategorySnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;
    entity.name = input.name;
    entity.description = input.description;
    return this.toSnapshot(await this.repository.save(entity));
  }

  async changeStatus(id: number, status: CatalogStatus): Promise<CategorySnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;
    entity.status = status;
    return this.toSnapshot(await this.repository.save(entity));
  }

  private toSnapshot(entity: CategoryOrmEntity): CategorySnapshot {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      registeredAt: entity.registeredAt,
      updatedAt: entity.updatedAt,
    };
  }
}
