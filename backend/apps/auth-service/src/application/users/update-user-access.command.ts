import type { PermissionCode, RoleCode } from '../../domain/access/access.constants';

export class UpdateUserAccessCommand {
  constructor(
    public readonly id: number,
    public readonly roles: RoleCode[],
    public readonly additionalPermissions: PermissionCode[],
  ) {}
}
