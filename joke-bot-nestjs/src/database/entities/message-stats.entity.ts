import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('message_stats')
export class MessageStats {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  chatId!: number;

  @Column({ default: 0 })
  messageCount!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;
}
