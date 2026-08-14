import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import type { UserStatus } from '../../../domain/models/auth.models';

const USER_STATUSES = ['Activo', 'Inactivo'] as const;

export class ChangeUserStatusRequestDto {
  @ApiProperty({ enum: [...USER_STATUSES] })
  @IsIn(USER_STATUSES)
  estado!: UserStatus;
}
