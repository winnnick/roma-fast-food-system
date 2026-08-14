import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PermissionOrmEntity } from './permission.orm-entity';
import { RoleOrmEntity } from './role.orm-entity';

@Entity({ name: 'auth_users' })
export class UserOrmEntity {
  @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  username!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 10, default: 'Activo' })
  status!: string;

  @ManyToOne(() => RoleOrmEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'primary_role_code', referencedColumnName: 'code' })
  primaryRole!: RoleOrmEntity;

  @ManyToMany(() => RoleOrmEntity)
  @JoinTable({
    name: 'auth_user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_code', referencedColumnName: 'code' },
  })
  roles!: RoleOrmEntity[];

  @ManyToMany(() => PermissionOrmEntity)
  @JoinTable({
    name: 'auth_user_permissions',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_code', referencedColumnName: 'code' },
  })
  additionalPermissions!: PermissionOrmEntity[];

  @CreateDateColumn({ name: 'registered_at', type: 'timestamptz' })
  registeredAt!: Date;

  @Column({ name: 'last_access', type: 'timestamptz', nullable: true })
  lastAccess!: Date | null;
}
