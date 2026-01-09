import {
    Injectable,
    Logger,
    type CanActivate,
    type ExecutionContext,
} from '@nestjs/common';
import type { Context } from 'telegraf';

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 15; // max commands per window

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Rate limiting guard for Telegram commands.
 * Prevents spam by limiting users to a maximum number of commands per minute.
 * Uses an in-memory store (suitable for single-instance bots).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly limits = new Map<number, RateLimitEntry>();

  // Start periodic cleanup (every 5 minutes)
  constructor() {
    setInterval(() => this.cleanup(), 5 * 60_000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.getArgByIndex<Context>(0);
    const userId = ctx.from?.id;

    // Allow if we can't identify the user (e.g., channel posts)
    if (userId === undefined) {
      return true;
    }

    const now = Date.now();
    const entry = this.limits.get(userId);

    // No existing entry or window expired — create new
    if (entry === undefined || now >= entry.resetAt) {
      this.limits.set(userId, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      });
      return true;
    }

    // Within window — check limit
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
      const remainingSeconds = Math.ceil((entry.resetAt - now) / 1000);
      this.logger.warn(
        `🚫 Rate limit exceeded for user ${String(userId)}. Reset in ${String(remainingSeconds)}s`,
      );

      await ctx.reply(
        `⏳ Слишком много запросов! Подождите ${String(remainingSeconds)} сек.`,
      );
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  /**
   * Remove expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [userId, entry] of this.limits) {
      if (now >= entry.resetAt) {
        this.limits.delete(userId);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.debug(`🧹 Cleaned up ${String(removed)} expired rate limit entries`);
    }
  }

  /**
   * Get current limit status for a user (for debugging)
   */
  getLimitStatus(userId: number): { remaining: number; resetIn: number } | null {
    const entry = this.limits.get(userId);
    if (entry === undefined) {
      return null;
    }

    const now = Date.now();
    if (now >= entry.resetAt) {
      return null;
    }

    return {
      remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count),
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
}
