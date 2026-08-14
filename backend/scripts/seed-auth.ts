import { AuthDataSource } from '../apps/auth-service/src/infrastructure/database/auth-data-source';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CODES,
  ROLE_CODES,
  ROLE_DESCRIPTIONS,
  type RoleCode,
} from '../apps/auth-service/src/domain/access/access.constants';
import { PermissionOrmEntity } from '../apps/auth-service/src/infrastructure/persistence/entities/permission.orm-entity';
import { RoleOrmEntity } from '../apps/auth-service/src/infrastructure/persistence/entities/role.orm-entity';
import { UserOrmEntity } from '../apps/auth-service/src/infrastructure/persistence/entities/user.orm-entity';
import { ScryptPasswordHasher } from '../apps/auth-service/src/infrastructure/security/scrypt-password-hasher.service';

interface SeedUser {
  username: string;
  password: string;
  fullName: string;
  role: RoleCode;
  status: 'Activo' | 'Inactivo';
}

function permissionName(code: string): string {
  return code
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function main(): Promise<void> {
  await AuthDataSource.initialize();

  const permissionRepository = AuthDataSource.getRepository(PermissionOrmEntity);
  const roleRepository = AuthDataSource.getRepository(RoleOrmEntity);
  const userRepository = AuthDataSource.getRepository(UserOrmEntity);
  const passwordHasher = new ScryptPasswordHasher();

  await permissionRepository.upsert(
    PERMISSION_CODES.map((code) => ({ code, name: permissionName(code) })),
    ['code'],
  );

  for (const code of ROLE_CODES) {
    const metadata = ROLE_DESCRIPTIONS[code];
    await roleRepository.upsert(
      { code, name: metadata.name, description: metadata.description, editable: metadata.editable },
      ['code'],
    );
  }

  const allPermissions = await permissionRepository.find();
  const permissionMap = new Map(allPermissions.map((permission) => [permission.code, permission]));

  for (const code of ROLE_CODES) {
    const role = await roleRepository.findOneOrFail({
      where: { code },
      relations: { permissions: true },
    });

    if (code === 'Administrador' || role.permissions.length === 0) {
      role.permissions = DEFAULT_ROLE_PERMISSIONS[code].map((permissionCode) => {
        const permission = permissionMap.get(permissionCode);
        if (!permission) {
          throw new Error(`Permiso no encontrado durante seed: ${permissionCode}`);
        }
        return permission;
      });
      await roleRepository.save(role);
    }
  }

  const seedUsers: SeedUser[] = [
    {
      username: 'admin',
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Roma2026*',
      fullName: 'Administrador General',
      role: 'Administrador',
      status: 'Activo',
    },
    {
      username: 'cajero01',
      password: process.env.SEED_CAJERO_PASSWORD ?? 'Caja2026*',
      fullName: 'Carlos Pérez',
      role: 'Cajero',
      status: 'Activo',
    },
    {
      username: 'inventario01',
      password: process.env.SEED_INVENTARIO_PASSWORD ?? 'Stock2026*',
      fullName: 'Luis Gómez',
      role: 'Inventario',
      status: 'Activo',
    },
    {
      username: 'cajero02',
      password: process.env.SEED_CAJERO_PASSWORD ?? 'Caja2026*',
      fullName: 'María Vargas',
      role: 'Cajero',
      status: 'Activo',
    },
    {
      username: 'usuario.inactivo',
      password: process.env.SEED_INACTIVO_PASSWORD ?? 'Usuario2026*',
      fullName: 'Pedro Martínez',
      role: 'Inventario',
      status: 'Inactivo',
    },
  ];

  for (const seed of seedUsers) {
    const existing = await userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:username)', { username: seed.username })
      .getOne();

    if (existing) {
      continue;
    }

    const role = await roleRepository.findOneByOrFail({ code: seed.role });
    const user = userRepository.create({
      username: seed.username.toLowerCase(),
      fullName: seed.fullName,
      passwordHash: await passwordHasher.hash(seed.password),
      status: seed.status,
      primaryRole: role,
      roles: [role],
      additionalPermissions: [],
      lastAccess: null,
    });
    await userRepository.save(user);
  }

  console.log('Auth DB: roles, permisos y usuarios iniciales verificados.');
  await AuthDataSource.destroy();
}

void main().catch(async (error: unknown) => {
  console.error('No se pudo completar el seed de Auth.', error);
  if (AuthDataSource.isInitialized) {
    await AuthDataSource.destroy();
  }
  process.exitCode = 1;
});
