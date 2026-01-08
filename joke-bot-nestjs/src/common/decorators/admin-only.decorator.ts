import { SetMetadata } from '@nestjs/common';

export const ADMIN_ONLY_KEY = 'isAdminOnly';
export const AdminOnly = (): MethodDecorator =>
  SetMetadata(ADMIN_ONLY_KEY, true);
