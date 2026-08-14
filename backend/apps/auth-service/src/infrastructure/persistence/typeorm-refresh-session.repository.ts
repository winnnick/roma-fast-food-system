import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import type { RefreshSessionSnapshot } from '../../domain/models/auth.models';
import type { RefreshSessionRepositoryPort } from '../../domain/ports/auth.ports';
import { mapRefreshSession } from './auth-persistence.mapper';
import { RefreshSessionOrmEntity } from './entities/refresh-session.orm-entity';

@Injectable()
export class TypeOrmRefreshSessionRepository implements RefreshSessionRepositoryPort {
  constructor(
    @InjectRepository(RefreshSessionOrmEntity)
    private readonly repository: Repository<RefreshSessionOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(session: RefreshSessionSnapshot): Promise<void> {
    await this.repository.insert(session);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshSessionSnapshot | null> {
    const entity = await this.repository.findOne({ where: { tokenHash } });
    return entity ? mapRefreshSession(entity) : null;
  }

  async rotate(
    currentSessionId: string,
    replacement: RefreshSessionSnapshot,
    revokedAt: Date,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RefreshSessionOrmEntity);
      const current = await repository.findOne({
        where: { id: currentSessionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!current || current.revokedAt) {
        throw new Error('La sesión ya no está disponible para rotación.');
      }

      current.revokedAt = revokedAt;
      current.replacedBySessionId = replacement.id;

      await repository.save(current);
      await repository.insert(replacement);
    });
  }

  async revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(RefreshSessionOrmEntity)
      .set({ revokedAt })
      .where('token_hash = :tokenHash', { tokenHash })
      .andWhere('revoked_at IS NULL')
      .execute();
  }
}
