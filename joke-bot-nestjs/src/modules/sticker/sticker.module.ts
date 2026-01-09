import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sticker } from '../../database/entities';
import { StickerService } from './sticker.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sticker])],
  providers: [StickerService],
  exports: [StickerService],
})
export class StickerModule {}
