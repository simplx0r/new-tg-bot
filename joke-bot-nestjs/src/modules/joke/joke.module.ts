import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Joke } from '../../database/entities';
import { AdminModule } from '../admin/admin.module';
import { JokeService } from './joke.service';
import { JokeUpdate } from './joke.update';

@Module({
  imports: [TypeOrmModule.forFeature([Joke]), AdminModule],
  providers: [JokeService, JokeUpdate],
  exports: [JokeService],
})
export class JokeModule {}
