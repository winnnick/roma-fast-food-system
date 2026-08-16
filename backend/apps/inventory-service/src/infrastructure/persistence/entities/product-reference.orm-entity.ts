import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'inv_product_refs' })
export class ProductReferenceOrmEntity {
  @PrimaryColumn({ name: 'product_id', type: 'integer' }) productId!: number;
  @Column({ type: 'varchar', length: 20 }) code!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ name: 'inventory_control', type: 'varchar', length: 30 }) inventoryControl!:
    'Con receta' | 'No controla inventario';
  @Column({ type: 'varchar', length: 10 }) status!: 'Activo' | 'Inactivo';
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
