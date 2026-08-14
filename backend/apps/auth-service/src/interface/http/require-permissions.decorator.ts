import { SetMetadata } from '@nestjs/common';

import type { PermissionCode } from '../../domain/access/access.constants';

export const REQUIRED_PERMISSIONS_KEY = 'roma.requiredPermissions';

export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
