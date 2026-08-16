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
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import type {
  DiscountType,
  PaymentMethod,
  PreparationStartMode,
  PreparationStatus,
  SaleClientType,
  SalesChannel,
} from '../../../domain/operations/operations.models';

export class SaleDetailDto {
  @Type(() => Number) @IsInt() @Min(1) productoId!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) cantidad!: number;
  @IsOptional() @IsString() @MaxLength(300) observacion?: string | null;
}

export class CreateSaleDto {
  @IsOptional() @IsIn(['Local', 'PedidosYa']) canalVenta?: SalesChannel;
  @IsOptional() @IsString() @MaxLength(100) referenciaPedidosYa?: string | null;
  @IsOptional() @IsIn(['Consumidor final', 'Registrado', 'Ocasional']) tipoCliente?: SaleClientType;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) clienteId?: number | null;
  @IsOptional() @IsString() @MaxLength(120) clienteNombre?: string | null;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleDetailDto)
  detalles!: SaleDetailDto[];
  @IsOptional() @IsString() @MaxLength(500) observaciones?: string | null;
  @IsOptional() @IsBoolean() autorizaSaldoNegativo?: boolean;
}

export class PreparationStatusDto {
  @IsIn(['En cola', 'En preparación', 'Entrega directa', 'Listo', 'Entregado', 'Anulado'])
  estado!: PreparationStatus;
}
export class PreparationModeDto {
  @IsIn(['En cola', 'En preparación']) modo!: PreparationStartMode;
}
export class CancelSaleDto {
  @IsString() @MinLength(5) @MaxLength(200) motivo!: string;
  @IsOptional()
  @IsIn(['Reintegrar insumos', 'Registrar como merma'])
  tratamientoInventario?: 'Reintegrar insumos' | 'Registrar como merma';
}
export class OpenCashDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) montoInicial!: number;
  @IsOptional() @IsString() @MaxLength(300) observacion?: string | null;
}
export class ManualCashMovementDto {
  @IsIn(['Ingreso', 'Egreso']) tipo!: 'Ingreso' | 'Egreso';
  @IsString() @MinLength(3) @MaxLength(120) concepto!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) monto!: number;
}
export class CloseCashDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) montoContado!: number;
  @IsOptional() @IsString() @MaxLength(300) observacion?: string | null;
}
export class RegisterPaymentDto {
  @IsIn(['Ninguno', 'Porcentaje', 'Monto fijo']) tipoDescuento!: DiscountType;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) valorDescuento!: number;
  @IsOptional() @IsString() @MaxLength(200) motivoDescuento?: string | null;
  @IsIn(['Efectivo', 'QR', 'Mixto']) metodoPago!: PaymentMethod;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) montoQr!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) montoEfectivo!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) montoRecibido!: number;
  @IsOptional() @IsString() @MaxLength(100) referenciaQr?: string | null;
}
