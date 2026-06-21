import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

/** Endpoint de salud para AWS ALB/ECS health checks — fuera del envelope estándar. */
@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
