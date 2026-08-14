import {
  PERMISSION_CODES,
  ROLE_CODES,
  type PermissionCode,
  type RoleCode,
} from '../../domain/access/access.constants';
import type {
  ManagedUserSnapshot,
  RefreshSessionSnapshot,
  RoleSnapshot,
  UserSnapshot,
} from '../../domain/models/auth.models';
import { PermissionOrmEntity } from './entities/permission.orm-entity';
import { RefreshSessionOrmEntity } from './entities/refresh-session.orm-entity';
import { RoleOrmEntity } from './entities/role.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';

function asRoleCode(value: string): RoleCode {
  if (!ROLE_CODES.includes(value as RoleCode)) {
    throw new Error(`Rol no reconocido en persistencia: ${value}`);
  }
  return value as RoleCode;
}

function asPermissionCode(value: string): PermissionCode {
  if (!PERMISSION_CODES.includes(value as PermissionCode)) {
    throw new Error(`Permiso no reconocido en persistencia: ${value}`);
  }
  return value as PermissionCode;
}

export function mapPermission(entity: PermissionOrmEntity): PermissionCode {
  return asPermissionCode(entity.code);
}

export function mapRole(entity: RoleOrmEntity): RoleSnapshot {
  return {
    code: asRoleCode(entity.code),
    name: entity.name,
    description: entity.description,
    editable: entity.editable,
    permissions: PERMISSION_CODES.filter((permission) =>
      (entity.permissions ?? []).some((item) => mapPermission(item) === permission),
    ),
  };
}

export function mapUser(entity: UserOrmEntity): UserSnapshot {
  return {
    id: entity.id,
    username: entity.username,
    fullName: entity.fullName,
    passwordHash: entity.passwordHash,
    status: entity.status === 'Activo' ? 'Activo' : 'Inactivo',
    registeredAt: entity.registeredAt,
    lastAccess: entity.lastAccess,
    primaryRole: mapRole(entity.primaryRole),
    roles: (entity.roles ?? []).map(mapRole),
    additionalPermissions: (entity.additionalPermissions ?? []).map(mapPermission),
  };
}

export function mapManagedUser(entity: UserOrmEntity): ManagedUserSnapshot {
  return {
    id: entity.id,
    username: entity.username,
    fullName: entity.fullName,
    status: entity.status === 'Activo' ? 'Activo' : 'Inactivo',
    registeredAt: entity.registeredAt,
    lastAccess: entity.lastAccess,
    primaryRole: asRoleCode(entity.primaryRole.code),
    roles: ROLE_CODES.filter((roleCode) =>
      (entity.roles ?? []).some((role) => asRoleCode(role.code) === roleCode),
    ),
    additionalPermissions: PERMISSION_CODES.filter((permission) =>
      (entity.additionalPermissions ?? []).some((item) => mapPermission(item) === permission),
    ),
  };
}

export function mapRefreshSession(entity: RefreshSessionOrmEntity): RefreshSessionSnapshot {
  return {
    id: entity.id,
    userId: entity.userId,
    tokenHash: entity.tokenHash,
    createdAt: entity.createdAt,
    expiresAt: entity.expiresAt,
    revokedAt: entity.revokedAt,
    replacedBySessionId: entity.replacedBySessionId,
    userAgent: entity.userAgent,
    ipAddress: entity.ipAddress,
  };
}
