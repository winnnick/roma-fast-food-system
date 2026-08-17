import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { RecipeOrmEntity } from './recipe.orm-entity';
import { quantityTransformer } from './numeric.transformer';

@Entity({ name: 'inv_recipe_items' })
export class RecipeItemOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ name: 'recipe_id', type: 'integer' }) recipeId!: number;
  @Column({ name: 'ingredient_id', type: 'integer' }) ingredientId!: number;
  @Column({ name: 'display_order', type: 'integer' }) displayOrder!: number;
  @Column({
    name: 'quantity_per_product',
    type: 'numeric',
    precision: 16,
    scale: 4,
    transformer: quantityTransformer,
  })
  quantityPerProduct!: number;
  @ManyToOne(() => RecipeOrmEntity, (recipe) => recipe.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe!: RecipeOrmEntity;
}
