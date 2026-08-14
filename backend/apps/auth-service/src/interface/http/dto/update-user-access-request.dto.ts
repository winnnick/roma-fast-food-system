import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn } from 'class-validator';

import {
  PERMISSION_CODES,
  ROLE_CODES,
  type PermissionCode,
  type RoleCode,
} from '../../../domain/access/access.constants';

export class UpdateUserAccessRequestDto {
  @ApiProperty({ enum: [...ROLE_CODES], isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ROLE_CODES, { each: true })
  roles!: RoleCode[];

  @ApiProperty({ enum: [...PERMISSION_CODES], isArray: true })
  @IsArray()
  @IsIn(PERMISSION_CODES, { each: true })
  permisosAdicionales!: PermissionCode[];
}
