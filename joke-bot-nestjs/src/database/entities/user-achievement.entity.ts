import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { Achievement } from './achievement.entity';
import { User } from './user.entity';

@Entity('user_achievements')
@Unique(['userId', 'achievementId', 'chatId'])
export class UserAchievement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  userId!: number;

  @Column({ type: 'integer' })
  achievementId!: number;

  @Column({ type: 'integer' })
  chatId!: number;

  @CreateDateColumn()
  unlockedAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Achievement)
  @JoinColumn({ name: 'achievementId' })
  achievement!: Achievement;
}
