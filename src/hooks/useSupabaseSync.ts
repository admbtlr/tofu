import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTodoStore } from '@/store/useTodoStore';
import { loadTodos } from '@/storage/todoStorage';
import { User } from '@supabase/supabase-js';

/**
 * Hook to set up realtime synchronization with Supabase.
 * This enables multi-device sync - changes made on one device
 * will automatically appear on other devices in real-time.
 *
 * Only subscribes when user is authenticated.
 */
export const useSupabaseSync = (user: User | null) => {
  useEffect(() => {
    // Only set up subscription if user is authenticated
    if (!user) {
      return;
    }

    // Subscribe to all changes on the todos table
    const channel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'todos',
        },
        async (payload) => {
          // Instead of trying to merge individual changes (which can be complex),
          // we simply reload all todos from the database
          // This is simpler and ensures consistency
          try {
            const todos = await loadTodos();
            useTodoStore.getState().bulkSet(todos);
          } catch (error) {
            console.error('Failed to reload todos after realtime event:', error);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or when user changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Re-subscribe if user changes
};
