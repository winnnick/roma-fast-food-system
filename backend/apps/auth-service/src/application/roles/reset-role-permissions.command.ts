import type { RoleCode } from '../../domain/access/access.constants';

export class ResetRolePermissionsCommand {
  constructor(public readonly role: RoleCode) {}
}
