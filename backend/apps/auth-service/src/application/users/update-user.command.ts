import type { RoleCode } from '../../domain/access/access.constants';

export class UpdateUserCommand {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly fullName: string,
    public readonly primaryRole: RoleCode,
    public readonly roles: RoleCode[],
    public readonly password: string | undefined,
  ) {}
}
