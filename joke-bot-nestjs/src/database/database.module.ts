import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Admin,
  ChatSettings,
  Joke,
  MessageStats,
  Rank,
  User,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/bot.db',
      entities: [User, Joke, MessageStats, Rank, ChatSettings, Admin],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      User,
      Joke,
      MessageStats,
      Rank,
      ChatSettings,
      Admin,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
