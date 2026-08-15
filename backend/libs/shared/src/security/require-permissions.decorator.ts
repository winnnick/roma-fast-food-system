import { SetMetadata } from '@nestjs/common';

export const API_REQUIRED_PERMISSIONS_KEY = 'roma.api.requiredPermissions';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(API_REQUIRED_PERMISSIONS_KEY, permissions);
