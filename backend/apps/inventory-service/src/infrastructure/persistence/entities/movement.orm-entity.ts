import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import type {
  InventoryUnit,
  MovementOrigin,
  MovementType,
} from '../../../domain/inventory/inventory.models';
import { moneyTransformer, quantityTransformer, unitCostTransformer } from './numeric.transformer';

@Entity({ name: 'inv_movements' })
export class InventoryMovementOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ name: 'ingredient_id', type: 'integer' }) ingredientId!: number;
  @Column({ name: 'ingredient_code', type: 'varchar', length: 30 }) ingredientCode!: string;
  @Column({ name: 'ingredient_name', type: 'varchar', length: 120 }) ingredientName!: string;
  @Column({ name: 'base_unit', type: 'varchar', length: 10 }) baseUnit!: InventoryUnit;
  @Column({ type: 'varchar', length: 40 }) type!: MovementType;
  @Column({ type: 'varchar', length: 30 }) origin!: MovementOrigin;
  @Column({ type: 'numeric', precision: 16, scale: 4, transformer: quantityTransformer })
  quantity!: number;
  @Column({
    name: 'classified_quantity',
    type: 'numeric',
    precision: 16,
    scale: 4,
    nullable: true,
    transformer: quantityTransformer,
  })
  classifiedQuantity!: number | null;
  @Column({
    name: 'previous_stock',
    type: 'numeric',
    precision: 16,
    scale: 4,
    transformer: quantityTransformer,
  })
  previousStock!: number;
  @Column({
    name: 'resulting_stock',
    type: 'numeric',
    precision: 16,
    scale: 4,
    transformer: quantityTransformer,
  })
  resultingStock!: number;
  @Column({ type: 'varchar', length: 220 }) reason!: string;
  @Column({ type: 'varchar', length: 120, nullable: true }) reference!: string | null;
  @Column({ name: 'sale_id', type: 'integer', nullable: true }) saleId!: number | null;
  @Column({ name: 'order_number', type: 'varchar', length: 20, nullable: true }) orderNumber!:
    string | null;
  @Column({ name: 'recipe_version_ids', type: 'integer', array: true, default: '{}' })
  recipeVersionIds!: number[];
  @Column({
    name: 'applied_unit_cost',
    type: 'numeric',
    precision: 16,
    scale: 6,
    nullable: true,
    transformer: unitCostTransformer,
  })
  appliedUnitCost!: number | null;
  @Column({
    name: 'economic_impact',
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
    transformer: moneyTransformer,
  })
  economicImpact!: number | null;
  @Column({ name: 'registered_at', type: 'timestamptz' }) registeredAt!: Date;
  @Column({ name: 'user_id', type: 'integer' }) userId!: number;
  @Column({ name: 'user_name', type: 'varchar', length: 120 }) userName!: string;
}
