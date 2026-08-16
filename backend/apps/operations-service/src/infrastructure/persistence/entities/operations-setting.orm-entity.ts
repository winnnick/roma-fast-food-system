import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'ops_settings' })
export class OperationsSettingOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 80 }) key!: string;
  @Column({ type: 'varchar', length: 200 }) value!: string;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
