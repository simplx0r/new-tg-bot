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

  @Column({ default: 'general' })
  category!: string;

  @Column({ default: 0 })
  usedCount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
