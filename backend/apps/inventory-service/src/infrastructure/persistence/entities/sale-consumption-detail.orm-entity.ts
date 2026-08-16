import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import type { InventoryUnit } from '../../../domain/inventory/inventory.models';
import { moneyTransformer, quantityTransformer, unitCostTransformer } from './numeric.transformer';
import { SaleConsumptionOrmEntity } from './sale-consumption.orm-entity';

@Entity({ name: 'inv_sale_consumption_details' })
export class SaleConsumptionDetailOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ name: 'consumption_id', type: 'integer' }) consumptionId!: number;
  @Column({ name: 'ingredient_id', type: 'integer' }) ingredientId!: number;
  @Column({ name: 'ingredient_code', type: 'varchar', length: 30 }) ingredientCode!: string;
  @Column({ name: 'ingredient_name', type: 'varchar', length: 120 }) ingredientName!: string;
  @Column({ name: 'base_unit', type: 'varchar', length: 10 }) baseUnit!: InventoryUnit;
  @Column({
    name: 'consumed_quantity',
    type: 'numeric',
    precision: 16,
    scale: 4,
    transformer: quantityTransformer,
  })
  consumedQuantity!: number;
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
    name: 'applied_total_cost',
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
    transformer: moneyTransformer,
  })
  appliedTotalCost!: number | null;
  @Column({ name: 'recipe_version_ids', type: 'integer', array: true, default: '{}' })
  recipeVersionIds!: number[];
  @Column({ name: 'related_products', type: 'text', array: true, default: '{}' })
  relatedProducts!: string[];
  @ManyToOne(() => SaleConsumptionOrmEntity, (consumption) => consumption.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'consumption_id' })
  consumption!: SaleConsumptionOrmEntity;
}
