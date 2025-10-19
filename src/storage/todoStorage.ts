import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '@/types/todo';
import { supabase, TodoRow } from '@/lib/supabase';

const THEME_KEY = '@theme';

// Helper to convert database row to Todo type
const rowToTodo = (row: TodoRow): Todo => ({
  id: row.id,
  title: row.title,
  notes: row.notes || undefined,
  dueDate: row.due_date || undefined,
  createdAt: row.created_at,
  completedAt: row.completed_at || undefined,
  completed: row.completed,
  notifyEnabled: row.notify_enabled || undefined,
  notificationId: row.notification_id || undefined,
});

// Helper to convert Todo to database row format
const todoToRow = (todo: Todo): Partial<TodoRow> => ({
  id: todo.id,
  title: todo.title,
  notes: todo.notes || null,
  due_date: todo.dueDate || null,
  created_at: todo.createdAt,
  completed_at: todo.completedAt || null,
  completed: todo.completed,
  notify_enabled: todo.notifyEnabled || null,
  notification_id: todo.notificationId || null,
});

export const loadTodos = async (): Promise<Todo[]> => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading todos from Supabase:', error);
      return [];
    }

    return (data || []).map(rowToTodo);
  } catch (e) {
    console.error('Error loading todos:', e);
    return [];
  }
};

// Note: This now syncs the entire todo list to Supabase
// In a production app, you'd want to update individual todos instead
export const saveTodos = async (todos: Todo[]): Promise<void> => {
  // This function is kept for backward compatibility with the store
  // But we'll handle saves differently with individual operations
  console.warn('saveTodos called - consider using individual operations instead');
};

// New individual CRUD operations
export const createTodo = async (todo: Todo): Promise<void> => {
  try {
    // Note: user_id will be automatically set by the database default (auth.uid())
    // The RLS policies ensure users can only create todos for themselves
    const { error } = await supabase
      .from('todos')
      .insert([todoToRow(todo)]);

    if (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  } catch (e) {
    console.error('Error creating todo:', e);
    throw e;
  }
};

export const updateTodo = async (id: string, updates: Partial<Todo>): Promise<void> => {
  try {
    const partialRow: Partial<TodoRow> = {};

    if (updates.title !== undefined) partialRow.title = updates.title;
    if (updates.notes !== undefined) partialRow.notes = updates.notes || null;
    if (updates.dueDate !== undefined) partialRow.due_date = updates.dueDate || null;
    if (updates.completedAt !== undefined) partialRow.completed_at = updates.completedAt || null;
    if (updates.completed !== undefined) partialRow.completed = updates.completed;
    if (updates.notifyEnabled !== undefined) partialRow.notify_enabled = updates.notifyEnabled || null;
    if (updates.notificationId !== undefined) partialRow.notification_id = updates.notificationId || null;

    const { error } = await supabase
      .from('todos')
      .update(partialRow)
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  } catch (e) {
    console.error('Error updating todo:', e);
    throw e;
  }
};

export const deleteTodo = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  } catch (e) {
    console.error('Error deleting todo:', e);
    throw e;
  }
};

export const loadTheme = async (): Promise<'light' | 'dark' | 'system'> => {
  try {
    const theme = await AsyncStorage.getItem(THEME_KEY);
    return (theme as 'light' | 'dark' | 'system') || 'system';
  } catch (e) {
    console.error('Error loading theme:', e);
    return 'system';
  }
};

export const saveTheme = async (
  theme: 'light' | 'dark' | 'system'
): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error('Error saving theme:', e);
  }
};
