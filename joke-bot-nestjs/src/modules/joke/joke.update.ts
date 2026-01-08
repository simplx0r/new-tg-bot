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

  @Command('joke')
  async onJoke(@Ctx() ctx: Context): Promise<void> {
    const joke = await this.jokeService.getRandomJoke();
    if (joke !== null) {
      await this.jokeService.incrementUsage(joke);
      await ctx.reply(`😂 ${joke.content}`);
    } else {
      await ctx.reply('😅 Пока нет шуток в базе. Добавьте с помощью /addjoke');
    }
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
      .map((j, i) => `${String(i + 1)}. ${j.content.slice(0, 50)}...`)
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
