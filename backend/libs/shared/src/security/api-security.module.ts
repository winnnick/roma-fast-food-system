import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ApiJwtAuthGuard } from './jwt-auth.guard';
import { InternalServiceGuard } from './internal-service.guard';
import { ApiPermissionsGuard } from './permissions.guard';
import { RsaJwtVerifierService } from './rsa-jwt-verifier.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [RsaJwtVerifierService, ApiJwtAuthGuard, ApiPermissionsGuard, InternalServiceGuard],
  exports: [RsaJwtVerifierService, ApiJwtAuthGuard, ApiPermissionsGuard, InternalServiceGuard],
})
export class ApiSecurityModule {}
