import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type ValueTransformer,
} from 'typeorm';

const moneyTransformer: ValueTransformer = {
  to(value: number | null): number | null {
    return value === null ? null : Number(value.toFixed(2));
  },
  from(value: string | number | null): number | null {
    return value === null ? null : Number(value);
  },
};

@Entity({ name: 'ops_products' })
export class ProductOrmEntity {
  @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column({ type: 'varchar', length: 20 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  @Column({ name: 'category_id', type: 'integer' })
  categoryId!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: moneyTransformer })
  price!: number;

  @Column({ name: 'available_pedidosya', type: 'boolean', default: false })
  availablePedidosYa!: boolean;

  @Column({
    name: 'pedidosya_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: moneyTransformer,
  })
  pedidosYaPrice!: number | null;

  @Column({ type: 'varchar', length: 10, default: 'Activo' })
  status!: 'Activo' | 'Inactivo';

  @Column({ type: 'boolean', default: true })
  available!: boolean;

  @Column({ type: 'boolean', default: false })
  featured!: boolean;

  @Column({ name: 'preparation_mode', type: 'varchar', length: 30 })
  preparationMode!: 'Requiere preparación' | 'Entrega directa';

  @Column({ name: 'inventory_control', type: 'varchar', length: 30 })
  inventoryControl!: 'Con receta' | 'No controla inventario';

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @CreateDateColumn({ name: 'registered_at', type: 'timestamptz' })
  registeredAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
