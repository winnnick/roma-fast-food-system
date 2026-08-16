import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { moneyTransformer } from './money.transformer';

@Entity({ name: 'ops_cash_sessions' })
export class CashSessionOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ type: 'varchar', length: 10 }) status!: 'Abierta' | 'Cerrada';
  @Column({ name: 'opening_user_id', type: 'integer' }) openingUserId!: number;
  @Column({ name: 'opening_user_name', type: 'varchar', length: 120 }) openingUserName!: string;
  @Column({
    name: 'initial_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: moneyTransformer,
  })
  initialAmount!: number;
  @Column({ name: 'opening_note', type: 'varchar', length: 300, nullable: true }) openingNote!:
    string | null;
  @Column({ name: 'opened_at', type: 'timestamptz' }) openedAt!: Date;
  @Column({ name: 'closing_user_id', type: 'integer', nullable: true }) closingUserId!:
    number | null;
  @Column({ name: 'closing_user_name', type: 'varchar', length: 120, nullable: true })
  closingUserName!: string | null;
  @Column({
    name: 'counted_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: moneyTransformer,
  })
  countedAmount!: number | null;
  @Column({
    name: 'expected_cash',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: moneyTransformer,
  })
  expectedCash!: number | null;
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: moneyTransformer,
  })
  difference!: number | null;
  @Column({ name: 'closing_note', type: 'varchar', length: 300, nullable: true }) closingNote!:
    string | null;
  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true }) closedAt!: Date | null;
}
