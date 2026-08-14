import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username!: string;

  @ApiProperty({ example: 'Roma2026*', format: 'password' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string;
}
