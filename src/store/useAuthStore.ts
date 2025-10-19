import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { signIn, signUp, signOut, getCurrentUser, supabase } from '@/lib/supabase';

interface AuthStore {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  setUser: (user: User | null) => {
    set({ user });
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { user, error } = await signIn(email, password);

      if (error) {
        throw new Error(error.message || 'Failed to sign in');
      }

      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { user, error } = await signUp(email, password);

      if (error) {
        throw new Error(error.message || 'Failed to sign up');
      }

      // Note: Depending on Supabase settings, user might need to confirm email
      // If email confirmation is required, user will be null here
      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await signOut();

      if (error) {
        throw new Error(error.message || 'Failed to sign out');
      }

      set({ user: null, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  initialize: async () => {
    set({ loading: true });
    try {
      // Get current user from Supabase
      const user = await getCurrentUser();
      set({ user, initialized: true, loading: false });

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user || null });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ user: null, initialized: true, loading: false });
    }
  },
}));
