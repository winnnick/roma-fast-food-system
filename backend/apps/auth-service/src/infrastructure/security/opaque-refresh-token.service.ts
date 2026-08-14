import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class OpaqueRefreshTokenService {
  constructor(private readonly config: ConfigService) {}

  generate(): string {
    return randomBytes(48).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  getTtlSeconds(): number {
    const raw = this.config.get<string>('REFRESH_TOKEN_TTL_SECONDS');
    const parsed = Number(raw ?? 43_200);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 43_200;
  }
}
