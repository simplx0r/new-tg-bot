import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageStats, User } from '../../database/entities';

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface ChatSummary {
  totalMessages: number;
  totalUsers: number;
  topUser: User | null;
  topCount: number;
}

interface UserStatsResult {
  user: User;
  stats: MessageStats | null;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(MessageStats)
    private readonly statsRepo: Repository<MessageStats>,
  ) {}

  async getOrCreateUser(telegramUser: TelegramUser): Promise<User> {
    let user = await this.userRepo.findOne({
      where: { telegramId: telegramUser.id },
    });
    if (user === null) {
      user = this.userRepo.create({
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name ?? null,
        lastName: telegramUser.last_name ?? null,
        username: telegramUser.username ?? null,
      });
      await this.userRepo.save(user);
    }
    return user;
  }

  async recordMessage(userId: number, chatId: number): Promise<MessageStats> {
    let stats = await this.statsRepo.findOne({ where: { userId, chatId } });
    stats ??= this.statsRepo.create({ userId, chatId, messageCount: 0 });
    stats.messageCount++;
    return this.statsRepo.save(stats);
  }

  async getUserStats(
    telegramId: number,
    chatId: number,
  ): Promise<UserStatsResult | null> {
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (user === null) {
      return null;
    }

    const stats = await this.statsRepo.findOne({
      where: { userId: user.id, chatId },
    });
    return { user, stats };
  }

  async getTopUsers(chatId: number, limit = 10): Promise<MessageStats[]> {
    return this.statsRepo.find({
      where: { chatId },
      order: { messageCount: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  async getChatSummary(chatId: number): Promise<ChatSummary> {
    const allStats = await this.statsRepo.find({ where: { chatId } });
    const totalMessages = allStats.reduce((s, st) => s + st.messageCount, 0);
    const totalUsers = allStats.length;
    const top = await this.getTopUsers(chatId, 1);
    const topEntry = top[0];

    return {
      totalMessages,
      totalUsers,
      topUser: topEntry?.user ?? null,
      topCount: topEntry?.messageCount ?? 0,
    };
  }
}
