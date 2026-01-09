import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('jokes')
export class Joke {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  content!: string;

  @Column({ type: 'text', default: 'general' })
  category!: string;

  @Column({ type: 'integer', default: 0 })
  usedCount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
