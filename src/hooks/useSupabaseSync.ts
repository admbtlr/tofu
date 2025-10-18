import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTodoStore } from '@/store/useTodoStore';
import { loadTodos } from '@/storage/todoStorage';

/**
 * Hook to set up realtime synchronization with Supabase.
 * This enables multi-device sync - changes made on one device
 * will automatically appear on other devices in real-time.
 */
export const useSupabaseSync = () => {
  useEffect(() => {
    console.log('Setting up Supabase realtime subscription...');

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
          console.log('Realtime change received:', payload.eventType);

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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to realtime changes');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up Supabase realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, []);
};
