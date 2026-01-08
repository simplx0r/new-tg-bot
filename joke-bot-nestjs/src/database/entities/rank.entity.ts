import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ranks')
export class Rank {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  emoji!: string | null;

  @Column({ nullable: true })
  description!: string | null;

  @Column()
  minMessages!: number;
}
