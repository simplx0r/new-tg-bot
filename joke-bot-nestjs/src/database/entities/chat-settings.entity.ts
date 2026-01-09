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

  @Column({ type: 'boolean', default: false })
  jokesEnabled!: boolean;

  @Column({ type: 'integer', default: 60 })
  jokesInterval!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
