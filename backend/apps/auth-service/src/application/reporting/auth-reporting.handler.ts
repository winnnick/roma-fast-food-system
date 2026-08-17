import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { RoleRepositoryPort, UserRepositoryPort } from '../../domain/ports/auth.ports';
import { ROLE_REPOSITORY, USER_REPOSITORY } from '../../domain/ports/auth.ports';
import { GetAuthReportingSnapshotQuery } from './auth-reporting.query';

export interface AuthReportingSnapshotView {
  generatedAt: string;
  users: Awaited<ReturnType<UserRepositoryPort['listManaged']>>;
  roles: Awaited<ReturnType<RoleRepositoryPort['list']>>;
}

@QueryHandler(GetAuthReportingSnapshotQuery)
export class GetAuthReportingSnapshotHandler implements IQueryHandler<
  GetAuthReportingSnapshotQuery,
  AuthReportingSnapshotView
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepositoryPort,
  ) {}

  async execute(): Promise<AuthReportingSnapshotView> {
    const [users, roles] = await Promise.all([this.users.listManaged(), this.roles.list()]);
    return { generatedAt: new Date().toISOString(), users, roles };
  }
}
