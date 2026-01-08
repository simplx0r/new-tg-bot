import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const token = config.get<string>('TELEGRAM_TOKEN');
        if (token === undefined || token === '') {
          throw new Error('TELEGRAM_TOKEN is required');
        }
        return { token };
      },
    }),
  ],
  providers: [BotUpdate],
  exports: [TelegrafModule],
})
export class TelegramModule {}
