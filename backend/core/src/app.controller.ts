import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators';

@Controller()
export class AppController {
  constructor() {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
