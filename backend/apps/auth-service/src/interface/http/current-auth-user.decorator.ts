import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AccessTokenClaims } from '../../domain/models/auth.models';
import type { AuthenticatedRequest } from './auth-request';

export const CurrentAuthUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenClaims => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().authUser;
  },
);
