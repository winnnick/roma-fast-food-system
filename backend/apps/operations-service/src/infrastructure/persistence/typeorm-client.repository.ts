import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { ClientSnapshot, UpsertClientInput } from '../../domain/catalog/catalog.models';
import type { ClientRepositoryPort } from '../../domain/ports/catalog.ports';
import { ClientOrmEntity } from './entities/client.orm-entity';

@Injectable()
export class TypeOrmClientRepository implements ClientRepositoryPort {
  constructor(
    @InjectRepository(ClientOrmEntity)
    private readonly repository: Repository<ClientOrmEntity>,
  ) {}

  async list(): Promise<ClientSnapshot[]> {
    const entities = await this.repository.find({ order: { fullName: 'ASC' } });
    return entities.map((entity) => this.toSnapshot(entity));
  }

  async findById(id: number): Promise<ClientSnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toSnapshot(entity) : null;
  }

  async documentExists(documentNumber: string, excludeId?: number): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('client')
      .where('UPPER(client.documentNumber) = UPPER(:documentNumber)', { documentNumber });
    if (excludeId !== undefined) query.andWhere('client.id <> :excludeId', { excludeId });
    return (await query.getCount()) > 0;
  }

  async create(input: UpsertClientInput): Promise<ClientSnapshot> {
    const entity = this.repository.create({
      ...input,
      status: 'Activo',
      archived: false,
      archivedAt: null,
    });
    return this.toSnapshot(await this.repository.save(entity));
  }

  async update(id: number, input: UpsertClientInput): Promise<ClientSnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;
    Object.assign(entity, input);
    return this.toSnapshot(await this.repository.save(entity));
  }

  async changeArchived(id: number, archived: boolean): Promise<ClientSnapshot | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;
    entity.archived = archived;
    entity.status = archived ? 'Inactivo' : 'Activo';
    entity.archivedAt = archived ? new Date() : null;
    return this.toSnapshot(await this.repository.save(entity));
  }

  private toSnapshot(entity: ClientOrmEntity): ClientSnapshot {
    return {
      id: entity.id,
      fullName: entity.fullName,
      documentType: entity.documentType,
      documentNumber: entity.documentNumber,
      phone: entity.phone,
      email: entity.email,
      address: entity.address,
      zone: entity.zone,
      addressReference: entity.addressReference,
      locationUrl: entity.locationUrl,
      deliveryInstructions: entity.deliveryInstructions,
      observations: entity.observations,
      status: entity.status,
      archived: entity.archived,
      archivedAt: entity.archivedAt,
      registeredAt: entity.registeredAt,
      updatedAt: entity.updatedAt,
    };
  }
}
