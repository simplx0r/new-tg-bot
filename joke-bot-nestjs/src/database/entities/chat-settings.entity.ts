import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chat_settings')
export class ChatSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', unique: true })
  chatId!: number;

  @Column({ type: 'boolean', default: true })
  jokesEnabled!: boolean;

  @Column({ type: 'integer', default: 60 })
  jokesInterval!: number;

  @Column({ type: 'boolean', default: true })
  stickersEnabled!: boolean;

  @Column({ type: 'text', default: 'mixed' })
  broadcastMode!: string; // 'jokes' | 'stickers' | 'mixed'

  @Column({ type: 'integer', default: 45 })
  replyChance!: number; // 0-100 percent

  @CreateDateColumn()
  createdAt!: Date;
}

