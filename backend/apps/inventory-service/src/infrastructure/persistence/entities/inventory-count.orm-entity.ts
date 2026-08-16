import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { InventoryCountDetailOrmEntity } from './inventory-count-detail.orm-entity';

@Entity({ name: 'inv_counts' })
export class InventoryCountOrmEntity {
  @PrimaryGeneratedColumn('identity') id!: number;
  @Column({ type: 'varchar', length: 400, nullable: true }) observations!: string | null;
  @Column({ name: 'registered_at', type: 'timestamptz' }) registeredAt!: Date;
  @Column({ name: 'user_id', type: 'integer' }) userId!: number;
  @Column({ name: 'user_name', type: 'varchar', length: 120 }) userName!: string;
  @OneToMany(() => InventoryCountDetailOrmEntity, (detail) => detail.count)
  details!: InventoryCountDetailOrmEntity[];
}
