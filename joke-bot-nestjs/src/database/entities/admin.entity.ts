import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  telegramId!: number;

  @Column({ nullable: true })
  addedBy!: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
