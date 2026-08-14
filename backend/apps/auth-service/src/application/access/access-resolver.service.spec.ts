import { describe, expect, it } from 'vitest';
import type { UserSnapshot } from '../../domain/models/auth.models';
import { AccessResolverService } from './access-resolver.service';

function baseUser(): UserSnapshot {
  const cajero = {
    code: 'Cajero' as const,
    name: 'Cajero',
    description: 'Cajero',
    editable: true,
    permissions: ['VENTAS_COBRAR' as const],
  };

  return {
    id: 2,
    username: 'cajero01',
    fullName: 'Carlos Pérez',
    passwordHash: 'irrelevante',
    status: 'Activo',
    registeredAt: new Date(),
    lastAccess: null,
    primaryRole: cajero,
    roles: [cajero],
    additionalPermissions: [],
  };
}

describe('AccessResolverService', () => {
  const service = new AccessResolverService();

  it('agrega automáticamente la dependencia del permiso granular', () => {
    const result = service.resolve(baseUser());
    expect(result.permisos).toContain('VENTAS_COBRAR');
    expect(result.permisos).toContain('VENTAS_VER');
  });

  it('mantiene Administrador como rol exclusivo y acceso completo', () => {
    const user = baseUser();
    user.primaryRole = {
      code: 'Administrador',
      name: 'Administrador',
      description: 'Administrador',
      editable: false,
      permissions: [],
    };
    user.roles = [user.primaryRole, ...user.roles];

    const result = service.resolve(user);
    expect(result.roles).toEqual(['Administrador']);
    expect(result.permisos).toContain('ROLES_GESTIONAR');
    expect(result.permisos).toContain('REPORTES_PEDIDOSYA_LIQUIDAR');
  });
});
