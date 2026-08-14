import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ROLE_CODES, type RoleCode } from '../../../domain/access/access.constants';

export class UpdateUserRequestDto {
  @ApiProperty({ example: 'maria.fernandez' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @ApiProperty({ example: 'María Fernández' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nombreCompleto!: string;

  @ApiProperty({ enum: [...ROLE_CODES], example: 'Cajero' })
  @IsIn(ROLE_CODES)
  rol!: RoleCode;

  @ApiPropertyOptional({ enum: [...ROLE_CODES], isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ROLE_CODES, { each: true })
  roles?: RoleCode[];

  @ApiPropertyOptional({ format: 'password', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password?: string;
}
