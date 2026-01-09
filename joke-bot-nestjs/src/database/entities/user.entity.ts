import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', unique: true })
  telegramId!: number;

  @Column({ type: 'text', nullable: true })
  firstName!: string | null;

  @Column({ type: 'text', nullable: true })
  lastName!: string | null;

  @Column({ type: 'text', nullable: true })
  username!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'integer', default: 0 })
  xpTotal!: number;

  @Column({ type: 'integer', default: 1 })
  level!: number;

  get displayName(): string {
    if (this.firstName !== null && this.lastName !== null) {
      return `${this.firstName} ${this.lastName}`;
    }
    if (this.firstName !== null) {
      return this.firstName;
    }
    if (this.username !== null) {
      return `@${this.username}`;
    }
    return `User ${String(this.telegramId)}`;
  }
}
