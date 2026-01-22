import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import type { Telegraf } from 'telegraf';

/**
 * Registers bot commands with Telegram on startup
 * This makes commands appear in the autocomplete menu
 */
@Injectable()
export class BotCommandsService implements OnModuleInit {
  private readonly logger = new Logger(BotCommandsService.name);

  constructor(@InjectBot() private readonly bot: Telegraf) {}

  async onModuleInit(): Promise<void> {
    await this.registerCommands();
  }

  private async registerCommands(): Promise<void> {
    try {
      // Commands visible to all users in groups
      await this.bot.telegram.setMyCommands(
        [
          { command: 'joke', description: '🎭 Случайная шутка' },
          { command: 'jokecategories', description: '📋 Категории шуток' },
          { command: 'stats', description: '📊 Твоя статистика' },
          { command: 'top', description: '🏆 Топ агентов' },
          { command: 'rank', description: '🎖️ Секретный ранг' },
          { command: 'ranks', description: '📈 Все ранги' },
          { command: 'wisdom', description: '🧙 Мудрость ШАДовца' },
          { command: 'excuse', description: '💬 Отмазка от дедлайна' },
          { command: '8ball', description: '🎱 Магический шар' },
          { command: 'status', description: '📡 Статус агента' },
          { command: 'help', description: '❓ Список команд' },
        ],
        { scope: { type: 'all_group_chats' } },
      );

      // Admin commands visible only to administrators
      await this.bot.telegram.setMyCommands(
        [
          { command: 'joke', description: '🎭 Случайная шутка' },
          { command: 'stats', description: '📊 Твоя статистика' },
          { command: 'top', description: '🏆 Топ агентов' },
          { command: 'rank', description: '🎖️ Секретный ранг' },
          { command: 'settings', description: '⚙️ Настройки бота' },
          { command: 'jokeson', description: '✅ Включить авто-шутки' },
          { command: 'jokesoff', description: '❌ Выключить авто-шутки' },
          { command: 'stickerson', description: '✅ Включить стикеры' },
          { command: 'stickersoff', description: '❌ Выключить стикеры' },
          { command: 'addsticker', description: '➕ Добавить стикер' },
          { command: 'help', description: '❓ Список команд' },
        ],
        { scope: { type: 'all_chat_administrators' } },
      );

      // Commands for private chats
      await this.bot.telegram.setMyCommands(
        [
          { command: 'start', description: '🚀 Начать' },
          { command: 'joke', description: '🎭 Случайная шутка' },
          { command: 'wisdom', description: '🧙 Мудрость ШАДовца' },
          { command: 'excuse', description: '💬 Отмазка от дедлайна' },
          { command: '8ball', description: '🎱 Магический шар' },
          { command: 'help', description: '❓ Список команд' },
        ],
        { scope: { type: 'all_private_chats' } },
      );

      this.logger.log('✅ Bot commands registered successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to register commands: ${message}`);
    }
  }
}
