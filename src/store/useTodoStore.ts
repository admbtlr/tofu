import { create } from 'zustand';
import { Todo, TodoId, FilterType, SortType, TodoStore, RepeatType } from '@/types/todo';
import { generateId } from '@/utils/validators';
import { createDateString } from '@/utils/date';
import {
  loadTodos,
  createTodo,
  updateTodo as updateTodoInDb,
  deleteTodo as deleteTodoFromDb,
} from '@/storage/todoStorage';
import {
  scheduleNotification,
  cancelNotification,
} from '@/utils/notifications';

// Helper function to calculate the next due date based on repeat type
const calculateNextDueDate = (currentDueDate: Date, repeatType: RepeatType): Date | null => {
  const nextDate = new Date(currentDueDate);

  switch (repeatType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      return nextDate;

    case 'weekdays':
      // Move to next weekday (Monday-Friday)
      nextDate.setDate(nextDate.getDate() + 1);
      const dayOfWeek = nextDate.getDay();

      // If it's Saturday, move to Monday
      if (dayOfWeek === 6) {
        nextDate.setDate(nextDate.getDate() + 2);
      }
      // If it's Sunday, move to Monday
      else if (dayOfWeek === 0) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      return nextDate;

    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      return nextDate;

    case 'never':
    default:
      return null;
  }
};

const filterTodos = (
  todos: Todo[],
  query: string,
  filter: FilterType,
  pendingRemovalIds: Set<string>,
  selectedListId?: string
): Todo[] => {
  let filtered = todos;

  // Apply list filter (unless "Everything" is selected)
  const { EVERYTHING_LIST_ID } = require('@/types/list');
  if (selectedListId && selectedListId !== EVERYTHING_LIST_ID) {
    // Show todos that belong to this list OR have no list assigned (for backwards compatibility)
    filtered = filtered.filter(todo => todo.listId === selectedListId || !todo.listId);
  }

  // Apply text search
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    filtered = filtered.filter(
      todo =>
        todo.title.toLowerCase().includes(searchTerm) ||
        todo.notes?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply status filter
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'today':
      // Show uncompleted todos that are due today or earlier
      // Also show todos that are pending removal (animating out)
      filtered = filtered.filter(todo => {
        if (pendingRemovalIds.has(todo.id)) return true;
        if (todo.completed) return false;
        if (!todo.dueDate) return false;
        const dueDate = new Date(todo.dueDate);
        return dueDate <= now;
      });
      break;
    case 'all':
      // Show all uncompleted todos
      // Also show todos that are pending removal (animating out)
      filtered = filtered.filter(todo => {
        if (pendingRemovalIds.has(todo.id)) return true;
        return !todo.completed;
      });
      break;
    case 'done':
      // Show all completed todos
      filtered = filtered.filter(todo => todo.completed);
      break;
    default:
      break;
  }

  return filtered;
};

const sortTodos = (todos: Todo[], sort: SortType, pendingRemovalIds: Set<string>): Todo[] => {
  const sorted = [...todos];

  switch (sort) {
    case 'dueDate':
      return sorted.sort((a, b) => {
        // Don't reorder pending removal todos
        if (pendingRemovalIds.has(a.id) || pendingRemovalIds.has(b.id)) return 0;

        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    case 'alphabetical':
      return sorted.sort((a, b) => {
        // Don't reorder pending removal todos
        if (pendingRemovalIds.has(a.id) || pendingRemovalIds.has(b.id)) return 0;

        return a.title.localeCompare(b.title);
      });
    case 'default':
    default:
      // Active first, then by createdAt desc; Completed by completedAt asc
      return sorted.sort((a, b) => {
        // Don't reorder pending removal todos - keep them in their original position
        if (pendingRemovalIds.has(a.id) || pendingRemovalIds.has(b.id)) return 0;

        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;

        if (!a.completed && !b.completed) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        if (a.completed && b.completed) {
          const aCompletedAt = a.completedAt || a.createdAt;
          const bCompletedAt = b.completedAt || b.createdAt;
          return (
            new Date(aCompletedAt).getTime() - new Date(bCompletedAt).getTime()
          );
        }

        return 0;
      });
  }
};

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  query: '',
  filter: 'today',
  sort: 'default',
  pendingRemovalIds: new Set<string>(),

  addTodo: async (todoData: Omit<Todo, 'id' | 'createdAt'>) => {
    const newTodo: Todo = {
      ...todoData,
      id: generateId(),
      createdAt: createDateString(new Date()),
      completed: false,
    };

    // Schedule notification if enabled
    if (newTodo.notifyEnabled && newTodo.dueDate) {
      const notificationId = await scheduleNotification(
        newTodo.id,
        newTodo.title,
        newTodo.dueDate
      );
      if (notificationId) {
        newTodo.notificationId = notificationId;
      }
    }

    set(state => {
      const newTodos = [...state.todos, newTodo];
      // Optimistically update UI
      createTodo(newTodo).catch(error => {
        console.error('Failed to create todo:', error);
        // Optionally: revert the optimistic update
      });
      return { todos: newTodos };
    });
  },

  updateTodo: async (id: TodoId, updates: Partial<Todo>) => {
    const state = useTodoStore.getState();
    const existingTodo = state.todos.find((todo: Todo) => todo.id === id);

    if (!existingTodo) return;

    // Handle notification changes
    const updatedTodo = { ...existingTodo, ...updates };

    // Cancel existing notification if exists
    if (existingTodo.notificationId) {
      await cancelNotification(existingTodo.notificationId);
    }

    // Schedule new notification if enabled and has due date
    if (updatedTodo.notifyEnabled && updatedTodo.dueDate && !updatedTodo.completed) {
      const notificationId = await scheduleNotification(
        updatedTodo.id,
        updatedTodo.title,
        updatedTodo.dueDate
      );
      if (notificationId) {
        updates.notificationId = notificationId;
      }
    } else {
      updates.notificationId = undefined;
    }

    useTodoStore.setState((state: TodoStore) => {
      const newTodos = state.todos.map((todo: Todo) =>
        todo.id === id ? { ...todo, ...updates } : todo
      );
      // Optimistically update UI
      updateTodoInDb(id, updates).catch(error => {
        console.error('Failed to update todo:', error);
        // Optionally: revert the optimistic update
      });
      return { todos: newTodos };
    });
  },

  deleteTodo: async (id: TodoId) => {
    const state = useTodoStore.getState();
    const todo = state.todos.find((t: Todo) => t.id === id);

    // Cancel notification if exists
    if (todo?.notificationId) {
      await cancelNotification(todo.notificationId);
    }

    useTodoStore.setState((state: TodoStore) => {
      const newTodos = state.todos.filter((todo: Todo) => todo.id !== id);
      // Optimistically update UI
      deleteTodoFromDb(id).catch(error => {
        console.error('Failed to delete todo:', error);
        // Optionally: revert the optimistic update
      });
      return { todos: newTodos };
    });
  },

  toggleComplete: async (id: TodoId) => {
    const state = useTodoStore.getState();
    const todo = state.todos.find((t: Todo) => t.id === id);

    if (!todo) return;

    const completed = !todo.completed;

    // If completing (not uncompleting) and not in done filter, add to pending removal
    if (completed && state.filter !== 'done') {
      state.addPendingRemoval(id);
    }

    // Cancel notification when completing a todo
    if (completed && todo.notificationId) {
      await cancelNotification(todo.notificationId);
    }

    // If completing and has repeat, create a new todo for the next occurrence
    if (completed && todo.repeat && todo.repeat !== 'never' && todo.dueDate) {
      const nextDueDate = calculateNextDueDate(new Date(todo.dueDate), todo.repeat);

      if (nextDueDate) {
        const newTodo: Todo = {
          id: generateId(),
          title: todo.title,
          notes: todo.notes,
          dueDate: createDateString(nextDueDate),
          createdAt: createDateString(new Date()),
          completed: false,
          notifyEnabled: todo.notifyEnabled,
          repeat: todo.repeat,
          listId: todo.listId,
        };

        // Schedule notification for the new todo if enabled
        if (newTodo.notifyEnabled && newTodo.dueDate) {
          const notificationId = await scheduleNotification(
            newTodo.id,
            newTodo.title,
            newTodo.dueDate
          );
          if (notificationId) {
            newTodo.notificationId = notificationId;
          }
        }

        // Add the new todo to the store
        createTodo(newTodo).catch(error => {
          console.error('Failed to create repeat todo:', error);
        });

        useTodoStore.setState((state: TodoStore) => ({
          todos: [...state.todos, newTodo],
        }));
      }
    }

    useTodoStore.setState((state: TodoStore) => {
      const newTodos = state.todos.map((todo: Todo) => {
        if (todo.id === id) {
          const updates = {
            completed,
            completedAt: completed ? createDateString(new Date()) : undefined,
            notificationId: completed ? undefined : todo.notificationId,
          };
          // Optimistically update UI
          updateTodoInDb(id, updates).catch(error => {
            console.error('Failed to toggle complete:', error);
            // Optionally: revert the optimistic update
          });
          return {
            ...todo,
            ...updates,
          };
        }
        return todo;
      });
      return { todos: newTodos };
    });
  },

  bulkSet: (todos: Todo[]) => {
    set({ todos });
    // No need to save when bulk setting (used for initial load)
  },

  setQuery: (query: string) => {
    set({ query });
  },

  setFilter: (filter: FilterType) => {
    set({ filter });
  },

  setSort: (sort: SortType) => {
    set({ sort });
  },

  addPendingRemoval: (id: string) => {
    set(state => {
      const newSet = new Set(state.pendingRemovalIds);
      newSet.add(id);
      return { pendingRemovalIds: newSet };
    });
  },

  removePendingRemoval: (id: string) => {
    set(state => {
      const newSet = new Set(state.pendingRemovalIds);
      newSet.delete(id);
      return { pendingRemovalIds: newSet };
    });
  },

  visibleTodos: (selectedListId?: string) => {
    const { todos, query, filter, sort, pendingRemovalIds } = get();
    const filtered = filterTodos(todos, query, filter, pendingRemovalIds, selectedListId);
    return sortTodos(filtered, sort, pendingRemovalIds);
  },
}));

// Initialize store with persisted data
export const initializeTodoStore = async () => {
  try {
    const savedTodos = await loadTodos();
    useTodoStore.getState().bulkSet(savedTodos);
  } catch (error) {
    console.error('Failed to initialize todo store:', error);
  }
};
