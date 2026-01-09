import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  code!: string; // e.g. 'first_message', 'joke_master'

  @Column({ type: 'text' })
  name!: string; // "Первое слово"

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  emoji!: string; // 🎖️

  @Column({ type: 'text', default: 'common' })
  rarity!: AchievementRarity;

  @Column({ type: 'integer', default: 10 })
  xpReward!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
