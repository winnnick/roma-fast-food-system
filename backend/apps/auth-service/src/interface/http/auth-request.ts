import type { Request } from 'express';
import type { AccessTokenClaims } from '../../domain/models/auth.models';

export interface AuthenticatedRequest extends Request {
  authUser: AccessTokenClaims;
}
