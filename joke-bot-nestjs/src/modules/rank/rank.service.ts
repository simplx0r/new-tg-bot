import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageStats, Rank, User } from '../../database/entities';

const DEFAULT_RANKS = [
  {
    name: 'Стажёр-Шпион',
    emoji: '🐣',
    minMessages: 0,
    description: 'Только получил доступ',
  },
  {
    name: 'Агент под прикрытием',
    emoji: '🥸',
    minMessages: 10,
    description: 'Уже на 2 созвонах',
  },
  {
    name: 'Двойной Агент',
    emoji: '🕵️',
    minMessages: 50,
    description: '2 работы, 1 VPN',
  },
  {
    name: 'Агент 007',
    emoji: '🔫',
    minMessages: 100,
    description: '0 PR, 0 тасок, 7 созвонов',
  },
  {
    name: 'Агент ФСБ',
    emoji: '🦅',
    minMessages: 250,
    description: 'Федеральная Служба Багов',
  },
  {
    name: 'Специальный Агент',
    emoji: '⭐',
    minMessages: 500,
    description: 'Работает везде и нигде',
  },
  {
    name: 'Главный по Секретам',
    emoji: '👑',
    minMessages: 1000,
    description: '5 работ, никто не знает',
  },
];

@Injectable()
export class RankService implements OnModuleInit {
  constructor(
    @InjectRepository(Rank)
    private readonly rankRepo: Repository<Rank>,
    @InjectRepository(MessageStats)
    private readonly statsRepo: Repository<MessageStats>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.rankRepo.count();
    if (count === 0) {
      await this.rankRepo.save(DEFAULT_RANKS);
    }
  }

  async getAllRanks(): Promise<Rank[]> {
    return this.rankRepo.find({ order: { minMessages: 'ASC' } });
  }

  async getUserRank(telegramId: number, chatId: number): Promise<Rank | null> {
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (user === null) {
      return null;
    }

    const stats = await this.statsRepo.findOne({
      where: { userId: user.id, chatId },
    });
    const messageCount = stats?.messageCount ?? 0;

    const ranks = await this.getAllRanks();
    return ranks.filter((r) => r.minMessages <= messageCount).pop() ?? null;
  }
}
