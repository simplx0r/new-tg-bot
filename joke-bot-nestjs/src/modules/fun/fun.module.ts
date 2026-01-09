import { Module } from '@nestjs/common';
import { FunUpdate } from './fun.update';

@Module({
  providers: [FunUpdate],
})
export class FunModule {}
