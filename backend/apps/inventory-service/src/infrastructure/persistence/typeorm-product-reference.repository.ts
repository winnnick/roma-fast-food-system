import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type {
  ProductReferenceInput,
  ProductReferenceRepositoryPort,
} from '../../domain/ports/product-reference.ports';
import { ProductReferenceOrmEntity } from './entities/product-reference.orm-entity';

@Injectable()
export class TypeOrmProductReferenceRepository implements ProductReferenceRepositoryPort {
  constructor(
    @InjectRepository(ProductReferenceOrmEntity)
    private readonly repository: Repository<ProductReferenceOrmEntity>,
  ) {}

  async upsert(input: ProductReferenceInput): Promise<void> {
    const current = await this.repository.findOneBy({ productId: input.productId });

    await this.repository.save(
      this.repository.create({
        ...current,
        productId: input.productId,
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        inventoryControl: input.inventoryControl,
        status: input.status,
      }),
    );
  }
}
