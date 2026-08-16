import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import type { CancellationTreatment } from '../../../domain/inventory/inventory.models';

class InternalSaleDetailDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productoId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class InternalEvaluateSaleInventoryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InternalSaleDetailDto)
  detalles!: InternalSaleDetailDto[];
}

export class InternalRegisterSaleConsumptionDto extends InternalEvaluateSaleInventoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ventaId!: number;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  numeroPedido!: string;

  @IsBoolean()
  autorizaSaldoNegativo!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  usuarioNombre!: string;
}

export class InternalCancellationTreatmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ventaId!: number;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  numeroPedido!: string;

  @IsIn(['Reintegrar insumos', 'Registrar como merma'])
  tratamiento!: CancellationTreatment;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  motivo!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  usuarioNombre!: string;
}
