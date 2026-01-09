import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('topics')
@Unique(['chatId', 'threadId'])
export class Topic {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  chatId!: number;

  @Column({ type: 'integer' })
  threadId!: number;

  @Column({ type: 'text', nullable: true })
  title!: string | null;
}
