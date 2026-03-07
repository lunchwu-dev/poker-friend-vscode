import { create } from 'zustand';
import type { RoomState, SeatInfo, RoomConfig } from '@poker-friends/shared';

interface RoomStoreState {
  roomCode: string | null;
  config: RoomConfig | null;
  hostId: string | null;
  seats: SeatInfo[];
  isPlaying: boolean;

  setRoom: (state: RoomState) => void;
  updateSeats: (seats: SeatInfo[]) => void;
  setPlaying: (v: boolean) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  roomCode: null,
  config: null,
  hostId: null,
  seats: [],
  isPlaying: false,

  setRoom: (rs: RoomState) =>
    set({
      roomCode: rs.roomCode,
      config: rs.config,
      hostId: rs.hostId,
      seats: rs.seats,
      isPlaying: rs.isPlaying,
    }),

  updateSeats: (seats: SeatInfo[]) => set({ seats }),
  setPlaying: (v: boolean) => set({ isPlaying: v }),
  clearRoom: () =>
    set({ roomCode: null, config: null, hostId: null, seats: [], isPlaying: false }),
}));
