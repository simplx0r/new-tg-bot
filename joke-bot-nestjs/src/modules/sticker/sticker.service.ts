import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sticker } from '../../database/entities';

@Injectable()
export class StickerService {
  constructor(
    @InjectRepository(Sticker)
    private readonly stickerRepo: Repository<Sticker>,
  ) {}

  async addSticker(fileId: string, emoji?: string): Promise<Sticker> {
    const existing = await this.stickerRepo.findOne({ where: { fileId } });
    if (existing !== null) {
      return existing;
    }
    const sticker = this.stickerRepo.create({
      fileId,
      emoji: emoji ?? null,
    });
    return this.stickerRepo.save(sticker);
  }

  async getRandomSticker(): Promise<Sticker | null> {
    const sticker = await this.stickerRepo
      .createQueryBuilder('sticker')
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
    return sticker;
  }

  async incrementUsage(sticker: Sticker): Promise<void> {
    sticker.usedCount++;
    await this.stickerRepo.save(sticker);
  }

  async getCount(): Promise<number> {
    return this.stickerRepo.count();
  }
}
