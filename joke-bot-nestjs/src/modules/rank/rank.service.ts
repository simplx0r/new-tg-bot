import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageStats, Rank, User } from '../../database/entities';

const DEFAULT_RANKS = [
  { name: 'Новичок', emoji: '🌱', minMessages: 0, description: 'Только начал' },
  {
    name: 'Участник',
    emoji: '👤',
    minMessages: 10,
    description: '10+ сообщений',
  },
  {
    name: 'Активист',
    emoji: '⭐',
    minMessages: 50,
    description: '50+ сообщений',
  },
  {
    name: 'Ветеран',
    emoji: '🏆',
    minMessages: 100,
    description: '100+ сообщений',
  },
  {
    name: 'Легенда',
    emoji: '👑',
    minMessages: 500,
    description: '500+ сообщений',
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
