import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageStats, Rank, User } from '../../database/entities';
import { RankService } from './rank.service';
import { RankUpdate } from './rank.update';

@Module({
  imports: [TypeOrmModule.forFeature([Rank, MessageStats, User])],
  providers: [RankService, RankUpdate],
  exports: [RankService],
})
export class RankModule {}
