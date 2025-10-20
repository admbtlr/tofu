import { RootStackParamList } from '@/app/navigation/RootNavigator';
import EmptyState from '@/components/EmptyState';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import TodoItem from '@/components/TodoItem';
import { useTodoStore } from '@/store/useTodoStore';
import { FilterType, Todo } from '@/types/todo';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
  Animated,
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
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchRowAnim = useRef(new Animated.Value(0)).current;

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

  const dimensions = useWindowDimensions();

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

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
  };

  const isTablet = dimensions.width > 600;

  useEffect(() => {
    Animated.timing(searchRowAnim, {
      toValue: searchExpanded && !isTablet ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [searchExpanded, isTablet]);

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
      case 'today':
        return {
          title: 'Nothing Due Today',
          subtitle: "You're all caught up!",
          icon: 'check-circle-outline',
          actionLabel: 'Add Todo',
          onActionPress: handleAddTodo,
        };
      case 'all':
        return {
          title: 'No Todos Yet',
          subtitle: 'Tap the + button to create your first todo',
          icon: 'clipboard-text-outline',
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
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingHorizontal:
            dimensions.width > 800 ? (dimensions.width - 800) / 2 : 0,
        },
      ]}
    >
      <Header title="Tofu" showThemeToggle showLogout />

      <View style={styles.filtersContainer}>
        <Animated.View
          style={[
            styles.filters,
            {
              transform: [
                {
                  translateY: searchRowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 56],
                  }),
                },
              ],
            },
          ]}
        >
          <Chip
            selected={filter === 'today'}
            onPress={() => handleFilterPress('today')}
            style={[
              styles.filterChip,
              { borderRadius: BORDER_RADIUS },
              filter === 'today' && {
                backgroundColor: theme.colors.primary,
                elevation: 2,
              },
            ]}
            textStyle={
              filter === 'today' && {
                color: theme.colors.onPrimary,
                fontWeight: '600',
              }
            }
            showSelectedCheck={false}
          >
            Today
          </Chip>
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
        </Animated.View>

        <View style={styles.searchIconContainer}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            expanded={searchExpanded}
            onToggle={handleSearchToggle}
            maxWidth={isTablet ? 400 : dimensions.width - 14}
          />
        </View>
      </View>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [
              {
                translateY: searchRowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 56],
                }),
              },
            ],
          },
        ]}
      >
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
      </Animated.View>

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
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    gap: 2,
  },
  filterChip: {
    marginRight: 8,
  },
  searchIconContainer: {
    position: 'absolute',
    top: 0,
    right: 6,
    zIndex: 10,
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
