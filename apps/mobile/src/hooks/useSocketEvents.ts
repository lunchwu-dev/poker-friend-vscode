import { useEffect, useRef } from 'react';
import { SocketEvent } from '@poker-friends/shared';
import { socketService } from '../services/socket';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useGameStore } from '../stores/gameStore';
import { useConnectionStore } from '../stores/connectionStore';

/**
 * Connects Socket.IO events to Zustand stores.
 * Mount once at app level (e.g. in RootNavigator).
 */
export function useSocketEvents() {
  const userId = useAuthStore((s) => s.user?.id);
  const unsubs = useRef<Array<() => void>>([]);

  useEffect(() => {
    const { setRoom, clearRoom } = useRoomStore.getState();
    const game = useGameStore.getState();
    const { setStatus } = useConnectionStore.getState();

    unsubs.current.push(
      socketService.on('connect', () => {
        setStatus('connected');
      }),

      socketService.on('disconnect', () => {
        setStatus('reconnecting');
      }),

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
