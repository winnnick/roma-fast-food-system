import { describe, expect, it } from 'vitest';
import { ScryptPasswordHasher } from './scrypt-password-hasher.service';

describe('ScryptPasswordHasher', () => {
  const service = new ScryptPasswordHasher();

  it('genera un hash no reversible y valida la contraseña correcta', async () => {
    const hash = await service.hash('Roma2026*');
    expect(hash).not.toContain('Roma2026*');
    await expect(service.verify('Roma2026*', hash)).resolves.toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await service.hash('Roma2026*');
    await expect(service.verify('otra-clave', hash)).resolves.toBe(false);
  });
});
