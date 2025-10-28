import { Module, Global } from '@nestjs/common';
import { RequestContext } from './request-context.service';

@Global()
@Module({
  providers: [RequestContext],
  exports: [RequestContext],
})
export class RequestContextModule {}
