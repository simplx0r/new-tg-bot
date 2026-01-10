import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageStats, User } from '../../database/entities';
import { AdminModule } from '../admin/admin.module';
import { JokeModule } from '../joke/joke.module';
import { StickerModule } from '../sticker/sticker.module';
import { TopicModule } from '../topic/topic.module';
import { XpModule } from '../xp/xp.module';
import { StatsService } from './stats.service';
import { StatsUpdate } from './stats.update';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MessageStats]),
    TopicModule,
    JokeModule,
    AdminModule,
    StickerModule,
    forwardRef(() => XpModule),
  ],
  providers: [StatsService, StatsUpdate],
  exports: [StatsService],
})
export class StatsModule {}
