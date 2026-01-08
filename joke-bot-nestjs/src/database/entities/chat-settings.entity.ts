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

  @Column({ unique: true })
  chatId!: number;

  @Column({ default: false })
  jokesEnabled!: boolean;

  @Column({ default: 60 })
  jokesInterval!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
