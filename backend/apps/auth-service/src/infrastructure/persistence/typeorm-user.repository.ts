import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type { PermissionCode, RoleCode } from '../../domain/access/access.constants';
import type {
  CreateManagedUserInput,
  ManagedUserSnapshot,
  UpdateManagedUserInput,
  UserSnapshot,
  UserStatus,
} from '../../domain/models/auth.models';
import type { UserRepositoryPort } from '../../domain/ports/auth.ports';
import { mapManagedUser, mapUser } from './auth-persistence.mapper';
import { PermissionOrmEntity } from './entities/permission.orm-entity';
import { RoleOrmEntity } from './entities/role.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
    @InjectRepository(RoleOrmEntity)
    private readonly roleRepository: Repository<RoleOrmEntity>,
    @InjectRepository(PermissionOrmEntity)
    private readonly permissionRepository: Repository<PermissionOrmEntity>,
  ) {}

  findByUsername(username: string): Promise<UserSnapshot | null> {
    return this.findOne('LOWER(user.username) = LOWER(:username)', { username });
  }

  findById(id: number): Promise<UserSnapshot | null> {
    return this.findOne('user.id = :id', { id });
  }

  async listManaged(): Promise<ManagedUserSnapshot[]> {
    const entities = await this.repository.find({
      relations: {
        primaryRole: true,
        roles: true,
        additionalPermissions: true,
      },
      order: { id: 'DESC' },
    });

    return entities.map(mapManagedUser);
  }

  async findManagedById(id: number): Promise<ManagedUserSnapshot | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: {
        primaryRole: true,
        roles: true,
        additionalPermissions: true,
      },
    });

    return entity ? mapManagedUser(entity) : null;
  }

  async usernameExists(username: string, excludedId?: number): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:username)', { username });

    if (excludedId !== undefined) {
      query.andWhere('user.id <> :excludedId', { excludedId });
    }

    return (await query.getCount()) > 0;
  }

  async createManaged(input: CreateManagedUserInput): Promise<ManagedUserSnapshot> {
    const [primaryRole, roles, permissions] = await Promise.all([
      this.roleRepository.findOneByOrFail({ code: input.primaryRole }),
      this.loadRoles(input.roles),
      this.loadPermissions(input.additionalPermissions),
    ]);

    const entity = this.repository.create({
      username: input.username,
      fullName: input.fullName,
      passwordHash: input.passwordHash,
      status: 'Activo',
      primaryRole,
      roles,
      additionalPermissions: permissions,
      lastAccess: null,
    });

    const saved = await this.repository.save(entity);
    const result = await this.findManagedById(saved.id);
    if (!result) {
      throw new Error('No se pudo recuperar el usuario recién creado.');
    }
    return result;
  }

  async updateManaged(
    id: number,
    input: UpdateManagedUserInput,
  ): Promise<ManagedUserSnapshot | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: { primaryRole: true, roles: true, additionalPermissions: true },
    });
    if (!entity) {
      return null;
    }

    const [primaryRole, roles, permissions] = await Promise.all([
      this.roleRepository.findOneByOrFail({ code: input.primaryRole }),
      this.loadRoles(input.roles),
      this.loadPermissions(input.additionalPermissions),
    ]);

    entity.username = input.username;
    entity.fullName = input.fullName;
    entity.primaryRole = primaryRole;
    entity.roles = roles;
    entity.additionalPermissions = permissions;
    if (input.passwordHash) {
      entity.passwordHash = input.passwordHash;
    }

    await this.repository.save(entity);
    return this.findManagedById(id);
  }

  async updateAccess(
    id: number,
    roles: RoleCode[],
    additionalPermissions: PermissionCode[],
  ): Promise<ManagedUserSnapshot | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: { primaryRole: true, roles: true, additionalPermissions: true },
    });
    if (!entity) {
      return null;
    }

    entity.roles = await this.loadRoles(roles);
    entity.additionalPermissions = await this.loadPermissions(additionalPermissions);
    await this.repository.save(entity);
    return this.findManagedById(id);
  }

  async updateStatus(id: number, status: UserStatus): Promise<ManagedUserSnapshot | null> {
    const result = await this.repository.update({ id }, { status });
    if (!result.affected) {
      return null;
    }
    return this.findManagedById(id);
  }

  async countActiveAdministrators(): Promise<number> {
    return this.repository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('user.status = :status', { status: 'Activo' })
      .andWhere('role.code = :role', { role: 'Administrador' })
      .getCount();
  }

  async updateLastAccess(id: number, date: Date): Promise<void> {
    await this.repository.update({ id }, { lastAccess: date });
  }

  private async loadRoles(codes: RoleCode[]): Promise<RoleOrmEntity[]> {
    const roles = await this.roleRepository.findBy({ code: In(codes) });
    if (roles.length !== codes.length) {
      throw new Error('Uno o más roles no existen en la base de datos.');
    }
    return roles;
  }

  private async loadPermissions(codes: PermissionCode[]): Promise<PermissionOrmEntity[]> {
    if (codes.length === 0) {
      return [];
    }
    const permissions = await this.permissionRepository.findBy({ code: In(codes) });
    if (permissions.length !== codes.length) {
      throw new Error('Uno o más permisos no existen en la base de datos.');
    }
    return permissions;
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
