import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { StatsController } from './stats.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StatsController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
