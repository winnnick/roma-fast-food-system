import type {
  AccessTokenClaims,
  RefreshSessionSnapshot,
  SessionUser,
  UserSnapshot,
} from '../models/auth.models';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const REFRESH_SESSION_REPOSITORY = Symbol('REFRESH_SESSION_REPOSITORY');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const ACCESS_TOKEN_SERVICE = Symbol('ACCESS_TOKEN_SERVICE');

export interface UserRepositoryPort {
  findByUsername(username: string): Promise<UserSnapshot | null>;
  findById(id: number): Promise<UserSnapshot | null>;
  updateLastAccess(id: number, date: Date): Promise<void>;
}

export interface RefreshSessionRepositoryPort {
  create(session: RefreshSessionSnapshot): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshSessionSnapshot | null>;
  rotate(
    currentSessionId: string,
    replacement: RefreshSessionSnapshot,
    revokedAt: Date,
  ): Promise<void>;
  revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<void>;
}

export interface PasswordHasherPort {
  hash(password: string): Promise<string>;
  verify(password: string, encodedHash: string): Promise<boolean>;
}

export interface AccessTokenServicePort {
  issue(user: SessionUser, sessionId: string): Promise<string>;
  verify(token: string): Promise<AccessTokenClaims>;
  getAccessTtlSeconds(): number;
}
