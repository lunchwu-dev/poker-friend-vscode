import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getMyStats(@Req() req: { user: { sub: string } }) {
    const userId = req.user.sub;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        nickname: true,
        coins: true,
        totalHands: true,
        totalWins: true,
        totalProfit: true,
        bestHandRank: true,
        maxSingleWin: true,
      },
    });

    if (!user) return { error: 'User not found' };

    const recentHands = await this.prisma.handPlayer.findMany({
      where: { userId },
      orderBy: { hand: { createdAt: 'desc' } },
      take: 20,
      select: {
        seatIndex: true,
        chipsChange: true,
        isWinner: true,
        finalHandRank: true,
        hand: {
          select: {
            roomCode: true,
            handNumber: true,
            playerCount: true,
            potTotal: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      nickname: user.nickname,
      coins: Number(user.coins),
      totalHands: user.totalHands,
      totalWins: user.totalWins,
      winRate: user.totalHands > 0
        ? Math.round((user.totalWins / user.totalHands) * 100)
        : 0,
      totalProfit: Number(user.totalProfit),
      bestHandRank: user.bestHandRank,
      maxSingleWin: Number(user.maxSingleWin),
      recentHands: recentHands.map((h) => ({
        roomCode: h.hand.roomCode,
        handNumber: h.hand.handNumber,
        playerCount: h.hand.playerCount,
        potTotal: Number(h.hand.potTotal),
        chipsChange: Number(h.chipsChange),
        isWinner: h.isWinner,
        finalHandRank: h.finalHandRank,
        playedAt: h.hand.createdAt,
      })),
    };
  }
}
