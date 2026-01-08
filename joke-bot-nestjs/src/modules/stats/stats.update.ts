import { Command, Ctx, On, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { StatsService } from './stats.service';

@Update()
export class StatsUpdate {
  constructor(private readonly statsService: StatsService) {}

  @On('message')
  async onMessage(@Ctx() ctx: Context): Promise<void> {
    if (ctx.from === undefined || ctx.chat === undefined) {
      return;
    }

    const user = await this.statsService.getOrCreateUser(ctx.from);
    await this.statsService.recordMessage(user.id, ctx.chat.id);
  }

  @Command('stats')
  async onStats(@Ctx() ctx: Context): Promise<void> {
    if (ctx.from === undefined || ctx.chat === undefined) {
      return;
    }

    const data = await this.statsService.getUserStats(ctx.from.id, ctx.chat.id);
    if (data?.stats === undefined || data.stats === null) {
      await ctx.reply('📊 У вас пока нет статистики');
      return;
    }

    await ctx.reply(
      `📊 Ваша статистика:\n\n` +
      `👤 ${data.user.displayName}\n` +
      `💬 Сообщений: ${String(data.stats.messageCount)}`,
    );
  }

  @Command('top')
  async onTop(@Ctx() ctx: Context): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }

    const top = await this.statsService.getTopUsers(ctx.chat.id);
    if (top.length === 0) {
      await ctx.reply('🏆 Пока нет данных');
      return;
    }

    const list = top
      .map((s, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${String(i + 1)}.`;
        const name = s.user.displayName;
        return `${medal} ${name}: ${String(s.messageCount)}`;
      })
      .join('\n');

    await ctx.reply(`🏆 Топ пользователей:\n\n${list}`);
  }

  @Command('summary')
  async onSummary(@Ctx() ctx: Context): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }

    const summary = await this.statsService.getChatSummary(ctx.chat.id);
    const topName = summary.topUser?.displayName ?? 'нет';

    await ctx.reply(
      `📈 Сводка чата:\n\n` +
      `👥 Пользователей: ${String(summary.totalUsers)}\n` +
      `💬 Сообщений: ${String(summary.totalMessages)}\n` +
      `🏆 Лидер: ${topName} (${String(summary.topCount)})`,
    );
  }
}
