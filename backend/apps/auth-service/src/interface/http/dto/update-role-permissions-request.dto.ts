import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn } from 'class-validator';

import { PERMISSION_CODES, type PermissionCode } from '../../../domain/access/access.constants';

export class UpdateRolePermissionsRequestDto {
  @ApiProperty({ enum: [...PERMISSION_CODES], isArray: true })
  @IsArray()
  @IsIn(PERMISSION_CODES, { each: true })
  permisos!: PermissionCode[];
}
