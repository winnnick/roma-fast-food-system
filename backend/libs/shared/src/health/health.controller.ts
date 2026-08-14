import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Verifica que el proceso HTTP esté activo.' })
  live() {
    return this.healthService.live(process.env.SERVICE_NAME ?? 'roma-service');
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verifica que el servicio y PostgreSQL estén disponibles.' })
  ready() {
    return this.healthService.ready(process.env.SERVICE_NAME ?? 'roma-service');
  }
}
