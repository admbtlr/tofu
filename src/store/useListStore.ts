import { create } from 'zustand';
import { List, ListId, EVERYTHING_LIST_ID } from '@/types/list';
import {
  loadLists,
  createList as createListInDb,
  updateList as updateListInDb,
  deleteList as deleteListFromDb,
  createDefaultList,
} from '@/storage/listStorage';

interface ListStore {
  lists: List[];
  selectedListId: string; // Can be a real list ID or EVERYTHING_LIST_ID
  initialized: boolean;

  // Actions
  addList: (list: Omit<List, 'id' | 'createdAt'>) => Promise<void>;
  updateList: (id: ListId, updates: Partial<List>) => Promise<void>;
  deleteList: (id: ListId) => Promise<void>;
  setSelectedList: (listId: string) => void;
  bulkSet: (lists: List[]) => void;
  initialize: () => Promise<void>;
}

export const useListStore = create<ListStore>((set, get) => ({
  lists: [],
  selectedListId: EVERYTHING_LIST_ID,
  initialized: false,

  addList: async (listData) => {
    const { generateId } = await import('@/utils/validators');
    const { createDateString } = await import('@/utils/date');

    const newList: List = {
      ...listData,
      id: generateId(),
      createdAt: createDateString(new Date()),
    };

    set(state => {
      const newLists = [...state.lists, newList];
      createListInDb(newList).catch(error => {
        console.error('Failed to create list:', error);
      });
      return { lists: newLists };
    });
  },

  updateList: async (id, updates) => {
    set(state => {
      const newLists = state.lists.map(list =>
        list.id === id ? { ...list, ...updates } : list
      );
      updateListInDb(id, updates).catch(error => {
        console.error('Failed to update list:', error);
      });
      return { lists: newLists };
    });
  },

  deleteList: async (id) => {
    set(state => {
      const listToDelete = state.lists.find(l => l.id === id);

      // Don't allow deleting default list
      if (listToDelete?.isDefault) {
        console.error('Cannot delete default list');
        return state;
      }

      const newLists = state.lists.filter(list => list.id !== id);

      // If we're deleting the currently selected list, switch to Everything
      const newSelectedListId = state.selectedListId === id
        ? EVERYTHING_LIST_ID
        : state.selectedListId;

      deleteListFromDb(id).catch(error => {
        console.error('Failed to delete list:', error);
      });

      return {
        lists: newLists,
        selectedListId: newSelectedListId,
      };
    });
  },

  setSelectedList: (listId) => {
    set({ selectedListId: listId });
  },

  bulkSet: (lists) => {
    set({ lists });
  },

  initialize: async () => {
    try {
      let lists = await loadLists();

      // If no lists exist, create default list
      if (lists.length === 0) {
        const defaultList = await createDefaultList();
        lists = [defaultList];

        // Also need to migrate existing todos to this list
        const { migrateTodosToDefaultList } = await import('@/storage/listStorage');
        if (migrateTodosToDefaultList) {
          await migrateTodosToDefaultList(defaultList.id);
        }
      }

      const defaultList = lists.find(l => l.isDefault);
      set({
        lists,
        selectedListId: defaultList?.id || EVERYTHING_LIST_ID,
        initialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize lists:', error);
      set({ initialized: true });
    }
  },
}));

export const initializeListStore = async () => {
  await useListStore.getState().initialize();
};
