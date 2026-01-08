import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Joke } from '../../database/entities';
import { JokeService } from './joke.service';
import { JokeUpdate } from './joke.update';

@Module({
  imports: [TypeOrmModule.forFeature([Joke])],
  providers: [JokeService, JokeUpdate],
  exports: [JokeService],
})
export class JokeModule {}
