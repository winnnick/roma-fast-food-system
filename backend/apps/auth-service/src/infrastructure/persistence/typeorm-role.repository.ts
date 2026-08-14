import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type { PermissionCode, RoleCode } from '../../domain/access/access.constants';
import type { RoleSnapshot } from '../../domain/models/auth.models';
import type { RoleRepositoryPort } from '../../domain/ports/auth.ports';
import { mapRole } from './auth-persistence.mapper';
import { PermissionOrmEntity } from './entities/permission.orm-entity';
import { RoleOrmEntity } from './entities/role.orm-entity';

@Injectable()
export class TypeOrmRoleRepository implements RoleRepositoryPort {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly roleRepository: Repository<RoleOrmEntity>,
    @InjectRepository(PermissionOrmEntity)
    private readonly permissionRepository: Repository<PermissionOrmEntity>,
  ) {}

  async list(): Promise<RoleSnapshot[]> {
    const roles = await this.roleRepository.find({
      relations: { permissions: true },
      order: { code: 'ASC' },
    });
    return roles.map(mapRole);
  }

  async findByCode(code: RoleCode): Promise<RoleSnapshot | null> {
    const role = await this.roleRepository.findOne({
      where: { code },
      relations: { permissions: true },
    });
    return role ? mapRole(role) : null;
  }

  async updatePermissions(
    code: RoleCode,
    permissions: PermissionCode[],
  ): Promise<RoleSnapshot | null> {
    const role = await this.roleRepository.findOne({
      where: { code },
      relations: { permissions: true },
    });
    if (!role) {
      return null;
    }

    role.permissions =
      permissions.length === 0
        ? []
        : await this.permissionRepository.findBy({ code: In(permissions) });

    if (role.permissions.length !== permissions.length) {
      throw new Error('Uno o más permisos no existen en la base de datos.');
    }

    await this.roleRepository.save(role);
    return this.findByCode(code);
  }
}
