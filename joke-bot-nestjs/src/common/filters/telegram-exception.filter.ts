import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Context } from 'telegraf';

@Catch()
export class TelegramExceptionFilter implements ExceptionFilter {
  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const ctx = host.getArgByIndex<Context>(0);

    // eslint-disable-next-line no-console
    console.error('❌ Telegram Error:', exception.message);
    // eslint-disable-next-line no-console
    console.error(exception.stack);

    try {
      await ctx.reply('⚠️ Произошла ошибка. Попробуйте позже.');
    } catch {
      // Ignore if we can't reply
    }
  }
}
