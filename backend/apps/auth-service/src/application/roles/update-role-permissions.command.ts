import type { PermissionCode, RoleCode } from '../../domain/access/access.constants';

export class UpdateRolePermissionsCommand {
  constructor(
    public readonly role: RoleCode,
    public readonly permissions: PermissionCode[],
  ) {}
}
