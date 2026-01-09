import { UseGuards } from '@nestjs/common';
import { Command, Ctx, Hears, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { AdminOnly } from '../../common/decorators';
import { AdminGuard } from '../../common/guards';
import { JokeService } from './joke.service';

interface MatchContext extends Context {
  match: RegExpExecArray;
}

@Update()
@UseGuards(AdminGuard)
export class JokeUpdate {
  constructor(private readonly jokeService: JokeService) {}

  @Hears(/^\/joke(?:\s+(\w+))?$/)
  async onJoke(@Ctx() ctx: MatchContext): Promise<void> {
    const category = ctx.match[1]?.toLowerCase();
    const joke = await this.jokeService.getRandomJoke(category);

    if (joke !== null) {
      await this.jokeService.incrementUsage(joke);
      const categoryLabel =
        joke.category !== 'general' ? ` [${joke.category}]` : '';
      await ctx.reply(`😂${categoryLabel} ${joke.content}`);
    } else if (category !== undefined) {
      const categories = await this.jokeService.getCategories();
      await ctx.reply(
        `😅 Нет шуток в категории "${category}".\n\n` +
          `Доступные: ${categories.join(', ')}`,
      );
    } else {
      await ctx.reply('😅 Пока нет шуток в базе. Добавьте с помощью /addjoke');
    }
  }

  @Command('jokecategories')
  async onCategories(@Ctx() ctx: Context): Promise<void> {
    const categories = await this.jokeService.getCategories();
    if (categories.length === 0) {
      await ctx.reply('📭 Нет категорий');
      return;
    }

    const categoryDescriptions: Record<string, string> = {
      agent: '🕵️ Многоработничество',
      shad: '📚 ШАД/MLDS/Алгосы',
      general: '💼 Общий IT юмор',
    };

    const list = categories
      .map((c) => `• ${categoryDescriptions[c] ?? c} — /joke ${c}`)
      .join('\n');

    await ctx.reply(`📋 Категории шуток:\n\n${list}`);
  }

  @Hears(/^\/addjoke\s+(.+)/)
  @AdminOnly()
  async onAddJoke(@Ctx() ctx: MatchContext): Promise<void> {
    const content = ctx.match[1]?.trim() ?? '';
    await this.jokeService.addJoke(content);
    await ctx.reply('✅ Шутка добавлена!');
  }

  @Command('jokes')
  @AdminOnly()
  async onJokes(@Ctx() ctx: Context): Promise<void> {
    const jokes = await this.jokeService.getAllJokes();
    if (jokes.length === 0) {
      await ctx.reply('📭 База шуток пуста');
      return;
    }

    const list = jokes
      .slice(0, 10)
      .map(
        (j, i) =>
          `${String(i + 1)}. [${j.category}] ${j.content.slice(0, 40)}...`,
      )
      .join('\n');
    await ctx.reply(`📋 Шутки (${String(jokes.length)}):\n\n${list}`);
  }

  @Command('jokestats')
  @AdminOnly()
  async onJokeStats(@Ctx() ctx: Context): Promise<void> {
    const stats = await this.jokeService.getStats();
    const categories = Object.entries(stats.byCategory)
      .map(([k, v]) => `  ${k}: ${String(v)}`)
      .join('\n');

    await ctx.reply(
      `📊 Статистика шуток:\n\n` +
        `Всего: ${String(stats.total)}\n` +
        `Использований: ${String(stats.totalUsage)}\n` +
        `По категориям:\n${categories !== '' ? categories : '  нет данных'}`,
    );
  }
}
