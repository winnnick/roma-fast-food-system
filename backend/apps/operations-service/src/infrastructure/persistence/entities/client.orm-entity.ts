import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'ops_clients' })
export class ClientOrmEntity {
  @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 20, nullable: true })
  documentType!: 'CI' | 'NIT' | 'Pasaporte' | 'Otro' | null;

  @Column({ name: 'document_number', type: 'varchar', length: 30, nullable: true })
  documentNumber!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 220, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  zone!: string | null;

  @Column({ name: 'address_reference', type: 'varchar', length: 180, nullable: true })
  addressReference!: string | null;

  @Column({ name: 'location_url', type: 'varchar', length: 500, nullable: true })
  locationUrl!: string | null;

  @Column({ name: 'delivery_instructions', type: 'varchar', length: 300, nullable: true })
  deliveryInstructions!: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  observations!: string | null;

  @Column({ type: 'varchar', length: 10, default: 'Activo' })
  status!: 'Activo' | 'Inactivo';

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @CreateDateColumn({ name: 'registered_at', type: 'timestamptz' })
  registeredAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
