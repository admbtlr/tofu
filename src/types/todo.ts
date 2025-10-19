export type TodoId = string;

export interface Todo {
  id: TodoId;
  title: string;
  notes?: string;
  dueDate?: string; // ISO string
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
  completed: boolean;
  notifyEnabled?: boolean; // Whether to send notification for this todo
  notificationId?: string; // ID of the scheduled notification
}

export type FilterType = 'today' | 'all' | 'completed';
export type SortType = 'default' | 'dueDate' | 'alphabetical';

export interface TodoStore {
  todos: Todo[];
  query: string;
  filter: FilterType;
  sort: SortType;
  pendingRemovalIds: Set<TodoId>; // Track todos that are animating out

  // Actions
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  updateTodo: (id: TodoId, updates: Partial<Todo>) => void;
  deleteTodo: (id: TodoId) => void;
  toggleComplete: (id: TodoId) => void;
  bulkSet: (todos: Todo[]) => void;
  setQuery: (query: string) => void;
  setFilter: (filter: FilterType) => void;
  setSort: (sort: SortType) => void;
  addPendingRemoval: (id: TodoId) => void;
  removePendingRemoval: (id: TodoId) => void;

  // Computed
  visibleTodos: () => Todo[];
}
