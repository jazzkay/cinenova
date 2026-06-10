import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  quiz_completed: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (token) => {
        localStorage.setItem("cinenova_token", token);
        set({ token });
        const { data } = await api.get("/auth/me");
        set({ user: data });
      },

      logout: () => {
        localStorage.removeItem("cinenova_token");
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data });
        } catch {
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: "cinenova-auth",
      partialize: (s) => ({ token: s.token }),
    }
  )
);
