import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type {
  IngredientStatus,
  InventoryUnit,
  ShortagePolicy,
} from '../../../domain/inventory/inventory.models';
import { quantityTransformer, unitCostTransformer } from './numeric.transformer';

@Entity({ name: 'inv_ingredients' })
export class IngredientOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ type: 'varchar', length: 30 }) code!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ type: 'varchar', length: 80 }) category!: string;
  @Column({ name: 'base_unit', type: 'varchar', length: 10 }) baseUnit!: InventoryUnit;
  @Column({ name: 'purchase_presentation', type: 'varchar', length: 60 })
  purchasePresentation!: string;
  @Column({
    name: 'purchase_conversion_factor',
    type: 'numeric',
    precision: 16,
    scale: 4,
    transformer: quantityTransformer,
  })
  purchaseConversionFactor!: number;
  @Column({ type: 'numeric', precision: 16, scale: 4, transformer: quantityTransformer })
  stock!: number;
  @Column({ name: 'low_stock_control', type: 'boolean', default: true }) lowStockControl!: boolean;
  @Column({
    name: 'minimum_stock',
    type: 'numeric',
    precision: 16,
    scale: 4,
    transformer: quantityTransformer,
  })
  minimumStock!: number;
  @Column({ name: 'shortage_policy', type: 'varchar', length: 40 }) shortagePolicy!: ShortagePolicy;
  @Column({ name: 'economic_control', type: 'boolean', default: false }) economicControl!: boolean;
  @Column({
    name: 'average_base_unit_cost',
    type: 'numeric',
    precision: 16,
    scale: 6,
    nullable: true,
    transformer: unitCostTransformer,
  })
  averageBaseUnitCost!: number | null;
  @Column({ type: 'varchar', length: 10, default: 'Activo' }) status!: IngredientStatus;
  @CreateDateColumn({ name: 'registered_at', type: 'timestamptz' }) registeredAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @Column({ name: 'updated_by_user_id', type: 'integer' }) updatedByUserId!: number;
  @Column({ name: 'updated_by_user_name', type: 'varchar', length: 120 })
  updatedByUserName!: string;
}
