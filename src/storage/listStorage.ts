import { List } from '@/types/list';
import { supabase, ListRow } from '@/lib/supabase';
import { generateId } from '@/utils/validators';
import { createDateString } from '@/utils/date';

// Helper to convert database row to List type
const rowToList = (row: ListRow): List => ({
  id: row.id,
  name: row.name,
  isDefault: row.is_default,
  createdAt: row.created_at,
});

// Helper to convert List to database row format
const listToRow = (list: List): Partial<ListRow> => ({
  id: list.id,
  name: list.name,
  is_default: list.isDefault,
  created_at: list.createdAt,
});

export const loadLists = async (): Promise<List[]> => {
  try {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading lists from Supabase:', error);
      return [];
    }

    return (data || []).map(rowToList);
  } catch (e) {
    console.error('Error loading lists:', e);
    return [];
  }
};

export const createList = async (list: List): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('lists')
      .insert([{
        ...listToRow(list),
        user_id: user.id,
      }]);

    if (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  } catch (e) {
    console.error('Error creating list:', e);
    throw e;
  }
};

export const updateList = async (id: string, updates: Partial<List>): Promise<void> => {
  try {
    const partialRow: Partial<ListRow> = {};

    if (updates.name !== undefined) partialRow.name = updates.name;
    if (updates.isDefault !== undefined) partialRow.is_default = updates.isDefault;

    const { error } = await supabase
      .from('lists')
      .update(partialRow)
      .eq('id', id);

    if (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  } catch (e) {
    console.error('Error updating list:', e);
    throw e;
  }
};

export const deleteList = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting list:', error);
      throw error;
    }
  } catch (e) {
    console.error('Error deleting list:', e);
    throw e;
  }
};

// Create default "Personal" list for user
export const createDefaultList = async (): Promise<List> => {
  const defaultList: List = {
    id: generateId(),
    name: 'Personal',
    isDefault: true,
    createdAt: createDateString(new Date()),
  };

  await createList(defaultList);
  return defaultList;
};

// Migrate existing todos (with no list_id) to the default list
export const migrateTodosToDefaultList = async (defaultListId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('todos')
      .update({ list_id: defaultListId })
      .is('list_id', null);

    if (error) {
      console.error('Error migrating todos to default list:', error);
      throw error;
    }
  } catch (e) {
    console.error('Error migrating todos:', e);
    throw e;
  }
};
