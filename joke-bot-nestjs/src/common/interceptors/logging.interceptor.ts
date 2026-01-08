import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Context } from 'telegraf';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.getArgByIndex<Context>(0);
    const userId = ctx.from?.id ?? 'unknown';
    const username = ctx.from?.username ?? ctx.from?.first_name ?? 'unknown';
    const chatId = ctx.chat?.id ?? 'unknown';
    const handler = context.getHandler().name;

    const now = Date.now();
    // eslint-disable-next-line no-console
    console.log(`📥 [${handler}] User: ${username} (${String(userId)}) Chat: ${String(chatId)}`);

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        // eslint-disable-next-line no-console
        console.log(`📤 [${handler}] Completed in ${String(elapsed)}ms`);
      }),
    );
  }
}
