import { create } from 'zustand';
import type { UserProfile } from '@poker-friends/shared';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  guestLogin: (nickname: string, serverUrl: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: false,
  error: null,

  guestLogin: async (nickname: string, serverUrl: string) => {
    set({ isLoading: true, error: null });
    try {
      const deviceId = `rn-${nickname}-${Date.now()}`;
      const res = await fetch(`${serverUrl}/auth/guest-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, nickname }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ token: data.token, user: data.user, isLoading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      set({ isLoading: false, error: msg });
    }
  },

  logout: () => set({ token: null, user: null }),
}));
