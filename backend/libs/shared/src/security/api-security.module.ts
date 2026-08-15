import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ApiJwtAuthGuard } from './jwt-auth.guard';
import { ApiPermissionsGuard } from './permissions.guard';
import { RsaJwtVerifierService } from './rsa-jwt-verifier.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [RsaJwtVerifierService, ApiJwtAuthGuard, ApiPermissionsGuard],
  exports: [RsaJwtVerifierService, ApiJwtAuthGuard, ApiPermissionsGuard],
})
export class ApiSecurityModule {}
