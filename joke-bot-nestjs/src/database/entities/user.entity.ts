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

  @Column({ unique: true })
  telegramId!: number;

  @Column({ nullable: true })
  firstName!: string | null;

  @Column({ nullable: true })
  lastName!: string | null;

  @Column({ nullable: true })
  username!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

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
