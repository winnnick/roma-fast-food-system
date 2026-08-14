import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { UserSnapshot } from '../../domain/models/auth.models';
import type { UserRepositoryPort } from '../../domain/ports/auth.ports';
import { mapUser } from './auth-persistence.mapper';
import { UserOrmEntity } from './entities/user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  findByUsername(username: string): Promise<UserSnapshot | null> {
    return this.findOne('LOWER(user.username) = LOWER(:username)', { username });
  }

  findById(id: number): Promise<UserSnapshot | null> {
    return this.findOne('user.id = :id', { id });
  }

  async updateLastAccess(id: number, date: Date): Promise<void> {
    await this.repository.update({ id }, { lastAccess: date });
  }

  private async findOne(
    condition: string,
    parameters: Record<string, string | number>,
  ): Promise<UserSnapshot | null> {
    const entity = await this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.primaryRole', 'primaryRole')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'rolePermissions')
      .leftJoinAndSelect('user.additionalPermissions', 'additionalPermissions')
      .where(condition, parameters)
      .getOne();

    return entity ? mapUser(entity) : null;
  }
}
