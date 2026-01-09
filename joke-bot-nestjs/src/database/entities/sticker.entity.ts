import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stickers')
export class Sticker {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  fileId!: string;

  @Column({ type: 'text', nullable: true })
  emoji!: string | null;

  @Column({ type: 'integer', default: 0 })
  usedCount!: number;
}
