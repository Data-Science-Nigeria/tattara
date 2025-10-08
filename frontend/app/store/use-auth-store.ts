import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Auth = {
  id?: string | null;
  email: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean | null;
  createdAt?: string | null;
  token?: string;
  roles?: Array<string>;
  permissions?: Array<string>;
};

const initialAuth: Auth = {
  email: '',
  token: '',
  roles: [],
  permissions: [],
};

interface AuthState {
  auth: Auth;
  setAuth: (auth: Auth, ttlInMs?: number) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        auth: initialAuth,

        setAuth: (auth) => {
          set({ auth });
        },

        clearAuth: () => {
          set({ auth: initialAuth });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ auth: state.auth }),
      }
    ),
    {
      name: 'Auth Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
