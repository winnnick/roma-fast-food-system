import type { PermissionCode, RoleCode } from '../access/access.constants';

export type UserStatus = 'Activo' | 'Inactivo';

export interface RoleSnapshot {
  code: RoleCode;
  name: string;
  description: string;
  editable: boolean;
  permissions: PermissionCode[];
}

export interface UserSnapshot {
  id: number;
  username: string;
  fullName: string;
  passwordHash: string;
  status: UserStatus;
  registeredAt: Date;
  lastAccess: Date | null;
  primaryRole: RoleSnapshot;
  roles: RoleSnapshot[];
  additionalPermissions: PermissionCode[];
}

export interface ManagedUserSnapshot {
  id: number;
  username: string;
  fullName: string;
  status: UserStatus;
  registeredAt: Date;
  lastAccess: Date | null;
  primaryRole: RoleCode;
  roles: RoleCode[];
  additionalPermissions: PermissionCode[];
}

export interface CreateManagedUserInput {
  username: string;
  fullName: string;
  passwordHash: string;
  primaryRole: RoleCode;
  roles: RoleCode[];
  additionalPermissions: PermissionCode[];
}

export interface UpdateManagedUserInput {
  username: string;
  fullName: string;
  passwordHash?: string;
  primaryRole: RoleCode;
  roles: RoleCode[];
  additionalPermissions: PermissionCode[];
}

export interface SessionUser {
  id: number;
  username: string;
  nombreCompleto: string;
  rol: RoleCode;
  roles: RoleCode[];
  permisos: PermissionCode[];
}

export interface AccessTokenClaims {
  sub: string;
  username: string;
  nombreCompleto: string;
  rol: RoleCode;
  roles: RoleCode[];
  permissions: PermissionCode[];
  sid: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}

export interface RefreshSessionSnapshot {
  id: string;
  userId: number;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBySessionId: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface AuthSessionResult {
  usuario: SessionUser;
  accessToken: string;
  fechaInicio: string;
  expiresInSeconds: number;
}

export interface InternalAuthSessionResult extends AuthSessionResult {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}
