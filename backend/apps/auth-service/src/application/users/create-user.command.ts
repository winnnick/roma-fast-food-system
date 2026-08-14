import type { RoleCode } from '../../domain/access/access.constants';

export class CreateUserCommand {
  constructor(
    public readonly username: string,
    public readonly fullName: string,
    public readonly primaryRole: RoleCode,
    public readonly roles: RoleCode[],
    public readonly password: string,
  ) {}
}
