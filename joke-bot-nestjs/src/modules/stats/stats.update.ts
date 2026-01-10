import { Command, Ctx, On, Update } from 'nestjs-telegraf';
import type { Context, NarrowedContext } from 'telegraf';
import type { Update as TelegramUpdate } from 'telegraf/types';
import { AdminService } from '../admin/admin.service';
import { JokeService } from '../joke/joke.service';
import { StickerService } from '../sticker/sticker.service';
import { TopicService } from '../topic/topic.service';
import { XP_REWARDS, XpService } from '../xp/xp.service';
import { StatsService } from './stats.service';

type MessageContext = NarrowedContext<Context, TelegramUpdate.MessageUpdate>;

@Update()
export class StatsUpdate {
  constructor(
    private readonly statsService: StatsService,
    private readonly topicService: TopicService,
    private readonly jokeService: JokeService,
    private readonly adminService: AdminService,
    private readonly xpService: XpService,
    private readonly stickerService: StickerService,
  ) {}

  @On('message')
  async onMessage(@Ctx() ctx: MessageContext): Promise<void> {
    if (ctx.from === undefined || ctx.chat === undefined) {
      return;
    }

    // Record user stats
    const user = await this.statsService.getOrCreateUser(ctx.from);
    const stats = await this.statsService.recordMessage(user.id, ctx.chat.id);

    // ─────────────────────────────────────────────────────────────
    // XP TRACKING
    // ─────────────────────────────────────────────────────────────

    // Give XP for message
    const xpResult = await this.xpService.addXp(
      user,
      ctx.chat.id,
      XP_REWARDS.message,
      'message',
    );

    // Check for level up notification
    if (xpResult.leveledUp && xpResult.newLevel !== undefined) {
      await ctx.reply(
        `🎉 *Поздравляем!* Вы достигли уровня *${String(xpResult.newLevel)}*! (+${String(XP_REWARDS.rank_up)} бонусных XP)`,
        { parse_mode: 'Markdown' },
      );
    }

    // Check achievements based on message count
    const messageCount = stats.messageCount;
    if (messageCount === 1) {
      const achievement = await this.xpService.tryUnlockAchievement(user, ctx.chat.id, 'first_message');
      if (achievement !== null) {
        await ctx.reply(`🏆 Достижение получено: ${achievement.emoji} *${achievement.name}*`, {
          parse_mode: 'Markdown',
        });
      }
    }
    if (messageCount === 10) {
      const achievement = await this.xpService.tryUnlockAchievement(user, ctx.chat.id, 'chatterbox_10');
      if (achievement !== null) {
        await ctx.reply(`🏆 Достижение получено: ${achievement.emoji} *${achievement.name}*`, {
          parse_mode: 'Markdown',
        });
      }
    }
    if (messageCount === 100) {
      const achievement = await this.xpService.tryUnlockAchievement(user, ctx.chat.id, 'chatterbox_100');
      if (achievement !== null) {
        await ctx.reply(`🏆 Достижение получено: ${achievement.emoji} *${achievement.name}*`, {
          parse_mode: 'Markdown',
        });
      }
    }
    if (messageCount === 1000) {
      const achievement = await this.xpService.tryUnlockAchievement(user, ctx.chat.id, 'chatterbox_1000');
      if (achievement !== null) {
        await ctx.reply(`🏆 Достижение получено: ${achievement.emoji} *${achievement.name}*`, {
          parse_mode: 'Markdown',
        });
      }
    }

    // Check time-based achievements (night owl / early bird)
    const hour = new Date().getHours();
    if (hour >= 2 && hour < 5) {
      const achievement = await this.xpService.tryUnlockAchievement(user, ctx.chat.id, 'night_owl');
      if (achievement !== null) {
        await ctx.reply(`🏆 Достижение получено: ${achievement.emoji} *${achievement.name}*`, {
          parse_mode: 'Markdown',
        });
      }
    }
    if (hour >= 5 && hour < 7) {
      const achievement = await this.xpService.tryUnlockAchievement(user, ctx.chat.id, 'early_bird');
      if (achievement !== null) {
        await ctx.reply(`🏆 Достижение получено: ${achievement.emoji} *${achievement.name}*`, {
          parse_mode: 'Markdown',
        });
      }
    }

    // Track topic if in forum
    const threadId = ctx.message.message_thread_id;
    if (threadId !== undefined) {
      await this.topicService.registerTopic(ctx.chat.id, threadId);
    }

    // ─────────────────────────────────────────────────────────────
    // RANDOM/CONTEXTUAL REPLY LOGIC
    // ─────────────────────────────────────────────────────────────
    const settings = await this.adminService.getOrCreateSettings(ctx.chat.id);

    // Skip if disabled or didn't pass the random check
    if (
      !settings.jokesEnabled ||
      settings.replyChance <= 0 ||
      Math.random() * 100 >= settings.replyChance
    ) {
      return;
    }

    // Import trigger system (lazy to avoid circular deps)
    const { findContextualResponse } = await import('../../common/triggers');

    // Extract text from message
    const messageText =
      'text' in ctx.message ? ctx.message.text : undefined;

    // Try contextual response first
    if (messageText !== undefined) {
      const contextualReply = findContextualResponse(messageText);
      if (contextualReply !== null) {
        await ctx.reply(contextualReply, {
          reply_parameters: { message_id: ctx.message.message_id },
        });
        return;
      }
    }

    // Fallback to random joke OR sticker based on mode
    const shouldSendSticker =
      settings.stickersEnabled &&
      (settings.broadcastMode === 'stickers' ||
        (settings.broadcastMode === 'mixed' && Math.random() > 0.5));

    if (shouldSendSticker) {
      const sticker = await this.stickerService.getRandomSticker();
      if (sticker !== null) {
        await this.stickerService.incrementUsage(sticker);
        await ctx.replyWithSticker(sticker.fileId, {
          reply_parameters: { message_id: ctx.message.message_id },
        });
        return;
      }
    }

    // Fallback to random joke
    const joke = await this.jokeService.getRandomJoke();
    if (joke !== null) {
      await this.jokeService.incrementUsage(joke);
      await ctx.reply(`😂 ${joke.content}`, {
        reply_parameters: { message_id: ctx.message.message_id },
      });
    }
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
        const medal =
          i === 0
            ? '🥇'
            : i === 1
              ? '🥈'
              : i === 2
                ? '🥉'
                : `${String(i + 1)}.`;
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
