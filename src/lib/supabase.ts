import 'react-native-url-polyfill/auto';
import { createClient, Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://qtgkfbccpvsiygzbuusz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Z2tmYmNjcHZzaXlnemJ1dXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzM2NTAsImV4cCI6MjA3NjMwOTY1MH0.3TqiJoHpfvAX5weJ66-9p6VFrPRg0qgS9QGiA3Lcj5o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Database types
export type TodoRow = {
  id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  completed: boolean;
  notify_enabled: boolean | null;
  notification_id: string | null;
  repeat: string | null;
  list_id: string | null;
  user_id: string | null;
};

export type ListRow = {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  user_id: string | null;
};
