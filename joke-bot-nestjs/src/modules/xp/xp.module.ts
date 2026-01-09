import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement, User, UserAchievement } from '../../database/entities';
import { StatsModule } from '../stats/stats.module';
import { XpService } from './xp.service';
import { XpUpdate } from './xp.update';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Achievement, UserAchievement]),
    forwardRef(() => StatsModule),
  ],
  providers: [XpService, XpUpdate],
  exports: [XpService],
})
export class XpModule {}
