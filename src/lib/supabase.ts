import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
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
  user_id: string | null;
};
