import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import type {
  CancellationTreatment,
  ConsumptionStatus,
} from '../../../domain/inventory/inventory.models';
import { SaleConsumptionDetailOrmEntity } from './sale-consumption-detail.orm-entity';

@Entity({ name: 'inv_sale_consumptions' })
export class SaleConsumptionOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ name: 'sale_id', type: 'integer', unique: true }) saleId!: number;
  @Column({ name: 'order_number', type: 'varchar', length: 20 }) orderNumber!: string;
  @Column({ type: 'varchar', length: 40 }) status!: ConsumptionStatus;
  @Column({ name: 'authorized_negative_balance', type: 'boolean', default: false })
  authorizedNegativeBalance!: boolean;
  @Column({ name: 'registered_at', type: 'timestamptz' }) registeredAt!: Date;
  @Column({ name: 'treatment_at', type: 'timestamptz', nullable: true }) treatmentAt!: Date | null;
  @Column({ name: 'cancellation_treatment', type: 'varchar', length: 40, nullable: true })
  cancellationTreatment!: CancellationTreatment | null;
  @Column({ name: 'treatment_reason', type: 'varchar', length: 220, nullable: true })
  treatmentReason!: string | null;
  @Column({ name: 'registered_by_user_id', type: 'integer' }) registeredByUserId!: number;
  @Column({ name: 'registered_by_user_name', type: 'varchar', length: 120 })
  registeredByUserName!: string;
  @Column({ name: 'treatment_by_user_id', type: 'integer', nullable: true }) treatmentByUserId!:
    number | null;
  @Column({ name: 'treatment_by_user_name', type: 'varchar', length: 120, nullable: true })
  treatmentByUserName!: string | null;
  @OneToMany(() => SaleConsumptionDetailOrmEntity, (detail) => detail.consumption)
  details!: SaleConsumptionDetailOrmEntity[];
}
