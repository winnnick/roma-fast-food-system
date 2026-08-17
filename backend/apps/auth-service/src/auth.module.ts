import { Module } from '@nestjs/common';

import { ApiSecurityModule } from '@roma/shared';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessResolverService } from './application/access/access-resolver.service';
import { AuthSessionFactory } from './application/auth/auth-session.factory';
import { LoginHandler } from './application/auth/login.handler';
import { LogoutHandler } from './application/auth/logout.handler';
import { RefreshSessionHandler } from './application/auth/refresh-session.handler';
import { ListRolesHandler } from './application/roles/list-roles.handler';
import { GetAuthReportingSnapshotHandler } from './application/reporting/auth-reporting.handler';
import { ResetRolePermissionsHandler } from './application/roles/reset-role-permissions.handler';
import { UpdateRolePermissionsHandler } from './application/roles/update-role-permissions.handler';
import { ChangeUserStatusHandler } from './application/users/change-user-status.handler';
import { CreateUserHandler } from './application/users/create-user.handler';
import { ListUsersHandler } from './application/users/list-users.handler';
import { UpdateUserAccessHandler } from './application/users/update-user-access.handler';
import { UpdateUserHandler } from './application/users/update-user.handler';
import {
  ACCESS_TOKEN_SERVICE,
  PASSWORD_HASHER,
  REFRESH_SESSION_REPOSITORY,
  ROLE_REPOSITORY,
  USER_REPOSITORY,
} from './domain/ports/auth.ports';
import { PermissionOrmEntity } from './infrastructure/persistence/entities/permission.orm-entity';
import { RefreshSessionOrmEntity } from './infrastructure/persistence/entities/refresh-session.orm-entity';
import { RoleOrmEntity } from './infrastructure/persistence/entities/role.orm-entity';
import { UserOrmEntity } from './infrastructure/persistence/entities/user.orm-entity';
import { TypeOrmRefreshSessionRepository } from './infrastructure/persistence/typeorm-refresh-session.repository';
import { TypeOrmRoleRepository } from './infrastructure/persistence/typeorm-role.repository';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { OpaqueRefreshTokenService } from './infrastructure/security/opaque-refresh-token.service';
import { RsaAccessTokenService } from './infrastructure/security/rsa-access-token.service';
import { ScryptPasswordHasher } from './infrastructure/security/scrypt-password-hasher.service';
import { AuthController } from './interface/http/auth.controller';
import { JwtAuthGuard } from './interface/http/jwt-auth.guard';
import { PermissionsGuard } from './interface/http/permissions.guard';
import { RolesController } from './interface/http/roles.controller';
import { UsersController } from './interface/http/users.controller';
import { AuthInternalReportingController } from './interface/http/internal-reporting.controller';

const commandHandlers = [
  LoginHandler,
  RefreshSessionHandler,
  LogoutHandler,
  CreateUserHandler,
  UpdateUserHandler,
  UpdateUserAccessHandler,
  ChangeUserStatusHandler,
  UpdateRolePermissionsHandler,
  ResetRolePermissionsHandler,
];

const queryHandlers = [ListUsersHandler, ListRolesHandler, GetAuthReportingSnapshotHandler];

@Module({
  imports: [
    CqrsModule,
    JwtModule.register({}),
    ApiSecurityModule,
    TypeOrmModule.forFeature([
      UserOrmEntity,
      RoleOrmEntity,
      PermissionOrmEntity,
      RefreshSessionOrmEntity,
    ]),
  ],
  controllers: [AuthController, UsersController, RolesController, AuthInternalReportingController],
  providers: [
    AccessResolverService,
    AuthSessionFactory,
    OpaqueRefreshTokenService,
    JwtAuthGuard,
    PermissionsGuard,
    ...commandHandlers,
    ...queryHandlers,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    { provide: REFRESH_SESSION_REPOSITORY, useClass: TypeOrmRefreshSessionRepository },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    { provide: ACCESS_TOKEN_SERVICE, useClass: RsaAccessTokenService },
  ],
  exports: [JwtAuthGuard, PermissionsGuard, ACCESS_TOKEN_SERVICE, AccessResolverService],
})
export class AuthModule {}
