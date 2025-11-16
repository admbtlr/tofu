import { RootStackParamList } from '@/app/navigation/RootNavigator';
import EmptyState from '@/components/EmptyState';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import TodoItem from '@/components/TodoItem';
import { useTodoStore } from '@/store/useTodoStore';
import { useListStore } from '@/store/useListStore';
import { FilterType, Todo } from '@/types/todo';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import React, { useCallback, useState, useRef } from 'react';
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
  Animated,
} from 'react-native';
import { SegmentedButtons, Portal, Snackbar, useTheme, FAB } from 'react-native-paper';

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Home'
> &
  DrawerNavigationProp<any>;

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
  const searchVerticalAnim = useRef(new Animated.Value(0)).current;

  const {
    query,
    filter,
    setQuery,
    setFilter,
    visibleTodos,
    addTodo,
    deleteTodo,
  } = useTodoStore();

  const { lists, selectedListId } = useListStore();

  const todos = visibleTodos(selectedListId);
  const list = lists.find(l => l.id === selectedListId);
  const title = list?.name || 'Everything';

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
    const newExpanded = !searchExpanded;
    
    if (newExpanded) {
      // When expanding: first move down and shift content, then set expanded state for horizontal animation
      Animated.parallel([
        Animated.timing(searchVerticalAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(searchRowAnim, {
          toValue: !isTablet ? 1 : 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Set expanded state after vertical movement completes to trigger horizontal expansion
        setSearchExpanded(true);
      });
    } else {
      // When collapsing: first set collapsed state, then move up after horizontal collapse
      setSearchExpanded(false);
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(searchRowAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(searchVerticalAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }, 300); // Wait for horizontal collapse to complete
    }
  };

  const isTablet = dimensions.width > 600;

  // Remove the useEffect since animation is now handled in handleSearchToggle

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
      case 'done':
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
          // paddingHorizontal:
          //   dimensions.width > 800 ? (dimensions.width - 800) / 2 : 0,
        },
      ]}
    >
      <Header
        title={title || 'Tofu'}
        showMenu={dimensions.width <= 800}
        onMenuPress={() => navigation.openDrawer()}
      />

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
          <SegmentedButtons
            value={filter}
            onValueChange={(value) => handleFilterPress(value as FilterType)}
            buttons={[
              {
                value: 'today',
                label: 'Today',
              },
              {
                value: 'all',
                label: 'All',
              },
              {
                value: 'done',
                label: 'Done',
              },
            ]}
            style={styles.segmentedButtons}
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.searchIconContainer,
            {
              transform: [
                {
                  translateY: searchVerticalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 56], // Move from initial position (header level) down to filters level
                  }),
                },
              ],
            },
          ]}
        >
          <SearchBar
            value={query}
            onChangeText={setQuery}
            expanded={searchExpanded}
            onToggle={handleSearchToggle}
            maxWidth={isTablet ? 400 : dimensions.width - 14}
          />
        </Animated.View>
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
  segmentedButtons: {
    flex: 1,
  },
  searchIconContainer: {
    position: 'absolute',
    top: -56, // Start above filters container at header level
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
