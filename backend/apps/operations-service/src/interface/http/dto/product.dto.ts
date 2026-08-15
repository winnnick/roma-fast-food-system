import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpsertProductDto {
  @IsString()
  @Length(3, 20)
  codigo!: string;

  @IsString()
  @Length(3, 120)
  nombre!: string;

  @IsString()
  @Length(5, 500)
  descripcion!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoriaId!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100000)
  precio!: number;

  @IsOptional()
  @IsBoolean()
  disponiblePedidosYa?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100000)
  precioPedidosYa?: number | null;

  @IsBoolean()
  destacado!: boolean;

  @IsOptional()
  @IsIn(['Requiere preparación', 'Entrega directa'])
  modoPreparacion?: 'Requiere preparación' | 'Entrega directa';

  @IsOptional()
  @IsIn(['Con receta', 'No controla inventario'])
  controlInventario?: 'Con receta' | 'No controla inventario';

  @IsOptional()
  @IsString()
  imagenUrl?: string | null;
}

export class ProductStatusDto {
  @IsIn(['Activo', 'Inactivo'])
  estado!: 'Activo' | 'Inactivo';
}

export class ProductFeaturedDto {
  @IsBoolean()
  destacado!: boolean;
}

export class ProductInventoryControlDto {
  @IsIn(['Con receta', 'No controla inventario'])
  controlInventario!: 'Con receta' | 'No controla inventario';
}
