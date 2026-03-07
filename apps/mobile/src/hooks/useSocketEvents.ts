import { useEffect, useRef } from 'react';
import { SocketEvent } from '@poker-friends/shared';
import { socketService } from '../services/socket';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useGameStore } from '../stores/gameStore';

/**
 * Connects Socket.IO events to Zustand stores.
 * Mount once (e.g. after login).
 */
export function useSocketEvents() {
  const userId = useAuthStore((s) => s.user?.id);
  const unsubs = useRef<Array<() => void>>([]);

  useEffect(() => {
    const { setRoom, clearRoom } = useRoomStore.getState();
    const game = useGameStore.getState();

    unsubs.current.push(
      socketService.on(SocketEvent.RoomState, (data) => {
        setRoom(data);
        if (!data.isPlaying) {
          game.resetHand();
        }
      }),

      socketService.on(SocketEvent.GameHandStart, (data) => {
        game.startHand(data.handNumber, data.dealerSeatIndex, data.seats);
      }),

      socketService.on(SocketEvent.GameDealHole, (data) => {
        game.setHoleCards(data.cards);
      }),

      socketService.on(SocketEvent.GameDealCommunity, (data) => {
        game.addCommunityCards(data.cards, data.stage);
      }),

      socketService.on(SocketEvent.GameActionOn, (data) => {
        game.setActionOn(
          data.seatIndex,
          data.playerId,
          data.availableActions,
          data.timeoutMs,
        );
      }),

      socketService.on(SocketEvent.GamePlayerActed, (data) => {
        game.playerActed(data.seatIndex, data.action, data.amount, data.potTotal);
      }),

      socketService.on(SocketEvent.GameHandResult, (data) => {
        game.setHandResult(data);
      }),
    );

    return () => {
      unsubs.current.forEach((fn) => fn());
      unsubs.current = [];
    };
  }, [userId]);
}
