import { Injectable } from '@nestjs/common';

import {
  PERMISSION_CODES,
  PERMISSION_DEPENDENCIES,
  type PermissionCode,
  type RoleCode,
} from '../../domain/access/access.constants';
import type { SessionUser, UserSnapshot } from '../../domain/models/auth.models';

@Injectable()
export class AccessResolverService {
  normalizePermissions(input: readonly string[]): PermissionCode[] {
    const valid = new Set<PermissionCode>(
      input.filter((permission): permission is PermissionCode =>
        PERMISSION_CODES.includes(permission as PermissionCode),
      ),
    );

    let changed = true;
    while (changed) {
      changed = false;
      for (const permission of Array.from(valid)) {
        const dependency = PERMISSION_DEPENDENCIES[permission];
        if (dependency && !valid.has(dependency)) {
          valid.add(dependency);
          changed = true;
        }
      }
    }

    return PERMISSION_CODES.filter((permission) => valid.has(permission));
  }

  resolve(user: UserSnapshot): SessionUser {
    const roles = this.normalizeRoles(
      user.roles.map((role) => role.code),
      user.primaryRole.code,
    );

    const primaryRole = this.resolvePrimaryRole(roles, user.primaryRole.code);

    const permissions = roles.includes('Administrador')
      ? [...PERMISSION_CODES]
      : this.normalizePermissions([
          ...user.roles.flatMap((role) => role.permissions),
          ...user.additionalPermissions,
        ]);

    return {
      id: user.id,
      username: user.username,
      nombreCompleto: user.fullName,
      rol: primaryRole,
      roles,
      permisos: permissions,
    };
  }

  private normalizeRoles(roles: readonly RoleCode[], fallback: RoleCode): RoleCode[] {
    const unique = new Set<RoleCode>(roles.length > 0 ? roles : [fallback]);

    if (unique.has('Administrador')) {
      return ['Administrador'];
    }

    const ordered: RoleCode[] = ['Cajero', 'Inventario', 'Auxiliar'];
    const result = ordered.filter((role) => unique.has(role));
    return result.length > 0 ? result : [fallback];
  }

  private resolvePrimaryRole(roles: readonly RoleCode[], preferred: RoleCode): RoleCode {
    if (roles.includes('Administrador')) {
      return 'Administrador';
    }
    if (preferred !== 'Administrador' && roles.includes(preferred)) {
      return preferred;
    }
    if (roles.includes('Cajero')) {
      return 'Cajero';
    }
    if (roles.includes('Inventario')) {
      return 'Inventario';
    }
    return 'Auxiliar';
  }
}
