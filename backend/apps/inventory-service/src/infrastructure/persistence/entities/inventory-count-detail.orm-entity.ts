import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import type { InventoryUnit } from '../../../domain/inventory/inventory.models';
import { moneyTransformer, quantityTransformer, unitCostTransformer } from './numeric.transformer';
import { InventoryCountOrmEntity } from './inventory-count.orm-entity';

@Entity({ name: 'inv_count_details' })
export class InventoryCountDetailOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ name: 'count_id', type: 'integer' }) countId!: number;
  @Column({ name: 'ingredient_id', type: 'integer' }) ingredientId!: number;
  @Column({ name: 'ingredient_code', type: 'varchar', length: 30 }) ingredientCode!: string;
  @Column({ name: 'ingredient_name', type: 'varchar', length: 120 }) ingredientName!: string;
  @Column({ name: 'base_unit', type: 'varchar', length: 10 }) baseUnit!: InventoryUnit;
  @Column({
    name: 'theoretical_stock',
    type: 'numeric',
    precision: 16,
    scale: 4,
    transformer: quantityTransformer,
  })
  theoreticalStock!: number;
  @Column({
    name: 'physical_stock',
    type: 'numeric',
    precision: 16,
    scale: 4,
    transformer: quantityTransformer,
  })
  physicalStock!: number;
  @Column({ type: 'numeric', precision: 16, scale: 4, transformer: quantityTransformer })
  variation!: number;
  @Column({ type: 'varchar', length: 220 }) reason!: string;
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
  @ManyToOne(() => InventoryCountOrmEntity, (count) => count.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'count_id' })
  count!: InventoryCountOrmEntity;
}
