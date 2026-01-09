import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement, User, UserAchievement } from '../../database/entities';

// XP rewards for different actions
export const XP_REWARDS = {
  message: 1,
  joke_request: 3,
  sticker_request: 2,
  achievement_unlock: 0, // Achievements give their own xpReward
  daily_first_message: 10,
  rank_up: 25,
} as const;

// Level thresholds (XP needed for each level)
const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  1000,  // Level 5
  2000,  // Level 6
  3500,  // Level 7
  5500,  // Level 8
  8000,  // Level 9
  12000, // Level 10
];

export const XP_ADDED_EVENT = 'xp.added';
export const LEVEL_UP_EVENT = 'level.up';
export const ACHIEVEMENT_UNLOCKED_EVENT = 'achievement.unlocked';

export interface XpAddedPayload {
  userId: number;
  telegramId: number;
  chatId: number;
  xpAdded: number;
  xpTotal: number;
  source: keyof typeof XP_REWARDS;
}

export interface LevelUpPayload {
  userId: number;
  telegramId: number;
  chatId: number;
  oldLevel: number;
  newLevel: number;
  xpTotal: number;
}

export interface AchievementUnlockedPayload {
  userId: number;
  telegramId: number;
  chatId: number;
  achievement: Achievement;
}

// Default achievements to seed
const DEFAULT_ACHIEVEMENTS: Partial<Achievement>[] = [
  {
    code: 'first_message',
    name: 'Первое слово',
    description: 'Отправь первое сообщение',
    emoji: '👶',
    rarity: 'common',
    xpReward: 10,
  },
  {
    code: 'chatterbox_10',
    name: 'Болтун',
    description: 'Отправь 10 сообщений',
    emoji: '💬',
    rarity: 'common',
    xpReward: 25,
  },
  {
    code: 'chatterbox_100',
    name: 'Говорун',
    description: 'Отправь 100 сообщений',
    emoji: '🗣️',
    rarity: 'rare',
    xpReward: 100,
  },
  {
    code: 'chatterbox_1000',
    name: 'Легенда чата',
    description: 'Отправь 1000 сообщений',
    emoji: '👑',
    rarity: 'legendary',
    xpReward: 500,
  },
  {
    code: 'joke_lover_5',
    name: 'Любитель шуток',
    description: 'Запроси 5 шуток',
    emoji: '😂',
    rarity: 'common',
    xpReward: 15,
  },
  {
    code: 'joke_master_50',
    name: 'Мастер шуток',
    description: 'Запроси 50 шуток',
    emoji: '🎭',
    rarity: 'epic',
    xpReward: 150,
  },
  {
    code: 'level_5',
    name: 'Опытный агент',
    description: 'Достигни 5 уровня',
    emoji: '⭐',
    rarity: 'rare',
    xpReward: 75,
  },
  {
    code: 'level_10',
    name: 'Элитный агент',
    description: 'Достигни 10 уровня',
    emoji: '🌟',
    rarity: 'legendary',
    xpReward: 250,
  },
  {
    code: 'night_owl',
    name: 'Ночная сова',
    description: 'Напиши сообщение между 2:00 и 5:00',
    emoji: '🦉',
    rarity: 'epic',
    xpReward: 50,
  },
  {
    code: 'early_bird',
    name: 'Ранняя пташка',
    description: 'Напиши сообщение между 5:00 и 7:00',
    emoji: '🐦',
    rarity: 'rare',
    xpReward: 30,
  },
];

@Injectable()
export class XpService implements OnModuleInit {
  private readonly logger = new Logger(XpService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.achievementRepo.count();
    if (count === 0) {
      this.logger.log('🏆 Seeding default achievements...');
      await this.achievementRepo.save(DEFAULT_ACHIEVEMENTS);
      this.logger.log(`✅ Seeded ${String(DEFAULT_ACHIEVEMENTS.length)} achievements`);
    }
  }

  /**
   * Add XP to a user and check for level ups
   */
  async addXp(
    user: User,
    chatId: number,
    amount: number,
    source: keyof typeof XP_REWARDS,
  ): Promise<{ leveledUp: boolean; newLevel?: number }> {
    const oldLevel = user.level;
    user.xpTotal += amount;

    // Check for level up
    const newLevel = this.calculateLevel(user.xpTotal);
    const leveledUp = newLevel > oldLevel;

    if (leveledUp) {
      user.level = newLevel;

      // Emit level up event
      this.eventEmitter.emit(LEVEL_UP_EVENT, {
        userId: user.id,
        telegramId: user.telegramId,
        chatId,
        oldLevel,
        newLevel,
        xpTotal: user.xpTotal,
      } satisfies LevelUpPayload);

      // Bonus XP for leveling up
      user.xpTotal += XP_REWARDS.rank_up;
    }

    await this.userRepo.save(user);

    // Emit XP added event
    this.eventEmitter.emit(XP_ADDED_EVENT, {
      userId: user.id,
      telegramId: user.telegramId,
      chatId,
      xpAdded: amount,
      xpTotal: user.xpTotal,
      source,
    } satisfies XpAddedPayload);

    if (leveledUp) {
      return { leveledUp: true, newLevel };
    }
    return { leveledUp: false };
  }

  /**
   * Calculate level from XP
   */
  calculateLevel(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= (LEVEL_THRESHOLDS[i] ?? 0)) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Get XP needed for next level
   */
  getXpForNextLevel(currentLevel: number): number | null {
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
      return null; // Max level
    }
    return LEVEL_THRESHOLDS[currentLevel] ?? null;
  }

  /**
   * Get user's progress to next level
   */
  getLevelProgress(user: User): { current: number; required: number; percent: number } {
    const currentThreshold = LEVEL_THRESHOLDS[user.level - 1] ?? 0;
    const nextThreshold = LEVEL_THRESHOLDS[user.level] ?? currentThreshold;
    const current = user.xpTotal - currentThreshold;
    const required = nextThreshold - currentThreshold;
    const percent = required > 0 ? Math.floor((current / required) * 100) : 100;

    return { current, required, percent };
  }

  /**
   * Check and unlock an achievement for a user
   */
  async tryUnlockAchievement(
    user: User,
    chatId: number,
    achievementCode: string,
  ): Promise<Achievement | null> {
    // Check if already unlocked
    const existing = await this.userAchievementRepo.findOne({
      where: { userId: user.id, chatId },
      relations: ['achievement'],
    });

    if (existing?.achievement?.code === achievementCode) {
      return null; // Already unlocked
    }

    // Find the achievement
    const achievement = await this.achievementRepo.findOne({
      where: { code: achievementCode },
    });

    if (achievement === null) {
      return null;
    }

    // Check if already has this specific achievement
    const hasAchievement = await this.userAchievementRepo.findOne({
      where: { userId: user.id, achievementId: achievement.id, chatId },
    });

    if (hasAchievement !== null) {
      return null; // Already unlocked
    }

    // Unlock it!
    const userAchievement = this.userAchievementRepo.create({
      userId: user.id,
      achievementId: achievement.id,
      chatId,
    });
    await this.userAchievementRepo.save(userAchievement);

    // Add XP reward
    await this.addXp(user, chatId, achievement.xpReward, 'achievement_unlock');

    // Emit event
    this.eventEmitter.emit(ACHIEVEMENT_UNLOCKED_EVENT, {
      userId: user.id,
      telegramId: user.telegramId,
      chatId,
      achievement,
    } satisfies AchievementUnlockedPayload);

    this.logger.log(
      `🏆 User ${String(user.telegramId)} unlocked: ${achievement.name}`,
    );

    return achievement;
  }

  /**
   * Get all achievements for a user in a chat
   */
  async getUserAchievements(userId: number, chatId: number): Promise<UserAchievement[]> {
    return this.userAchievementRepo.find({
      where: { userId, chatId },
      relations: ['achievement'],
      order: { unlockedAt: 'DESC' },
    });
  }

  /**
   * Get all available achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementRepo.find({ order: { rarity: 'ASC' } });
  }

  /**
   * Format rarity with color emoji
   */
  formatRarity(rarity: string): string {
    const map: Record<string, string> = {
      common: '⚪ Обычное',
      rare: '🔵 Редкое',
      epic: '🟣 Эпическое',
      legendary: '🟡 Легендарное',
    };
    return map[rarity] ?? rarity;
  }
}
