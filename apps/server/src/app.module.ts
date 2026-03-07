import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomModule } from './modules/room/room.module';
import { GameModule } from './modules/game/game.module';
import { GatewayModule } from './modules/gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    RoomModule,
    GameModule,
    GatewayModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
