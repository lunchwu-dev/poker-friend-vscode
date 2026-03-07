import { RoomService } from '../room.service';

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(() => {
    service = new RoomService();
  });

  const defaultConfig = {
    maxPlayers: 6,
    smallBlind: 10,
    bigBlind: 20,
    minBuyin: 400,
    maxBuyin: 2000,
    actionTimeout: 30,
  };

  describe('createRoom', () => {
    it('should create a room with correct initial state', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);

      expect(room.roomCode).toHaveLength(6);
      expect(room.hostId).toBe('host-1');
      expect(room.config).toEqual(defaultConfig);
      expect(room.seats).toHaveLength(6);
      expect(room.seats.every((s) => s.status === 'empty')).toBe(true);
      expect(room.isPlaying).toBe(false);
      expect(room.players.size).toBe(1);
    });

    it('should generate unique room codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const room = service.createRoom(`h-${i}`, 'N', 'a', `s-${i}`, defaultConfig);
        codes.add(room.roomCode);
      }
      expect(codes.size).toBe(20);
    });
  });

  describe('joinRoom', () => {
    it('should add a player to the room', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      service.joinRoom(room.roomCode, 'p2', 'Player2', 'av2', 'sock-2');

      expect(room.players.size).toBe(2);
      expect(room.players.get('p2')?.nickname).toBe('Player2');
    });

    it('should throw for non-existent room', () => {
      expect(() =>
        service.joinRoom('XXXXXX', 'p2', 'Player2', 'av2', 'sock-2'),
      ).toThrow('Room not found');
    });
  });

  describe('leaveRoom', () => {
    it('should remove player and delete empty room', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      service.leaveRoom(room.roomCode, 'host-1');

      expect(service.getRoom(room.roomCode)).toBeUndefined();
    });

    it('should stand up a seated player on leave', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      service.joinRoom(room.roomCode, 'p2', 'P2', 'a2', 's2');
      service.sitDown(room.roomCode, 'host-1', 0, 1000);

      service.leaveRoom(room.roomCode, 'host-1');

      expect(room.seats[0].status).toBe('empty');
      expect(room.seats[0].playerId).toBeNull();
    });
  });

  describe('sitDown / standUp', () => {
    it('should seat a player at the specified index', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      const seat = service.sitDown(room.roomCode, 'host-1', 2, 1000);

      expect(seat.seatIndex).toBe(2);
      expect(seat.playerId).toBe('host-1');
      expect(seat.chips).toBe(1000);
      expect(seat.status).toBe('seated');
    });

    it('should reject sitting at occupied seat', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      service.joinRoom(room.roomCode, 'p2', 'P2', 'a2', 's2');
      service.sitDown(room.roomCode, 'host-1', 0, 1000);

      expect(() => service.sitDown(room.roomCode, 'p2', 0, 1000)).toThrow(
        'Seat occupied',
      );
    });

    it('should reject double seating', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      service.sitDown(room.roomCode, 'host-1', 0, 1000);

      expect(() => service.sitDown(room.roomCode, 'host-1', 1, 1000)).toThrow(
        'Already seated',
      );
    });

    it('should reject sitting during game', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      service.setPlaying(room.roomCode, true);

      expect(() => service.sitDown(room.roomCode, 'host-1', 0, 1000)).toThrow(
        'Game in progress',
      );
    });

    it('should stand up correctly', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      service.sitDown(room.roomCode, 'host-1', 0, 1000);
      service.standUp(room.roomCode, 'host-1');

      expect(room.seats[0].status).toBe('empty');
      expect(room.seats[0].playerId).toBeNull();
    });
  });

  describe('getRoomState', () => {
    it('should return null for non-existent room', () => {
      expect(service.getRoomState('XXXXXX')).toBeNull();
    });

    it('should return serialisable state', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      const state = service.getRoomState(room.roomCode);

      expect(state).not.toBeNull();
      expect(state!.roomCode).toBe(room.roomCode);
      expect(state!.hostId).toBe('host-1');
      expect(state!.seats).toHaveLength(6);
    });
  });

  describe('getSeatedPlayers', () => {
    it('should return only seated players', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      service.joinRoom(room.roomCode, 'p2', 'P2', 'a2', 's2');
      service.joinRoom(room.roomCode, 'p3', 'P3', 'a3', 's3');
      service.sitDown(room.roomCode, 'host-1', 0, 1000);
      service.sitDown(room.roomCode, 'p2', 3, 800);

      const seated = service.getSeatedPlayers(room.roomCode);
      expect(seated).toHaveLength(2);
      expect(seated[0].playerId).toBe('host-1');
      expect(seated[1].playerId).toBe('p2');
    });
  });

  describe('updateSeatChips', () => {
    it('should update chips for a seated player', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      service.sitDown(room.roomCode, 'host-1', 0, 1000);
      service.updateSeatChips(room.roomCode, 'host-1', 1500);

      expect(room.seats[0].chips).toBe(1500);
    });
  });

  describe('socket tracking', () => {
    it('should update and retrieve socket IDs', () => {
      const room = service.createRoom('host-1', 'Host', 'av1', 'sock-1', defaultConfig);
      expect(service.getSocketId(room.roomCode, 'host-1')).toBe('sock-1');

      service.updateSocketId(room.roomCode, 'host-1', 'sock-new');
      expect(service.getSocketId(room.roomCode, 'host-1')).toBe('sock-new');
    });
  });
});
