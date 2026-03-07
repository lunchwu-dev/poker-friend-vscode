import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from '../history.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EngineGameState } from '../../game/types/engine.types';
import { HandSettlement } from '../../game/game-engine.service';
import { GameStage, Suit, Rank } from '@poker-friends/shared';

describe('HistoryService', () => {
  let service: HistoryService;
  let mockTx: {
    handHistory: { create: jest.Mock };
    user: { findUnique: jest.Mock; update: jest.Mock };
  };
  let prisma: { $transaction: jest.Mock };

  beforeEach(async () => {
    mockTx = {
      handHistory: { create: jest.fn().mockResolvedValue({ id: 'hand-1' }) },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    prisma = {
      $transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(HistoryService);
  });

  it('should save hand history and update user stats', async () => {
    const state: EngineGameState = {
      roomCode: 'ABCDEF',
      handNumber: 1,
      stage: GameStage.SETTLE,
      dealerSeatIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
      actionTimeout: 30,
      deck: [],
      communityCards: [
        { suit: Suit.Hearts, rank: Rank.Ace },
        { suit: Suit.Spades, rank: Rank.King },
        { suit: Suit.Diamonds, rank: Rank.Queen },
        { suit: Suit.Clubs, rank: Rank.Jack },
        { suit: Suit.Hearts, rank: Rank.Ten },
      ],
      players: [
        {
          playerId: 'p1',
          seatIndex: 0,
          chips: 1020,
          holeCards: [
            { suit: Suit.Hearts, rank: Rank.King },
            { suit: Suit.Hearts, rank: Rank.Queen },
          ],
          status: 'playing',
          currentRoundBet: 0,
          totalHandBet: 20,
          hasActedThisRound: false,
        },
        {
          playerId: 'p2',
          seatIndex: 1,
          chips: 980,
          holeCards: [
            { suit: Suit.Clubs, rank: Rank.Two },
            { suit: Suit.Diamonds, rank: Rank.Three },
          ],
          status: 'folded',
          currentRoundBet: 0,
          totalHandBet: 20,
          hasActedThisRound: false,
        },
      ],
      currentPlayerIndex: null,
      pots: [{ amount: 40, eligiblePlayerIds: ['p1', 'p2'] }],
      roundMaxBet: 0,
      lastRaiseAmount: 20,
      handStartTime: Date.now(),
    };

    const settlement: HandSettlement = {
      winners: [{ playerId: 'p1', amount: 40 }],
      showdownHands: new Map([
        [
          'p1',
          {
            rank: 4,
            rankName: 'Straight',
            bestCards: [],
            keyValues: [14],
          },
        ],
      ]),
    };

    mockTx.user.findUnique
      .mockResolvedValueOnce({
        id: 'p1',
        totalHands: 5,
        totalWins: 2,
        totalProfit: BigInt(100),
        maxSingleWin: BigInt(30),
        bestHandRank: 6,
      })
      .mockResolvedValueOnce({
        id: 'p2',
        totalHands: 5,
        totalWins: 1,
        totalProfit: BigInt(-50),
        maxSingleWin: BigInt(20),
        bestHandRank: 8,
      });

    await service.saveHandResult('ABCDEF', state, settlement);

    // Hand history created
    expect(mockTx.handHistory.create).toHaveBeenCalledTimes(1);
    const createCall = mockTx.handHistory.create.mock.calls[0][0];
    expect(createCall.data.roomCode).toBe('ABCDEF');
    expect(createCall.data.handNumber).toBe(1);
    expect(createCall.data.playerCount).toBe(2);

    // Both users updated
    expect(mockTx.user.update).toHaveBeenCalledTimes(2);

    // Winner (p1): +20 profit (won 40, bet 20), totalWins +1
    const p1Update = mockTx.user.update.mock.calls[0][0];
    expect(p1Update.where.id).toBe('p1');
    expect(p1Update.data.totalHands).toBe(6);
    expect(p1Update.data.totalWins).toBe(3);
    expect(p1Update.data.maxSingleWin).toBe(BigInt(40)); // 40 > 30

    // Loser (p2): -20 profit, no win
    const p2Update = mockTx.user.update.mock.calls[1][0];
    expect(p2Update.where.id).toBe('p2');
    expect(p2Update.data.totalHands).toBe(6);
    expect(p2Update.data.totalWins).toBeUndefined(); // not a winner
  });

  it('should update bestHandRank when lower (better)', async () => {
    const state: EngineGameState = {
      roomCode: 'ROOM01',
      handNumber: 1,
      stage: GameStage.SETTLE,
      dealerSeatIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
      actionTimeout: 30,
      deck: [],
      communityCards: [],
      players: [
        {
          playerId: 'p1',
          seatIndex: 0,
          chips: 1000,
          holeCards: null,
          status: 'playing',
          currentRoundBet: 0,
          totalHandBet: 20,
          hasActedThisRound: false,
        },
      ],
      currentPlayerIndex: null,
      pots: [{ amount: 20, eligiblePlayerIds: ['p1'] }],
      roundMaxBet: 0,
      lastRaiseAmount: 20,
      handStartTime: Date.now(),
    };

    const settlement: HandSettlement = {
      winners: [{ playerId: 'p1', amount: 20 }],
      showdownHands: new Map([
        ['p1', { rank: 2, rankName: 'Straight Flush', bestCards: [], keyValues: [9] }],
      ]),
    };

    mockTx.user.findUnique.mockResolvedValue({
      id: 'p1',
      totalHands: 0,
      totalWins: 0,
      totalProfit: BigInt(0),
      maxSingleWin: BigInt(0),
      bestHandRank: 5, // current best is 5
    });

    await service.saveHandResult('ROOM01', state, settlement);

    const update = mockTx.user.update.mock.calls[0][0];
    expect(update.data.bestHandRank).toBe(2); // rank 2 < 5, so updated
  });
});
