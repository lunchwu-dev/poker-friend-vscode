import { create } from 'zustand';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface ConnectionStoreState {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}

export const useConnectionStore = create<ConnectionStoreState>((set) => ({
  status: 'disconnected',
  setStatus: (status) => set({ status }),
}));
