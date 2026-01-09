import { Command, Ctx, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { StatsService } from '../stats/stats.service';
import { XpService } from './xp.service';

@Update()
export class XpUpdate {
  constructor(
    private readonly xpService: XpService,
    private readonly statsService: StatsService,
  ) {}

  @Command('xp')
  async onXp(@Ctx() ctx: Context): Promise<void> {
    if (ctx.from === undefined || ctx.chat === undefined) {
      return;
    }

    const user = await this.statsService.getOrCreateUser(ctx.from);
    const progress = this.xpService.getLevelProgress(user);
    const nextXp = this.xpService.getXpForNextLevel(user.level);

    const progressBar = this.renderProgressBar(progress.percent);

    let message =
      `⭐ *Ваш XP*\n\n` +
      `📊 Уровень: *${String(user.level)}*\n` +
      `💫 Всего XP: *${String(user.xpTotal)}*\n\n` +
      `${progressBar}\n`;

    if (nextXp !== null) {
      message += `📈 До уровня ${String(user.level + 1)}: ${String(progress.current)}/${String(progress.required)} XP`;
    } else {
      message += `🎉 Вы достигли максимального уровня!`;
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  @Command('achievements')
  async onAchievements(@Ctx() ctx: Context): Promise<void> {
    if (ctx.from === undefined || ctx.chat === undefined) {
      return;
    }

    const user = await this.statsService.getOrCreateUser(ctx.from);
    const userAchievements = await this.xpService.getUserAchievements(
      user.id,
      ctx.chat.id,
    );
    const allAchievements = await this.xpService.getAllAchievements();

    const unlockedCodes = new Set(userAchievements.map((ua) => ua.achievement.code));

    let message = `🏆 *Достижения* (${String(userAchievements.length)}/${String(allAchievements.length)})\n\n`;

    // Group by rarity
    const rarityOrder = ['legendary', 'epic', 'rare', 'common'];

    for (const rarity of rarityOrder) {
      const achievements = allAchievements.filter((a) => a.rarity === rarity);
      if (achievements.length === 0) continue;

      message += `${this.xpService.formatRarity(rarity)}\n`;

      for (const achievement of achievements) {
        const unlocked = unlockedCodes.has(achievement.code);
        const icon = unlocked ? achievement.emoji : '🔒';
        const name = unlocked ? achievement.name : `~~${achievement.name}~~`;
        const xp = unlocked ? ` (+${String(achievement.xpReward)} XP)` : '';
        message += `${icon} ${name}${xp}\n`;
      }
      message += '\n';
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  @Command('leaderboard')
  async onLeaderboard(@Ctx() ctx: Context): Promise<void> {
    // This will call stats service for top users by XP
    // For now, show a simple message
    await ctx.reply(
      '📊 Таблица лидеров по XP скоро будет доступна!\n\nИспользуй /top для топа по сообщениям.',
    );
  }

  private renderProgressBar(percent: number): string {
    const filled = Math.floor(percent / 10);
    const empty = 10 - filled;
    const bar = '▓'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${String(percent)}%`;
  }
}
