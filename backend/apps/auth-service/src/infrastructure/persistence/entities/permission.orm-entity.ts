import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auth_permissions' })
export class PermissionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;
}
