import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { USER_REPOSITORY, type UserRepositoryPort } from '../../domain/ports/auth.ports';
import { ListUsersQuery } from './list-users.query';
import { toManagedUserView, type ManagedUserView } from './user-management.mapper';

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery, ManagedUserView[]> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
  ) {}

  async execute(): Promise<ManagedUserView[]> {
    return (await this.users.listManaged()).map(toManagedUserView);
  }
}
