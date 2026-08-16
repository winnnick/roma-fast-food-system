import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { CashMovementType, PaymentMethod } from '../../../domain/operations/operations.models';
import { moneyTransformer } from './money.transformer';

@Entity({ name: 'ops_cash_movements' })
export class CashMovementOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ name: 'cash_session_id', type: 'integer' }) cashSessionId!: number;
  @Column({ type: 'varchar', length: 10 }) type!: CashMovementType;
  @Column({ type: 'varchar', length: 160 }) concept!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: moneyTransformer })
  amount!: number;
  @Column({
    name: 'cash_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: moneyTransformer,
  })
  cashAmount!: number;
  @Column({
    name: 'qr_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: moneyTransformer,
  })
  qrAmount!: number;
  @Column({ name: 'payment_method', type: 'varchar', length: 20, nullable: true })
  paymentMethod!: PaymentMethod | null;
  @Column({ name: 'sale_id', type: 'integer', nullable: true }) saleId!: number | null;
  @Column({ name: 'order_number', type: 'varchar', length: 20, nullable: true }) orderNumber!:
    string | null;
  @Column({ name: 'user_id', type: 'integer' }) userId!: number;
  @Column({ name: 'user_name', type: 'varchar', length: 120 }) userName!: string;
  @Column({ name: 'registered_at', type: 'timestamptz' }) registeredAt!: Date;
}
