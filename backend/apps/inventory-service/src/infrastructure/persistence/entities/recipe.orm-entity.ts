import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import type { RecipeStatus } from '../../../domain/inventory/inventory.models';
import { RecipeItemOrmEntity } from './recipe-item.orm-entity';

@Entity({ name: 'inv_recipes' })
export class RecipeOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ name: 'product_id', type: 'integer' }) productId!: number;
  @Column({ name: 'product_code', type: 'varchar', length: 20 }) productCode!: string;
  @Column({ name: 'product_name', type: 'varchar', length: 120 }) productName!: string;
  @Column({ type: 'integer' }) version!: number;
  @Column({ type: 'varchar', length: 12 }) status!: RecipeStatus;
  @Column({ name: 'valid_from', type: 'timestamptz' }) validFrom!: Date;
  @Column({ name: 'valid_until', type: 'timestamptz', nullable: true }) validUntil!: Date | null;
  @Column({ name: 'registered_by_user_id', type: 'integer' }) registeredByUserId!: number;
  @Column({ name: 'registered_by_user_name', type: 'varchar', length: 120 })
  registeredByUserName!: string;
  @OneToMany(() => RecipeItemOrmEntity, (item) => item.recipe) items!: RecipeItemOrmEntity[];
}
