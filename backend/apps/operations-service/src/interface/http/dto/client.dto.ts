import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpsertClientDto {
  @IsString()
  @Length(3, 120)
  nombreCompleto!: string;

  @IsOptional()
  @IsIn(['CI', 'NIT', 'Pasaporte', 'Otro'])
  tipoDocumento!: 'CI' | 'NIT' | 'Pasaporte' | 'Otro' | null;

  @IsOptional()
  @IsString()
  numeroDocumento!: string | null;

  @IsOptional()
  @IsString()
  telefono!: string | null;

  @IsOptional()
  @IsString()
  correo!: string | null;

  @IsOptional()
  @IsString()
  direccion!: string | null;

  @IsOptional()
  @IsString()
  zona?: string | null;

  @IsOptional()
  @IsString()
  referenciaDireccion?: string | null;

  @IsOptional()
  @IsString()
  ubicacionUrl?: string | null;

  @IsOptional()
  @IsString()
  indicacionesEntrega?: string | null;

  @IsOptional()
  @IsString()
  observaciones!: string | null;
}
