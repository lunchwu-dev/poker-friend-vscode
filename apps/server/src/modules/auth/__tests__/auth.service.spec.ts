import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService, JwtPayload } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-1',
    nickname: 'TestPlayer',
    avatar: 'default_01',
    coins: BigInt(10000),
    totalHands: 0,
    totalWins: 0,
    totalProfit: BigInt(0),
    bestHandRank: null,
    maxSingleWin: BigInt(0),
    guestDeviceId: 'device-abc',
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  describe('guestLogin', () => {
    it('should create a new user for unknown device', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.guestLogin('device-abc', 'TestPlayer');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { nickname: 'TestPlayer', guestDeviceId: 'device-abc' },
      });
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-1');
      expect(result.user.nickname).toBe('TestPlayer');
      expect(result.user.coins).toBe(10000);
    });

    it('should return existing user for known device', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.guestLogin('device-abc', 'TestPlayer');

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-1');
    });

    it('should sign JWT with correct payload', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await service.guestLogin('device-abc', 'TestPlayer');

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        nickname: 'TestPlayer',
      } satisfies JwtPayload);
    });
  });

  describe('verifyToken', () => {
    it('should return payload for valid token', () => {
      const payload: JwtPayload = { sub: 'user-1', nickname: 'Test' };
      (jwtService.verify as jest.Mock).mockReturnValue(payload);

      expect(service.verifyToken('valid-token')).toEqual(payload);
    });

    it('should return null for invalid token', () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid');
      });

      expect(service.verifyToken('bad-token')).toBeNull();
    });
  });
});
