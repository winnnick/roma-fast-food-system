import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { DiscountType, PaymentMethod } from '../../../domain/operations/operations.models';
import { moneyTransformer } from './money.transformer';

@Entity({ name: 'ops_sale_payments' })
export class SalePaymentOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ name: 'cash_session_id', type: 'integer' }) cashSessionId!: number;
  @Column({ name: 'sale_id', type: 'integer' }) saleId!: number;
  @Column({ name: 'order_number', type: 'varchar', length: 20 }) orderNumber!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: moneyTransformer })
  subtotal!: number;
  @Column({ name: 'discount_type', type: 'varchar', length: 20 }) discountType!: DiscountType;
  @Column({
    name: 'discount_value',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: moneyTransformer,
  })
  discountValue!: number;
  @Column({
    name: 'discount_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: moneyTransformer,
  })
  discountAmount!: number;
  @Column({ name: 'discount_reason', type: 'varchar', length: 200, nullable: true })
  discountReason!: string | null;
  @Column({
    name: 'sale_total',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: moneyTransformer,
  })
  saleTotal!: number;
  @Column({
    name: 'applied_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: moneyTransformer,
  })
  appliedAmount!: number;
  @Column({ name: 'payment_method', type: 'varchar', length: 20 }) paymentMethod!: PaymentMethod;
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
  @Column({
    name: 'received_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: moneyTransformer,
  })
  receivedAmount!: number;
  @Column({
    name: 'change_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: moneyTransformer,
  })
  changeAmount!: number;
  @Column({ name: 'qr_reference', type: 'varchar', length: 100, nullable: true }) qrReference!:
    string | null;
  @Column({ name: 'user_id', type: 'integer' }) userId!: number;
  @Column({ name: 'user_name', type: 'varchar', length: 120 }) userName!: string;
  @Column({ name: 'paid_at', type: 'timestamptz' }) paidAt!: Date;
}
