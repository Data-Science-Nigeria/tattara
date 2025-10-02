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

        setAuth: (auth, ttlInMs = 1000 * 60 * 60) => {
          // Default TTL = 1 hour
          const expiry = Date.now() + ttlInMs;
          localStorage.setItem('auth_expiry', expiry.toString());
          set({ auth });
        },

        clearAuth: () => {
          localStorage.removeItem('auth_expiry');
          set({ auth: initialAuth });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ auth: state.auth }),

        onRehydrateStorage: () => (state) => {
          const expiry = localStorage.getItem('auth_expiry');
          const now = Date.now();

          if (expiry && now > Number(expiry)) {
            // Token has expired
            state?.clearAuth();
          }
        },
      }
    ),
    {
      name: 'Auth Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
