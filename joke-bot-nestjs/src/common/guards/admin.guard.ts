import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Context } from 'telegraf';
import { AdminService } from '../../modules/admin/admin.service';
import { ADMIN_ONLY_KEY } from '../decorators/admin-only.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly adminService: AdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAdminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isAdminOnly !== true) {
      return true;
    }

    const ctx = context.getArgByIndex<Context>(0);
    const userId = ctx.from?.id;

    if (userId === undefined) {
      await ctx.reply('❌ Не удалось определить пользователя');
      return false;
    }

    const isAdmin = await this.adminService.isAdmin(userId);
    if (!isAdmin) {
      await ctx.reply('❌ Только для админов');
      return false;
    }

    return true;
  }
}
