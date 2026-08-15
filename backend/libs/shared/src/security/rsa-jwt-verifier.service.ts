import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { readFileSync } from 'node:fs';

import type { ApiAccessTokenClaims } from './access-token-claims';

@Injectable()
export class RsaJwtVerifierService {
  private readonly publicKey: Buffer;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.publicKey = readFileSync(config.getOrThrow<string>('JWT_PUBLIC_KEY_PATH'));
    this.issuer = config.get<string>('JWT_ISSUER', 'roma-fast-food-auth');
    this.audience = config.get<string>('JWT_AUDIENCE', 'roma-fast-food-api');
  }

  verify(token: string): Promise<ApiAccessTokenClaims> {
    return this.jwt.verifyAsync<ApiAccessTokenClaims>(token, {
      algorithms: ['RS256'],
      publicKey: this.publicKey,
      issuer: this.issuer,
      audience: this.audience,
    });
  }
}
