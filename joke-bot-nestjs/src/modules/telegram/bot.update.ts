import { Ctx, Help, On, Start, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';

@Update()
export class BotUpdate {
  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      '🎭 Привет! Я бот с шутками!\n\n' +
      'Используй /help для списка команд',
    );
  }

  @Help()
  async onHelp(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      '📋 Доступные команды:\n\n' +
      '🎭 /joke - получить случайную шутку\n' +
      '📊 /stats - моя статистика\n' +
      '🏆 /top - топ активных пользователей\n' +
      '🎖️ /rank - мой ранг\n' +
      '📈 /ranks - все ранги\n\n' +
      '👑 Админ команды:\n' +
      '/jokeson - включить авто-шутки\n' +
      '/jokesoff - выключить авто-шутки',
    );
  }

  @On('message')
  async onMessage(@Ctx() _ctx: Context): Promise<void> {
    // Message handling done by StatsModule
  }
}
