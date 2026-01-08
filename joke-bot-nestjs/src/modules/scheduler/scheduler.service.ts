import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import type { Telegraf } from 'telegraf';
import { AdminService } from '../admin/admin.service';
import { JokeService } from '../joke/joke.service';

@Injectable()
export class SchedulerService {
  private readonly activeChats = new Map<number, boolean>();

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly jokeService: JokeService,
    private readonly adminService: AdminService,
  ) {}

  registerChat(chatId: number): void {
    this.activeChats.set(chatId, true);
  }

  unregisterChat(chatId: number): void {
    this.activeChats.delete(chatId);
  }

  getActiveChats(): number[] {
    return Array.from(this.activeChats.keys());
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'autoJokes' })
  async handleAutoJokes(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('⏰ Running scheduled auto-jokes check...');

    for (const [chatId] of this.activeChats) {
      try {
        const settings = await this.adminService.getOrCreateSettings(chatId);
        if (!settings.jokesEnabled) {
          continue;
        }

        const joke = await this.jokeService.getRandomJoke();
        if (joke !== null) {
          await this.bot.telegram.sendMessage(chatId, `😂 ${joke.content}`);
          await this.jokeService.incrementUsage(joke);
          // eslint-disable-next-line no-console
          console.log(`📤 Sent auto-joke to chat ${String(chatId)}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        // eslint-disable-next-line no-console
        console.error(
          `Failed to send joke to chat ${String(chatId)}:`,
          message,
        );
      }
    }
  }
}
