import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessResolverService } from './application/access/access-resolver.service';
import { AuthSessionFactory } from './application/auth/auth-session.factory';
import { LoginHandler } from './application/auth/login.handler';
import { LogoutHandler } from './application/auth/logout.handler';
import { RefreshSessionHandler } from './application/auth/refresh-session.handler';
import {
  ACCESS_TOKEN_SERVICE,
  PASSWORD_HASHER,
  REFRESH_SESSION_REPOSITORY,
  USER_REPOSITORY,
} from './domain/ports/auth.ports';
import { PermissionOrmEntity } from './infrastructure/persistence/entities/permission.orm-entity';
import { RefreshSessionOrmEntity } from './infrastructure/persistence/entities/refresh-session.orm-entity';
import { RoleOrmEntity } from './infrastructure/persistence/entities/role.orm-entity';
import { UserOrmEntity } from './infrastructure/persistence/entities/user.orm-entity';
import { TypeOrmRefreshSessionRepository } from './infrastructure/persistence/typeorm-refresh-session.repository';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { OpaqueRefreshTokenService } from './infrastructure/security/opaque-refresh-token.service';
import { RsaAccessTokenService } from './infrastructure/security/rsa-access-token.service';
import { ScryptPasswordHasher } from './infrastructure/security/scrypt-password-hasher.service';
import { AuthController } from './interface/http/auth.controller';
import { JwtAuthGuard } from './interface/http/jwt-auth.guard';

const commandHandlers = [LoginHandler, RefreshSessionHandler, LogoutHandler];

@Module({
  imports: [
    CqrsModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      RoleOrmEntity,
      PermissionOrmEntity,
      RefreshSessionOrmEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AccessResolverService,
    AuthSessionFactory,
    OpaqueRefreshTokenService,
    JwtAuthGuard,
    ...commandHandlers,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: REFRESH_SESSION_REPOSITORY, useClass: TypeOrmRefreshSessionRepository },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    { provide: ACCESS_TOKEN_SERVICE, useClass: RsaAccessTokenService },
  ],
  exports: [JwtAuthGuard, ACCESS_TOKEN_SERVICE, AccessResolverService],
})
export class AuthModule {}
