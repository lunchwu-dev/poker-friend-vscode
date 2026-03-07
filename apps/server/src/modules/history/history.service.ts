import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EngineGameState } from '../game/types/engine.types';
import { HandSettlement } from '../game/game-engine.service';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async saveHandResult(
    roomCode: string,
    state: EngineGameState,
    settlement: HandSettlement,
  ): Promise<void> {
    const communityCardsStr =
      state.communityCards.map((c) => `${c.suit}${c.rank}`).join(',') || null;

    const potTotal = state.pots.reduce((sum, p) => sum + p.amount, 0);
    const winnerIds = new Set(settlement.winners.map((w) => w.playerId));

    const chipsWon = new Map<string, number>();
    for (const w of settlement.winners) {
      chipsWon.set(w.playerId, (chipsWon.get(w.playerId) ?? 0) + w.amount);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.handHistory.create({
        data: {
          roomCode,
          handNumber: state.handNumber,
          playerCount: state.players.length,
          communityCards: communityCardsStr,
          potTotal: BigInt(potTotal),
          handPlayers: {
            create: state.players.map((p) => {
              const handResult = settlement.showdownHands.get(p.playerId);
              const won = chipsWon.get(p.playerId) ?? 0;
              const chipsChange = won - p.totalHandBet;
              return {
                userId: p.playerId,
                seatIndex: p.seatIndex,
                holeCards: p.holeCards
                  ? p.holeCards.map((c) => `${c.suit}${c.rank}`).join(',')
                  : null,
                finalHandRank: handResult?.rank ?? null,
                chipsChange: BigInt(chipsChange),
                isWinner: winnerIds.has(p.playerId),
              };
            }),
          },
        },
      });

      for (const p of state.players) {
        const won = chipsWon.get(p.playerId) ?? 0;
        const chipsChange = won - p.totalHandBet;
        const isWinner = winnerIds.has(p.playerId);
        const handResult = settlement.showdownHands.get(p.playerId);

        const user = await tx.user.findUnique({ where: { id: p.playerId } });
        if (!user) continue;

        const updateData: Record<string, unknown> = {
          totalHands: user.totalHands + 1,
          totalProfit: user.totalProfit + BigInt(chipsChange),
        };

        if (isWinner) {
          updateData.totalWins = user.totalWins + 1;
        }

        if (won > Number(user.maxSingleWin)) {
          updateData.maxSingleWin = BigInt(won);
        }

        if (
          handResult &&
          (user.bestHandRank === null || handResult.rank < user.bestHandRank)
        ) {
          updateData.bestHandRank = handResult.rank;
        }

        await tx.user.update({
          where: { id: p.playerId },
          data: updateData,
        });
      }
    });
  }
}
