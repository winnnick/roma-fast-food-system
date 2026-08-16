import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import type {
  CancellationTreatment,
  IngredientStatus,
  InventoryUnit,
  ShortagePolicy,
} from '../../../domain/inventory/inventory.models';

export class UpsertIngredientDto {
  @IsString() @MinLength(2) @MaxLength(30) codigo!: string;
  @IsString() @MinLength(2) @MaxLength(120) nombre!: string;
  @IsString() @MinLength(2) @MaxLength(80) categoria!: string;
  @IsIn(['g', 'ml', 'unidad']) unidadBase!: InventoryUnit;
  @IsString() @MinLength(1) @MaxLength(60) presentacionCompra!: string;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  factorConversionCompra!: number;
  @IsBoolean() controlarStockBajo!: boolean;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) stockMinimo!: number;
  @IsIn(['Permitir con advertencia', 'Bloquear']) politicaFaltante!: ShortagePolicy;
  @IsBoolean() controlEconomico!: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  costoPorPresentacionActual?: number | null;
}

export class CreateIngredientDto extends UpsertIngredientDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) stockInicialCompra!: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  costoPorPresentacionInicial?: number | null;
}

export class IngredientStatusDto {
  @IsIn(['Activo', 'Inactivo']) estado!: IngredientStatus;
}

export class InventoryEntryDto {
  @Type(() => Number) @IsInt() @Min(1) insumoId!: number;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  cantidadPresentaciones!: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) costoTotal?:
    number | null;
  @IsOptional() @IsString() @MaxLength(120) referencia?: string | null;
  @IsString() @MinLength(5) @MaxLength(200) motivo!: string;
}

export class InventoryAdjustmentDto {
  @Type(() => Number) @IsInt() @Min(1) insumoId!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 4 }) cantidadAjuste!: number;
  @IsString() @MinLength(5) @MaxLength(200) motivo!: string;
}

export class RecipeIngredientDto {
  @Type(() => Number) @IsInt() @Min(1) insumoId!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001) cantidadPorProducto!: number;
}

export class SaveRecipeDto {
  @Type(() => Number) @IsInt() @Min(1) productoId!: number;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredientes!: RecipeIngredientDto[];
}

export class SaleInventoryDetailDto {
  @Type(() => Number) @IsInt() @Min(1) productoId!: number;
  @Type(() => Number) @IsInt() @Min(1) cantidad!: number;
}

export class EvaluateSaleInventoryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleInventoryDetailDto)
  detalles!: SaleInventoryDetailDto[];
}

export class RegisterSaleConsumptionDto extends EvaluateSaleInventoryDto {
  @Type(() => Number) @IsInt() @Min(1) ventaId!: number;
  @IsString() @MinLength(4) @MaxLength(20) numeroPedido!: string;
  @IsBoolean() autorizaSaldoNegativo!: boolean;
}

export class CancellationTreatmentDto {
  @Type(() => Number) @IsInt() @Min(1) ventaId!: number;
  @IsString() @MinLength(4) @MaxLength(20) numeroPedido!: string;
  @IsIn(['Reintegrar insumos', 'Registrar como merma']) tratamiento!: CancellationTreatment;
  @IsString() @MinLength(5) @MaxLength(200) motivo!: string;
}

export class InventoryCountDetailDto {
  @Type(() => Number) @IsInt() @Min(1) insumoId!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) stockFisico!: number;
  @IsString() @MinLength(3) @MaxLength(200) motivo!: string;
}

export class RegisterInventoryCountDto {
  @IsOptional() @IsString() @MaxLength(400) observaciones?: string | null;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InventoryCountDetailDto)
  detalles!: InventoryCountDetailDto[];
}
