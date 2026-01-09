import { UseGuards } from '@nestjs/common';
import { Action, Command, Ctx, Hears, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { AdminOnly } from '../../common/decorators';
import { AdminGuard } from '../../common/guards';
import {
  intervalKeyboard,
  modeKeyboard,
  replyChanceKeyboard,
  settingsKeyboard,
} from '../../common/keyboards';
import { StickerService } from '../sticker/sticker.service';
import { AdminService } from './admin.service';

interface MatchContext extends Context {
  match: RegExpExecArray;
}

interface CallbackContext extends Context {
  match?: RegExpExecArray;
}

@Update()
@UseGuards(AdminGuard)
export class AdminUpdate {
  constructor(
    private readonly adminService: AdminService,
    private readonly stickerService: StickerService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  //  SETTINGS COMMAND — Shows interactive inline keyboard
  // ─────────────────────────────────────────────────────────────

  @Command('settings')
  @AdminOnly()
  async onSettings(@Ctx() ctx: Context): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    const s = await this.adminService.getOrCreateSettings(ctx.chat.id);
    const stickerCount = await this.stickerService.getCount();

    await ctx.reply(
      `⚙️ *Настройки чата*\n\n` +
        `🎭 Авто-шутки: ${s.jokesEnabled ? '✅' : '❌'}\n` +
        `🎨 Стикеры: ${s.stickersEnabled ? '✅' : '❌'} (${String(stickerCount)} шт.)\n` +
        `🎲 Режим: ${this.modeLabel(s.broadcastMode)}\n` +
        `⏰ Интервал: ${String(s.jokesInterval)} мин.\n` +
        `💬 Шанс ответа: ${String(s.replyChance)}%`,
      { parse_mode: 'Markdown', ...settingsKeyboard(s) },
    );
  }

  // ─────────────────────────────────────────────────────────────
  //  CALLBACK HANDLERS — Inline button interactions
  // ─────────────────────────────────────────────────────────────

  @Action('toggle_jokes')
  @AdminOnly()
  async onToggleJokes(@Ctx() ctx: CallbackContext): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    const s = await this.adminService.getOrCreateSettings(ctx.chat.id);
    await this.adminService.updateSettings(ctx.chat.id, {
      jokesEnabled: !s.jokesEnabled,
    });
    await this.refreshSettings(ctx);
    await ctx.answerCbQuery(s.jokesEnabled ? '❌ Шутки выключены' : '✅ Шутки включены');
  }

  @Action('toggle_stickers')
  @AdminOnly()
  async onToggleStickers(@Ctx() ctx: CallbackContext): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    const s = await this.adminService.getOrCreateSettings(ctx.chat.id);
    await this.adminService.updateSettings(ctx.chat.id, {
      stickersEnabled: !s.stickersEnabled,
    });
    await this.refreshSettings(ctx);
    await ctx.answerCbQuery(s.stickersEnabled ? '❌ Стикеры выключены' : '✅ Стикеры включены');
  }

  @Action('set_interval')
  @AdminOnly()
  async onSetIntervalMenu(@Ctx() ctx: CallbackContext): Promise<void> {
    await ctx.editMessageText('⏰ *Выберите интервал авто-шуток:*', {
      parse_mode: 'Markdown',
      ...intervalKeyboard(),
    });
    await ctx.answerCbQuery();
  }

  @Action(/^interval_(\d+)$/)
  @AdminOnly()
  async onIntervalSelect(@Ctx() ctx: CallbackContext): Promise<void> {
    if (ctx.chat === undefined || ctx.match === undefined) {
      return;
    }
    const interval = parseInt(ctx.match[1] ?? '60', 10);
    await this.adminService.updateSettings(ctx.chat.id, { jokesInterval: interval });
    await this.refreshSettings(ctx);
    await ctx.answerCbQuery(`✅ Интервал: ${String(interval)} мин.`);
  }

  @Action('set_replychance')
  @AdminOnly()
  async onSetReplyChanceMenu(@Ctx() ctx: CallbackContext): Promise<void> {
    await ctx.editMessageText('💬 *Выберите шанс случайного ответа:*', {
      parse_mode: 'Markdown',
      ...replyChanceKeyboard(),
    });
    await ctx.answerCbQuery();
  }

  @Action(/^chance_(\d+)$/)
  @AdminOnly()
  async onChanceSelect(@Ctx() ctx: CallbackContext): Promise<void> {
    if (ctx.chat === undefined || ctx.match === undefined) {
      return;
    }
    const chance = parseInt(ctx.match[1] ?? '5', 10);
    await this.adminService.updateSettings(ctx.chat.id, { replyChance: chance });
    await this.refreshSettings(ctx);
    await ctx.answerCbQuery(`✅ Шанс ответа: ${String(chance)}%`);
  }

  @Action('set_mode')
  @AdminOnly()
  async onSetModeMenu(@Ctx() ctx: CallbackContext): Promise<void> {
    await ctx.editMessageText('🎲 *Выберите режим бродкаста:*', {
      parse_mode: 'Markdown',
      ...modeKeyboard(),
    });
    await ctx.answerCbQuery();
  }

  @Action(/^mode_(jokes|stickers|mixed)$/)
  @AdminOnly()
  async onModeSelect(@Ctx() ctx: CallbackContext): Promise<void> {
    if (ctx.chat === undefined || ctx.match === undefined) {
      return;
    }
    const mode = ctx.match[1] ?? 'jokes';
    await this.adminService.updateSettings(ctx.chat.id, { broadcastMode: mode });
    await this.refreshSettings(ctx);
    await ctx.answerCbQuery(`✅ Режим: ${this.modeLabel(mode)}`);
  }

  @Action('refresh_settings')
  @AdminOnly()
  async onRefresh(@Ctx() ctx: CallbackContext): Promise<void> {
    await this.refreshSettings(ctx);
    await ctx.answerCbQuery('🔄 Обновлено');
  }

  @Action('back_to_settings')
  @AdminOnly()
  async onBackToSettings(@Ctx() ctx: CallbackContext): Promise<void> {
    await this.refreshSettings(ctx);
    await ctx.answerCbQuery();
  }

  // ─────────────────────────────────────────────────────────────
  //  LEGACY COMMANDS — Still work for backwards compatibility
  // ─────────────────────────────────────────────────────────────

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

  @Command('stickerson')
  @AdminOnly()
  async onStickersOn(@Ctx() ctx: Context): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    await this.adminService.updateSettings(ctx.chat.id, { stickersEnabled: true });
    await ctx.reply('✅ Стикеры включены');
  }

  @Command('stickersoff')
  @AdminOnly()
  async onStickersOff(@Ctx() ctx: Context): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    await this.adminService.updateSettings(ctx.chat.id, { stickersEnabled: false });
    await ctx.reply('✅ Стикеры выключены');
  }

  @Command('addsticker')
  @AdminOnly()
  async onAddSticker(@Ctx() ctx: Context): Promise<void> {
    const message = ctx.message;
    if (message === undefined || !('reply_to_message' in message)) {
      await ctx.reply('❌ Ответь на стикер командой /addsticker');
      return;
    }

    const reply = message.reply_to_message;
    if (reply === undefined || !('sticker' in reply)) {
      await ctx.reply('❌ Ответь на стикер командой /addsticker');
      return;
    }

    const stickerData = reply.sticker;
    const sticker = await this.stickerService.addSticker(
      stickerData.file_id,
      stickerData.emoji,
    );
    const count = await this.stickerService.getCount();
    await ctx.reply(
      `✅ Стикер добавлен! Всего: ${String(count)} ${sticker.emoji ?? ''}`,
    );
  }

  @Hears(/^\/interval\s+(\d+)/)
  @AdminOnly()
  async onSetInterval(@Ctx() ctx: MatchContext): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    const interval = parseInt(ctx.match[1] ?? '60', 10);
    if (interval < 1) {
      await ctx.reply('❌ Минимум 1 минута');
      return;
    }
    await this.adminService.updateSettings(ctx.chat.id, { jokesInterval: interval });
    await ctx.reply(`✅ Интервал: ${String(interval)} мин.`);
  }

  @Hears(/^\/replychance\s+(\d+)/)
  @AdminOnly()
  async onSetReplyChance(@Ctx() ctx: MatchContext): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    const chance = Math.min(100, Math.max(0, parseInt(ctx.match[1] ?? '5', 10)));
    await this.adminService.updateSettings(ctx.chat.id, { replyChance: chance });
    await ctx.reply(`✅ Шанс ответа: ${String(chance)}%`);
  }

  @Hears(/^\/mode\s+(jokes|stickers|mixed)/)
  @AdminOnly()
  async onSetMode(@Ctx() ctx: MatchContext): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    const mode = ctx.match[1] ?? 'jokes';
    await this.adminService.updateSettings(ctx.chat.id, { broadcastMode: mode });
    await ctx.reply(`✅ Режим: ${this.modeLabel(mode)}`);
  }

  @Hears(/^\/addadmin\s+(\d+)/)
  @AdminOnly()
  async onAddAdmin(@Ctx() ctx: MatchContext): Promise<void> {
    const targetId = parseInt(ctx.match[1] ?? '0', 10);
    await this.adminService.addAdmin(targetId, ctx.from?.id);
    await ctx.reply(`✅ Админ ${String(targetId)} добавлен`);
  }

  @Hears(/^\/removeadmin\s+(\d+)/)
  @AdminOnly()
  async onRemoveAdmin(@Ctx() ctx: MatchContext): Promise<void> {
    const targetId = parseInt(ctx.match[1] ?? '0', 10);
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
    const list = admins
      .map((a, i) => `${String(i + 1)}. ID: ${String(a.telegramId)}`)
      .join('\n');
    await ctx.reply(`👑 Админы:\n\n${list}`);
  }

  // ─────────────────────────────────────────────────────────────
  //  HELPER METHODS
  // ─────────────────────────────────────────────────────────────

  private async refreshSettings(ctx: CallbackContext): Promise<void> {
    if (ctx.chat === undefined) {
      return;
    }
    const s = await this.adminService.getOrCreateSettings(ctx.chat.id);
    const stickerCount = await this.stickerService.getCount();

    await ctx.editMessageText(
      `⚙️ *Настройки чата*\n\n` +
        `🎭 Авто-шутки: ${s.jokesEnabled ? '✅' : '❌'}\n` +
        `🎨 Стикеры: ${s.stickersEnabled ? '✅' : '❌'} (${String(stickerCount)} шт.)\n` +
        `🎲 Режим: ${this.modeLabel(s.broadcastMode)}\n` +
        `⏰ Интервал: ${String(s.jokesInterval)} мин.\n` +
        `💬 Шанс ответа: ${String(s.replyChance)}%`,
      { parse_mode: 'Markdown', ...settingsKeyboard(s) },
    );
  }

  private modeLabel(mode: string): string {
    const map: Record<string, string> = {
      jokes: '🎭 Шутки',
      stickers: '🎨 Стикеры',
      mixed: '🎲 Микс',
    };
    return map[mode] ?? mode;
  }
}
