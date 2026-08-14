import type { PermissionCode, RoleCode } from '../access/access.constants';
import type {
  AccessTokenClaims,
  CreateManagedUserInput,
  ManagedUserSnapshot,
  RefreshSessionSnapshot,
  RoleSnapshot,
  SessionUser,
  UpdateManagedUserInput,
  UserSnapshot,
  UserStatus,
} from '../models/auth.models';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
export const REFRESH_SESSION_REPOSITORY = Symbol('REFRESH_SESSION_REPOSITORY');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const ACCESS_TOKEN_SERVICE = Symbol('ACCESS_TOKEN_SERVICE');

export interface UserRepositoryPort {
  findByUsername(username: string): Promise<UserSnapshot | null>;
  findById(id: number): Promise<UserSnapshot | null>;
  listManaged(): Promise<ManagedUserSnapshot[]>;
  findManagedById(id: number): Promise<ManagedUserSnapshot | null>;
  usernameExists(username: string, excludedId?: number): Promise<boolean>;
  createManaged(input: CreateManagedUserInput): Promise<ManagedUserSnapshot>;
  updateManaged(id: number, input: UpdateManagedUserInput): Promise<ManagedUserSnapshot | null>;
  updateAccess(
    id: number,
    roles: RoleCode[],
    additionalPermissions: PermissionCode[],
  ): Promise<ManagedUserSnapshot | null>;
  updateStatus(id: number, status: UserStatus): Promise<ManagedUserSnapshot | null>;
  countActiveAdministrators(): Promise<number>;
  updateLastAccess(id: number, date: Date): Promise<void>;
}

export interface RoleRepositoryPort {
  list(): Promise<RoleSnapshot[]>;
  findByCode(code: RoleCode): Promise<RoleSnapshot | null>;
  updatePermissions(code: RoleCode, permissions: PermissionCode[]): Promise<RoleSnapshot | null>;
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
  revokeAllByUserId(userId: number, revokedAt: Date): Promise<void>;
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
