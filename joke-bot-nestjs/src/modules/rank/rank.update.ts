import { Command, Ctx, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { RankService } from './rank.service';

@Update()
export class RankUpdate {
  constructor(private readonly rankService: RankService) {}

  @Command('rank')
  async onRank(@Ctx() ctx: Context): Promise<void> {
    if (ctx.from === undefined || ctx.chat === undefined) {
      return;
    }

    const rank = await this.rankService.getUserRank(ctx.from.id, ctx.chat.id);
    if (rank === null) {
      await ctx.reply('🎖️ У вас пока нет ранга');
      return;
    }

    const emoji = rank.emoji ?? '🎖️';
    const description = rank.description ?? '';

    await ctx.reply(
      `🎖️ Ваш ранг:\n\n${emoji} ${rank.name}\n${description}`,
    );
  }

  @Command('ranks')
  async onRanks(@Ctx() ctx: Context): Promise<void> {
    const ranks = await this.rankService.getAllRanks();
    const list = ranks
      .map(r => {
        const emoji = r.emoji ?? '🎖️';
        return `${emoji} ${r.name} (${String(r.minMessages)}+ сообщений)`;
      })
      .join('\n');

    await ctx.reply(`📈 Доступные ранги:\n\n${list}`);
  }
}
