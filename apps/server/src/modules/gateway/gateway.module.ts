import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { AuthModule } from '../auth/auth.module';
import { RoomModule } from '../room/room.module';
import { GameModule } from '../game/game.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [AuthModule, RoomModule, GameModule, HistoryModule],
  providers: [GameGateway],
})
export class GatewayModule {}
