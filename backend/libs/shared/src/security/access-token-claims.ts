export interface ApiAccessTokenClaims {
  sub: string;
  username: string;
  nombreCompleto: string;
  rol: string;
  roles: string[];
  permissions: string[];
  sid: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}
