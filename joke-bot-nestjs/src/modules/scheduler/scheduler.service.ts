import {
    Injectable,
    Logger,
    type OnModuleDestroy,
    type OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectBot } from 'nestjs-telegraf';
import type { Telegraf } from 'telegraf';
import {
    AdminService,
    SETTINGS_UPDATED_EVENT,
    type SettingsUpdatedPayload,
} from '../admin/admin.service';
import { JokeService } from '../joke/joke.service';
import { StickerService } from '../sticker/sticker.service';
import { TopicService } from '../topic/topic.service';

const MINIMUM_INTERVAL_MS = 60_000; // 1 minute minimum

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly chatTimers = new Map<number, NodeJS.Timeout>();

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly jokeService: JokeService,
    private readonly adminService: AdminService,
    private readonly topicService: TopicService,
    private readonly stickerService: StickerService,
  ) {}

  /**
   * On startup, schedule broadcasts for all known chats based on their settings
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('🚀 Initializing dynamic scheduler...');
    const chatIds = await this.topicService.getAllChats();

    for (const chatId of chatIds) {
      await this.scheduleForChat(chatId);
    }

    this.logger.log(`✅ Scheduled ${String(chatIds.length)} chats`);
  }

  /**
   * Cleanup on shutdown
   */
  onModuleDestroy(): void {
    this.logger.log('🛑 Stopping all scheduled broadcasts...');
    for (const [chatId, timer] of this.chatTimers) {
      clearInterval(timer);
      this.logger.debug(`Cleared timer for chat ${String(chatId)}`);
    }
    this.chatTimers.clear();
  }

  /**
   * Schedule or reschedule broadcasts for a specific chat
   * Called when: 1) app starts, 2) settings change, 3) new chat discovered
   */
  async scheduleForChat(chatId: number): Promise<void> {
    // Clear existing timer if any
    this.cancelForChat(chatId);

    const settings = await this.adminService.getOrCreateSettings(chatId);

    // Don't schedule if nothing is enabled
    if (!settings.jokesEnabled && !settings.stickersEnabled) {
      this.logger.debug(`Chat ${String(chatId)}: broadcasts disabled, skipping`);
      return;
    }

    const intervalMs = Math.max(
      settings.jokesInterval * 60_000,
      MINIMUM_INTERVAL_MS,
    );

    const timer = setInterval(() => {
      void this.broadcastToChat(chatId);
    }, intervalMs);

    this.chatTimers.set(chatId, timer);
    this.logger.log(
      `⏰ Scheduled chat ${String(chatId)} every ${String(settings.jokesInterval)} min`,
    );
  }

  /**
   * Cancel scheduled broadcasts for a chat
   */
  cancelForChat(chatId: number): void {
    const existing = this.chatTimers.get(chatId);
    if (existing !== undefined) {
      clearInterval(existing);
      this.chatTimers.delete(chatId);
      this.logger.debug(`Cancelled timer for chat ${String(chatId)}`);
    }
  }

  /**
   * Reschedule a chat (called when interval or enabled state changes)
   */
  async reschedule(chatId: number): Promise<void> {
    await this.scheduleForChat(chatId);
  }

  /**
   * Event listener: automatically reschedule when settings change
   */
  @OnEvent(SETTINGS_UPDATED_EVENT)
  async onSettingsUpdated(payload: SettingsUpdatedPayload): Promise<void> {
    this.logger.log(`🔄 Settings updated for chat ${String(payload.chatId)}, rescheduling...`);
    await this.reschedule(payload.chatId);
  }

  /**
   * Broadcast to all topics in a chat
   */
  private async broadcastToChat(chatId: number): Promise<void> {
    try {
      const settings = await this.adminService.getOrCreateSettings(chatId);

      // Double-check if still enabled (settings might have changed)
      if (!settings.jokesEnabled && !settings.stickersEnabled) {
        this.cancelForChat(chatId);
        return;
      }

      const topics = await this.topicService.getTopicsForChat(chatId);
      const threadIds =
        topics.length > 0 ? topics.map((t) => t.threadId) : [undefined];

      for (const threadId of threadIds) {
        await this.broadcastToThread(chatId, threadId, settings.broadcastMode);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(
        `Failed to broadcast to chat ${String(chatId)}: ${message}`,
      );
    }
  }

  /**
   * Send content to a specific thread/topic
   */
  private async broadcastToThread(
    chatId: number,
    threadId: number | undefined,
    mode: string,
  ): Promise<void> {
    const sendJoke = mode === 'jokes' || mode === 'mixed';
    const sendSticker =
      mode === 'stickers' || (mode === 'mixed' && Math.random() > 0.5);

    const threadOpts =
      threadId !== undefined ? { message_thread_id: threadId } : {};

    if (sendSticker) {
      const sticker = await this.stickerService.getRandomSticker();
      if (sticker !== null) {
        await this.bot.telegram.sendSticker(chatId, sticker.fileId, threadOpts);
        await this.stickerService.incrementUsage(sticker);
        this.logger.log(
          `📤 Sent sticker to ${String(chatId)}/${String(threadId ?? 'main')}`,
        );
        return;
      }
    }

    if (sendJoke) {
      const joke = await this.jokeService.getRandomJoke();
      if (joke !== null) {
        await this.bot.telegram.sendMessage(
          chatId,
          `😂 ${joke.content}`,
          threadOpts,
        );
        await this.jokeService.incrementUsage(joke);
        this.logger.log(
          `📤 Sent joke to ${String(chatId)}/${String(threadId ?? 'main')}`,
        );
      }
    }
  }

  /**
   * Get current scheduling info for debugging
   */
  getScheduledChats(): number[] {
    return Array.from(this.chatTimers.keys());
  }
}
