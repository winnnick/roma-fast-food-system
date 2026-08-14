import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auth_refresh_sessions' })
export class RefreshSessionOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'integer' })
  userId!: number;

  @Index({ unique: true })
  @Column({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'replaced_by_session_id', type: 'uuid', nullable: true })
  replacedBySessionId!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 300, nullable: true })
  userAgent!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;
}
