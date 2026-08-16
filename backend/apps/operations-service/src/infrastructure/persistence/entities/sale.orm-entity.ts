import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type {
  DiscountType,
  PaymentMethod,
  PaymentStatus,
  PreparationStatus,
  SaleClientType,
  SalesChannel,
  SaleInventoryStatus,
} from '../../../domain/operations/operations.models';
import { moneyTransformer } from './money.transformer';
import { SaleDetailOrmEntity } from './sale-detail.orm-entity';

@Entity({ name: 'ops_sales' })
export class SaleOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ name: 'order_number', type: 'varchar', length: 20 }) orderNumber!: string;
  @Column({ name: 'sales_channel', type: 'varchar', length: 20 }) salesChannel!: SalesChannel;
  @Column({ name: 'pedidosya_reference', type: 'varchar', length: 100, nullable: true })
  pedidosYaReference!: string | null;
  @Column({ name: 'pedidosya_settlement_id', type: 'integer', nullable: true })
  pedidosYaSettlementId!: number | null;
  @Column({ name: 'pedidosya_settled_at', type: 'timestamptz', nullable: true })
  pedidosYaSettledAt!: Date | null;
  @Column({ name: 'client_type', type: 'varchar', length: 30 }) clientType!: SaleClientType;
  @Column({ name: 'client_id', type: 'integer', nullable: true }) clientId!: number | null;
  @Column({ name: 'client_name', type: 'varchar', length: 120 }) clientName!: string;
  @Column({ name: 'registered_by_user_id', type: 'integer' }) registeredByUserId!: number;
  @Column({ name: 'registered_by_user_name', type: 'varchar', length: 120 })
  registeredByUserName!: string;
  @Column({ name: 'registration_cash_session_id', type: 'integer' })
  registrationCashSessionId!: number;
  @OneToMany(() => SaleDetailOrmEntity, (detail) => detail.sale, { cascade: false })
  details!: SaleDetailOrmEntity[];
  @Column({ type: 'varchar', length: 500, nullable: true }) observations!: string | null;
  @Column({ name: 'requires_preparation', type: 'boolean' }) requiresPreparation!: boolean;
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
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: moneyTransformer })
  total!: number;
  @Column({ name: 'preparation_status', type: 'varchar', length: 30 })
  preparationStatus!: PreparationStatus;
  @Column({ name: 'payment_status', type: 'varchar', length: 30 }) paymentStatus!: PaymentStatus;
  @Column({ name: 'last_payment_id', type: 'integer', nullable: true }) lastPaymentId!:
    number | null;
  @Column({ name: 'accumulated_payment_method', type: 'varchar', length: 20, nullable: true })
  accumulatedPaymentMethod!: PaymentMethod | null;
  @Column({ name: 'cancellation_reason', type: 'varchar', length: 200, nullable: true })
  cancellationReason!: string | null;
  @Column({ name: 'inventory_status', type: 'varchar', length: 30, default: 'No integrado' })
  inventoryStatus!: SaleInventoryStatus;
  @Column({ name: 'inventory_consumption_id', type: 'integer', nullable: true })
  inventoryConsumptionId!: number | null;
  @Column({ name: 'inventory_last_error', type: 'varchar', length: 500, nullable: true })
  inventoryLastError!: string | null;
  @Column({ name: 'inventory_updated_at', type: 'timestamptz', nullable: true })
  inventoryUpdatedAt!: Date | null;
  @Column({ name: 'registered_at', type: 'timestamptz' }) registeredAt!: Date;
  @Column({ name: 'preparation_started_at', type: 'timestamptz', nullable: true })
  preparationStartedAt!: Date | null;
  @Column({ name: 'ready_at', type: 'timestamptz', nullable: true }) readyAt!: Date | null;
  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true }) deliveredAt!: Date | null;
  @Column({ name: 'delivered_by_user_id', type: 'integer', nullable: true }) deliveredByUserId!:
    number | null;
  @Column({ name: 'delivered_by_user_name', type: 'varchar', length: 120, nullable: true })
  deliveredByUserName!: string | null;
  @Column({ name: 'delivery_cash_session_id', type: 'integer', nullable: true })
  deliveryCashSessionId!: number | null;
  @Column({ name: 'fully_paid_at', type: 'timestamptz', nullable: true }) fullyPaidAt!: Date | null;
  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true }) cancelledAt!: Date | null;
  @Column({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
