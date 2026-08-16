import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { moneyTransformer } from './money.transformer';
import { SaleOrmEntity } from './sale.orm-entity';

@Entity({ name: 'ops_sale_details' })
export class SaleDetailOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ name: 'sale_id', type: 'integer' }) saleId!: number;
  @ManyToOne(() => SaleOrmEntity, (sale) => sale.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: SaleOrmEntity;
  @Column({ name: 'product_id', type: 'integer' }) productId!: number;
  @Column({ name: 'product_code', type: 'varchar', length: 20 }) productCode!: string;
  @Column({ name: 'product_name', type: 'varchar', length: 120 }) productName!: string;
  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: moneyTransformer,
  })
  unitPrice!: number;
  @Column({ type: 'integer' }) quantity!: number;
  @Column({ type: 'varchar', length: 300, nullable: true }) note!: string | null;
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: moneyTransformer })
  subtotal!: number;
  @Column({ name: 'requires_preparation', type: 'boolean' }) requiresPreparation!: boolean;
}
