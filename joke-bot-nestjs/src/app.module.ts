import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TelegramExceptionFilter } from './common/filters';
import { AdminGuard } from './common/guards';
import { LoggingInterceptor } from './common/interceptors';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './modules/admin/admin.module';
import { FunModule } from './modules/fun/fun.module';
import { JokeModule } from './modules/joke/joke.module';
import { RankModule } from './modules/rank/rank.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { StatsModule } from './modules/stats/stats.module';
import { TelegramModule } from './modules/telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AdminModule,
    TelegramModule,
    JokeModule,
    StatsModule,
    RankModule,
    SchedulerModule,
    FunModule,
  ],
  providers: [
    // Global Guard
    {
      provide: APP_GUARD,
      useClass: AdminGuard,
    },
    // Global Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: TelegramExceptionFilter,
    },
  ],
})
export class AppModule {}
