import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ROLE_REPOSITORY, type RoleRepositoryPort } from '../../domain/ports/auth.ports';
import { ListRolesQuery } from './list-roles.query';
import { toRoleConfigurationView, type RoleConfigurationView } from './role-management.mapper';

@QueryHandler(ListRolesQuery)
export class ListRolesHandler implements IQueryHandler<ListRolesQuery, RoleConfigurationView[]> {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roles: RoleRepositoryPort,
  ) {}

  async execute(): Promise<RoleConfigurationView[]> {
    return (await this.roles.list()).map(toRoleConfigurationView);
  }
}
