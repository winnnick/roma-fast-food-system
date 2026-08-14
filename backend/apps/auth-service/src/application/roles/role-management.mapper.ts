import type { RoleSnapshot } from '../../domain/models/auth.models';

export interface RoleConfigurationView {
  rol: RoleSnapshot['code'];
  nombre: string;
  descripcion: string;
  editable: boolean;
  permisos: RoleSnapshot['permissions'];
}

export function toRoleConfigurationView(role: RoleSnapshot): RoleConfigurationView {
  return {
    rol: role.code,
    nombre: role.name,
    descripcion: role.description,
    editable: role.editable,
    permisos: role.permissions,
  };
}
