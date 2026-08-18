import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'rpt_audit_events' })
export class AuditEventOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId!: number | null;

  @Column({ name: 'user_name', type: 'varchar', length: 160 })
  userName!: string;

  @Column({ name: 'user_role', type: 'varchar', length: 80, nullable: true })
  userRole!: string | null;

  @Column({ name: 'module', type: 'varchar', length: 100 })
  module!: string;

  @Column({ name: 'action', type: 'varchar', length: 100 })
  action!: string;

  @Column({ name: 'entity', type: 'varchar', length: 100 })
  entity!: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 160, nullable: true })
  entityId!: string | null;

  @Column({ name: 'description', type: 'varchar', length: 600 })
  description!: string;

  @Column({ name: 'previous_data', type: 'jsonb', nullable: true })
  previousData!: unknown;

  @Column({ name: 'next_data', type: 'jsonb', nullable: true })
  nextData!: unknown;

  @Column({ name: 'level', type: 'varchar', length: 30 })
  level!: string;

  @Column({ name: 'origin', type: 'varchar', length: 40 })
  origin!: string;
}
