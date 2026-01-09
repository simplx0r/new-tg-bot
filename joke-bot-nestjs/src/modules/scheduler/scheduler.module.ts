import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from '../admin/admin.module';
import { JokeModule } from '../joke/joke.module';
import { StickerModule } from '../sticker/sticker.module';
import { TopicModule } from '../topic/topic.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => JokeModule),
    forwardRef(() => AdminModule),
    TopicModule,
    StickerModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
