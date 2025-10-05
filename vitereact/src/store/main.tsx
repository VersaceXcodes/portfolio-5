import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io } from 'socket.io-client';
import axios from 'axios';

// Define types for our state
interface User {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
}

interface AuthenticationState {
  current_user: User | null;
  auth_token: string | null;
  authentication_status: {
    is_authenticated: boolean;
    is_loading: boolean;
  };
  error_message: string | null;
}

interface Portfolio {
  id: string;
  title: string;
  template_id: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Notification {
  type: string;
  message: string;
  timestamp: string;
}

interface AppState {
  authentication_state: AuthenticationState;
  user_portfolio: Portfolio | null;
  app_notification: Notification | null;

  // Actions
  login_user: (email: string, password: string) => Promise<void>;
  logout_user: () => void;
  initialize_auth: () => Promise<void>;
  clear_auth_error: () => void;
}

let socket;

// Create store with Zustand & persist middleware
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      authentication_state: {
        current_user: null,
        auth_token: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: true,
        },
        error_message: null,
      },
      user_portfolio: null,
      app_notification: null,

      // Actions
      login_user: async (email, password) => {
          set(() => ({
            authentication_state: {
              current_user: null,
              auth_token: null,
              authentication_status: {
                is_authenticated: false,
                is_loading: true,
              },
              error_message: null,
            },
          }));

        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/login`,
            { email, password }
          );

          const { user, token } = response.data;

          set(() => ({
            authentication_state: {
              current_user: user,
              auth_token: token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
          }));

          // Initialize socket connection after login
          if (!socket) {
            socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', {
              auth: { token },
            });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';

          set(() => ({
            authentication_state: {
              current_user: null,
              auth_token: null,
              authentication_status: {
                is_authenticated: false,
                is_loading: false,
              },
              error_message: errorMessage,
            },
          }));
          throw new Error(errorMessage);
        }
      },

      logout_user: () => {
        if (socket) {
          socket.disconnect();
          socket = null;
        }

        set(() => ({
          authentication_state: {
            current_user: null,
            auth_token: null,
            authentication_status: {
              is_authenticated: false,
              is_loading: false,
            },
            error_message: null,
          },
        }));
      },

      initialize_auth: async () => {
        const { authentication_state } = get();
        const token = authentication_state.auth_token;
        
        if (!token) {
          set(() => ({
            authentication_state: {
              current_user: null,
              auth_token: null,
              authentication_status: {
                is_authenticated: false,
                is_loading: false,
              },
              error_message: null,
            },
          }));
          return;
        }

        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/verify`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const { user } = response.data;

          set(() => ({
            authentication_state: {
              current_user: user,
              auth_token: token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
          }));

          // Initialize socket connection if authenticated
          if (!socket) {
            socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', {
              auth: { token },
            });
          }
        } catch {
          set(() => ({
            authentication_state: {
              current_user: null,
              auth_token: null,
              authentication_status: {
                is_authenticated: false,
                is_loading: false,
              },
              error_message: null,
            },
          }));
        }
      },

      clear_auth_error: () => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            error_message: null,
          },
        }));
      },
    }),
    {
      name: 'showcasecraft-auth',
      partialize: (state) => ({
        authentication_state: {
          current_user: state.authentication_state.current_user,
          auth_token: state.authentication_state.auth_token,
          authentication_status: {
            is_authenticated: state.authentication_state.authentication_status.is_authenticated,
            is_loading: false,
          },
          error_message: null,
        },
      }),
    }
  )
);