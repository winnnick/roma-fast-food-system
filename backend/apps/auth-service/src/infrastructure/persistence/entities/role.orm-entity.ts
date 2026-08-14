import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { PermissionOrmEntity } from './permission.orm-entity';

@Entity({ name: 'auth_roles' })
export class RoleOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 30 })
  code!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ type: 'varchar', length: 300 })
  description!: string;

  @Column({ type: 'boolean', default: true })
  editable!: boolean;

  @ManyToMany(() => PermissionOrmEntity)
  @JoinTable({
    name: 'auth_role_permissions',
    joinColumn: { name: 'role_code', referencedColumnName: 'code' },
    inverseJoinColumn: { name: 'permission_code', referencedColumnName: 'code' },
  })
  permissions!: PermissionOrmEntity[];
}
