import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from '../../database/entities';
import { TopicService } from './topic.service';

@Module({
  imports: [TypeOrmModule.forFeature([Topic])],
  providers: [TopicService],
  exports: [TopicService],
})
export class TopicModule {}
