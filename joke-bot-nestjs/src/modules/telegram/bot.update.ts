import { Ctx, Help, Start, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';

@Update()
export class BotUpdate {
  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      '🕵️ *Secret Agent IT Bot*\n\n' +
        'Добро пожаловать, агент!\n' +
        'Используй /help для списка команд',
      { parse_mode: 'Markdown' },
    );
  }

  @Help()
  async onHelp(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      '🕵️ *Secret Agent IT Bot*\n\n' +
        '*Шутки:*\n' +
        '🎭 /joke — случайная шутка\n' +
        '🎭 /joke agent — про многоработничество\n' +
        '🎭 /joke shad — про ШАД/MLDS/алгосы\n' +
        '📋 /jokecategories — все категории\n\n' +
        '*Статистика:*\n' +
        '📊 /stats — статистика агента\n' +
        '🏆 /top — топ агентов\n' +
        '🎖️ /rank — твой секретный ранг\n' +
        '📈 /ranks — все ранги\n\n' +
        '*Развлечения:*\n' +
        '🧙 /wisdom — мудрость ШАДовца\n' +
        '💬 /excuse — отмазка от дедлайна\n' +
        '🎱 /8ball — магический шар\n' +
        '📡 /status — статус агента\n\n' +
        '*Админ:*\n' +
        '/jokeson · /jokesoff — авто-шутки\n' +
        '/stickerson · /stickersoff — стикеры\n' +
        '/addsticker — добавить стикер\n' +
        '/interval [мин] — интервал\n' +
        '/replychance [%] — шанс ответа\n' +
        '/mode [jokes|stickers|mixed]\n' +
        '/settings — текущие настройки',
      { parse_mode: 'Markdown' },
    );
  }
}
