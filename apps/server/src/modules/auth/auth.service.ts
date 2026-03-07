import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  nickname: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async guestLogin(deviceId: string, nickname: string) {
    let user = await this.prisma.user.findFirst({
      where: { guestDeviceId: deviceId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          nickname,
          guestDeviceId: deviceId,
        },
      });
    }

    const payload: JwtPayload = { sub: user.id, nickname: user.nickname };
    const token = this.jwt.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        coins: Number(user.coins),
        totalHands: user.totalHands,
        totalWins: user.totalWins,
        totalProfit: Number(user.totalProfit),
        bestHandRank: user.bestHandRank,
        maxSingleWin: Number(user.maxSingleWin),
      },
    };
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwt.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }
}
