import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';

@Module({
  imports: [HttpModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
