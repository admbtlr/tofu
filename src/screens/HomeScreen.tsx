import { RootStackParamList } from '@/app/navigation/RootNavigator';
import EmptyState from '@/components/EmptyState';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import TodoItem from '@/components/TodoItem';
import { useTodoStore } from '@/store/useTodoStore';
import { FilterType, Todo } from '@/types/todo';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Chip, Portal, Snackbar, useTheme, FAB } from 'react-native-paper';

const BORDER_RADIUS = 12;

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [lastDeletedTodo, setLastDeletedTodo] = useState<Todo | null>(null);

  const {
    query,
    filter,
    setQuery,
    setFilter,
    visibleTodos,
    addTodo,
    deleteTodo,
  } = useTodoStore();

  const todos = visibleTodos();

  useFocusEffect(
    useCallback(() => {
      // Refresh data when screen comes into focus
    }, [])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh - in a real app you might re-fetch from server
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleAddTodo = () => {
    navigation.navigate('EditTodo', {});
  };

  const handleEditTodo = (todoId: string) => {
    navigation.navigate('EditTodo', { todoId });
  };

  const handleDeleteTodo = (todo: Todo) => {
    setLastDeletedTodo(todo);
    deleteTodo(todo.id);
    setSnackbarMessage(`"${todo.title}" deleted`);
    setSnackbarVisible(true);
  };

  const handleUndoDelete = () => {
    if (lastDeletedTodo) {
      addTodo({
        title: lastDeletedTodo.title,
        notes: lastDeletedTodo.notes,
        dueDate: lastDeletedTodo.dueDate,
        completed: lastDeletedTodo.completed,
      });
      setLastDeletedTodo(null);
    }
    setSnackbarVisible(false);
  };

  const handleFilterPress = (filterType: FilterType) => {
    setFilter(filterType);
  };

  const renderTodoItem: ListRenderItem<Todo> = ({ item }) => (
    <TodoItem
      todo={item}
      onPress={() => handleEditTodo(item.id)}
      onDelete={handleDeleteTodo}
    />
  );

  const keyExtractor = (item: Todo) => item.id;

  const getEmptyStateProps = () => {
    if (query.trim()) {
      return {
        title: 'No Results',
        subtitle: `No todos found for "${query}"`,
        icon: 'magnify',
      };
    }

    switch (filter) {
      case 'active':
        return {
          title: 'No Active Todos',
          subtitle: 'All your todos are completed!',
          icon: 'check-circle-outline',
          actionLabel: 'Add Todo',
          onActionPress: handleAddTodo,
        };
      case 'completed':
        return {
          title: 'No Completed Todos',
          subtitle: 'Complete some todos to see them here',
          icon: 'clipboard-check-outline',
        };
      default:
        return {
          title: 'No Todos Yet',
          subtitle: 'Tap the + button to create your first todo',
          icon: 'clipboard-text-outline',
          actionLabel: 'Add Todo',
          onActionPress: handleAddTodo,
        };
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header title="Tofu" showThemeToggle showLogout />

      <SearchBar value={query} onChangeText={setQuery} />

      <View style={styles.filters}>
        <Chip
          selected={filter === 'all'}
          onPress={() => handleFilterPress('all')}
          style={[
            styles.filterChip,
            { borderRadius: BORDER_RADIUS },
            filter === 'all' && {
              backgroundColor: theme.colors.primary,
              elevation: 2,
            },
          ]}
          textStyle={
            filter === 'all' && {
              color: theme.colors.onPrimary,
              fontWeight: '600',
            }
          }
          showSelectedCheck={false}
        >
          All
        </Chip>
        <Chip
          selected={filter === 'active'}
          onPress={() => handleFilterPress('active')}
          style={[
            styles.filterChip,
            { borderRadius: BORDER_RADIUS },
            filter === 'active' && {
              backgroundColor: theme.colors.primary,
              elevation: 2,
            },
          ]}
          textStyle={
            filter === 'active' && {
              color: theme.colors.onPrimary,
              fontWeight: '600',
            }
          }
          showSelectedCheck={false}
        >
          Active
        </Chip>
        <Chip
          selected={filter === 'completed'}
          onPress={() => handleFilterPress('completed')}
          style={[
            styles.filterChip,
            { borderRadius: BORDER_RADIUS },
            filter === 'completed' && {
              backgroundColor: theme.colors.primary,
              elevation: 2,
            },
          ]}
          textStyle={
            filter === 'completed' && {
              color: theme.colors.onPrimary,
              fontWeight: '600',
            }
          }
          showSelectedCheck={false}
        >
          Completed
        </Chip>
      </View>

      {todos.length === 0 ? (
        <EmptyState {...getEmptyStateProps()} />
      ) : (
        <FlatList
          data={todos}
          renderItem={renderTodoItem}
          keyExtractor={keyExtractor}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      <FAB
        icon="plus"
        mode="flat"
        color={theme.colors.onPrimary}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddTodo}
        accessibilityLabel="Add new todo"
      />

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          action={{
            label: 'Undo',
            onPress: handleUndoDelete,
          }}
          duration={Snackbar.DURATION_LONG}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 2,
  },
  filterChip: {
    marginRight: 8,
  },
  list: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    left: '50%',
    marginLeft: -28,
    borderRadius: 28,
    width: 56,
    height: 56,
  },
});
