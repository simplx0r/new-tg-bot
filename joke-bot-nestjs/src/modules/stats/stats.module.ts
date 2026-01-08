import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageStats, User } from '../../database/entities';
import { StatsService } from './stats.service';
import { StatsUpdate } from './stats.update';

@Module({
  imports: [TypeOrmModule.forFeature([User, MessageStats])],
  providers: [StatsService, StatsUpdate],
  exports: [StatsService],
})
export class StatsModule {}
