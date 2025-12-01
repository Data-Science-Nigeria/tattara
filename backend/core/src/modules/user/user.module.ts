import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, Role, Permission } from '@/database/entities';
import { QueueModule } from '@/shared/queue/queue.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission]), QueueModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
