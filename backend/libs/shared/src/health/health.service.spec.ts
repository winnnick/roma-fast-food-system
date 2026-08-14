import { describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';

import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports the process as alive', () => {
    const dataSource = { query: vi.fn() } as unknown as DataSource;
    const service = new HealthService(dataSource);

    const result = service.live('test-service');

    expect(result.status).toBe('ok');
    expect(result.service).toBe('test-service');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('checks PostgreSQL readiness', async () => {
    const query = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
    const dataSource = { query } as unknown as DataSource;
    const service = new HealthService(dataSource);

    const result = await service.ready('test-service');

    expect(query).toHaveBeenCalledWith('SELECT 1');
    expect(result.database).toBe('up');
  });
});
