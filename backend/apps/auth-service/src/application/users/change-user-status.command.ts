import type { UserStatus } from '../../domain/models/auth.models';

export class ChangeUserStatusCommand {
  constructor(
    public readonly id: number,
    public readonly status: UserStatus,
    public readonly actorUserId: number,
  ) {}
}
