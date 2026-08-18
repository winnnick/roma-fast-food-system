import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class RegisterAuditEventDto {
  @IsString()
  @Length(2, 100)
  modulo!: string;

  @IsString()
  @Length(3, 100)
  accion!: string;

  @IsString()
  @Length(2, 100)
  entidad!: string;

  @IsOptional()
  entidadId?: string | number | null;

  @IsString()
  @Length(5, 600)
  descripcion!: string;

  @IsOptional()
  datosAnteriores?: unknown;

  @IsOptional()
  datosPosteriores?: unknown;

  @IsOptional()
  @IsIn(['Información', 'Advertencia', 'Crítico'])
  nivel?: 'Información' | 'Advertencia' | 'Crítico';

  @IsOptional()
  @IsIn(['Interfaz web', 'Proceso automático', 'Migración', 'Sistema'])
  origen?: 'Interfaz web' | 'Proceso automático' | 'Migración' | 'Sistema';
}

export class AuditFilterDto {
  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @IsOptional()
  @IsString()
  fechaHasta?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : undefined,
  )
  usuarioId?: number;

  @IsOptional()
  @IsString()
  modulo?: string;

  @IsOptional()
  @IsIn(['Información', 'Advertencia', 'Crítico'])
  nivel?: 'Información' | 'Advertencia' | 'Crítico';

  @IsOptional()
  @IsString()
  texto?: string;
}
