import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    Achievement,
    Admin,
    ChatSettings,
    Joke,
    MessageStats,
    Rank,
    Sticker,
    Topic,
    User,
    UserAchievement,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/bot.db',
      entities: [
        Achievement,
        Admin,
        ChatSettings,
        Joke,
        MessageStats,
        Rank,
        Sticker,
        Topic,
        User,
        UserAchievement,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      Achievement,
      Admin,
      ChatSettings,
      Joke,
      MessageStats,
      Rank,
      Sticker,
      Topic,
      User,
      UserAchievement,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
