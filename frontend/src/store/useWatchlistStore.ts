import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

interface WatchlistState {
  ids: Set<number>;
  add: (tmdbId: number) => Promise<void>;
  remove: (tmdbId: number) => Promise<void>;
  has: (tmdbId: number) => boolean;
  hydrate: (ids: number[]) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      ids: new Set<number>(),

      add: async (tmdbId) => {
        set((s) => ({ ids: new Set([...s.ids, tmdbId]) }));
        try {
          await api.post(`/users/me/watchlist/${tmdbId}`);
        } catch {
          set((s) => {
            const next = new Set(s.ids);
            next.delete(tmdbId);
            return { ids: next };
          });
        }
      },

      remove: async (tmdbId) => {
        set((s) => {
          const next = new Set(s.ids);
          next.delete(tmdbId);
          return { ids: next };
        });
        try {
          await api.delete(`/users/me/watchlist/${tmdbId}`);
        } catch {
          set((s) => ({ ids: new Set([...s.ids, tmdbId]) }));
        }
      },

      has: (tmdbId) => get().ids.has(tmdbId),

      hydrate: (ids) => set({ ids: new Set(ids) }),
    }),
    {
      name: "cinenova-watchlist",
      storage: {
        getItem: (name) => {
          const s = localStorage.getItem(name);
          if (!s) return null;
          const parsed = JSON.parse(s);
          if (parsed.state?.ids) {
            parsed.state.ids = new Set(parsed.state.ids);
          }
          return parsed;
        },
        setItem: (name, value) => {
          const v = { ...value, state: { ...value.state, ids: [...value.state.ids] } };
          localStorage.setItem(name, JSON.stringify(v));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
