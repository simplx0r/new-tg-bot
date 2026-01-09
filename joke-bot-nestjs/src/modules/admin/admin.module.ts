import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin, ChatSettings } from '../../database/entities';
import { StickerModule } from '../sticker/sticker.module';
import { AdminService } from './admin.service';
import { AdminUpdate } from './admin.update';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, ChatSettings]), StickerModule],
  providers: [AdminService, AdminUpdate],
  exports: [AdminService],
})
export class AdminModule {}
