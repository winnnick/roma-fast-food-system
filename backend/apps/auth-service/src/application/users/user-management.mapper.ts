import type { ManagedUserSnapshot } from '../../domain/models/auth.models';

export interface ManagedUserView {
  id: number;
  username: string;
  nombreCompleto: string;
  rol: ManagedUserSnapshot['primaryRole'];
  roles: ManagedUserSnapshot['roles'];
  permisosAdicionales: ManagedUserSnapshot['additionalPermissions'];
  estado: ManagedUserSnapshot['status'];
  fechaRegistro: string;
  ultimoAcceso: string | null;
}

export function toManagedUserView(user: ManagedUserSnapshot): ManagedUserView {
  return {
    id: user.id,
    username: user.username,
    nombreCompleto: user.fullName,
    rol: user.primaryRole,
    roles: user.roles,
    permisosAdicionales: user.additionalPermissions,
    estado: user.status,
    fechaRegistro: user.registeredAt.toISOString(),
    ultimoAcceso: user.lastAccess?.toISOString() ?? null,
  };
}
