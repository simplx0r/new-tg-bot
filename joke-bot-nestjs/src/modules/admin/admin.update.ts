import { UseGuards } from '@nestjs/common';
import { Command, Ctx, Hears, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { AdminOnly } from '../../common/decorators';
import { AdminGuard } from '../../common/guards';
import { AdminService } from './admin.service';

interface MatchContext extends Context {
  match: RegExpExecArray;
}

@Update()
@UseGuards(AdminGuard)
export class AdminUpdate {
  constructor(private readonly adminService: AdminService) {}

  @Command('jokeson')
  @AdminOnly()
  async onJokesOn(@Ctx() ctx: Context): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    await this.adminService.updateSettings(ctx.chat.id, { jokesEnabled: true });
    await ctx.reply('✅ Авто-шутки включены');
  }

  @Command('jokesoff')
  @AdminOnly()
  async onJokesOff(@Ctx() ctx: Context): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    await this.adminService.updateSettings(ctx.chat.id, { jokesEnabled: false });
    await ctx.reply('✅ Авто-шутки выключены');
  }

  @Hears(/^\/setinterval\s+(\d+)/)
  @AdminOnly()
  async onSetInterval(@Ctx() ctx: MatchContext): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }

    const intervalStr = ctx.match[1];
    if (intervalStr === undefined) {
      return;
    }

    const interval = parseInt(intervalStr, 10);
    if (interval < 1) {
      await ctx.reply('❌ Интервал минимум 1 минута');
      return;
    }

    await this.adminService.updateSettings(ctx.chat.id, { jokesInterval: interval });
    await ctx.reply(`✅ Интервал: ${String(interval)} мин.`);
  }

  @Hears(/^\/addadmin\s+(\d+)/)
  @AdminOnly()
  async onAddAdmin(@Ctx() ctx: MatchContext): Promise<void> {
    const targetIdStr = ctx.match[1];
    if (targetIdStr === undefined) {
      return;
    }

    const targetId = parseInt(targetIdStr, 10);
    await this.adminService.addAdmin(targetId, ctx.from?.id);
    await ctx.reply(`✅ Админ ${String(targetId)} добавлен`);
  }

  @Hears(/^\/removeadmin\s+(\d+)/)
  @AdminOnly()
  async onRemoveAdmin(@Ctx() ctx: MatchContext): Promise<void> {
    const targetIdStr = ctx.match[1];
    if (targetIdStr === undefined) {
      return;
    }

    const targetId = parseInt(targetIdStr, 10);
    await this.adminService.removeAdmin(targetId);
    await ctx.reply(`✅ Админ ${String(targetId)} удалён`);
  }

  @Command('admins')
  @AdminOnly()
  async onAdmins(@Ctx() ctx: Context): Promise<void> {
    const admins = await this.adminService.getAllAdmins();
    if (admins.length === 0) {
      await ctx.reply('👑 Список админов пуст');
      return;
    }

    const list = admins.map((a, i) => `${String(i + 1)}. ID: ${String(a.telegramId)}`).join('\n');
    await ctx.reply(`👑 Админы:\n\n${list}`);
  }
}
