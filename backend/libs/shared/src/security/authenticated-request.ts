import type { Request } from 'express';

import type { ApiAccessTokenClaims } from './access-token-claims';

export interface AuthenticatedApiRequest extends Request {
  authUser?: ApiAccessTokenClaims;
}
