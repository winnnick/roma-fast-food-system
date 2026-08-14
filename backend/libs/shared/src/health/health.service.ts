import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface ReadinessResponse extends HealthResponse {
  database: 'up';
}

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  live(serviceName: string): HealthResponse {
    return {
      status: 'ok',
      service: serviceName,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async ready(serviceName: string): Promise<ReadinessResponse> {
    await this.dataSource.query('SELECT 1');

    return {
      ...this.live(serviceName),
      database: 'up',
    };
  }
}
