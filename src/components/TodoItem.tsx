import { useTodoStore } from '@/store/useTodoStore';
import { Todo } from '@/types/todo';
import { formatDate, formatTime, isOverdue } from '@/utils/date';
import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { IconButton, List, Text, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface TodoItemProps {
  todo: Todo;
  onPress: () => void;
  onDelete?: (todo: Todo) => void;
}

export default React.memo(function TodoItem({
  todo,
  onPress,
  onDelete,
}: TodoItemProps) {
  const theme = useTheme();
  const { toggleComplete, deleteTodo } = useTodoStore();
  const swipeableRef = React.useRef<Swipeable>(null);

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withSpring(todo.completed ? 0.6 : 1);
    scale.value = withSpring(todo.completed ? 0.98 : 1);
  }, [todo.completed, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleToggleComplete = () => {
    toggleComplete(todo.id);
  };

  const handleDelete = () => {
    if (onDelete) {
      // Use parent's delete handler for snackbar
      onDelete(todo);
    } else {
      // Fallback to direct delete with alert
      Alert.alert(
        'Delete Todo',
        `Are you sure you want to delete "${todo.title}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteTodo(todo.id),
          },
        ]
      );
    }
  };

  const renderRightAction = () => (
    <View style={[styles.deleteAction, { backgroundColor: '#dc2626' }]}>
      <IconButton
        icon="delete"
        iconColor="white"
        size={28}
        onPress={handleDelete}
        accessibilityLabel="Delete todo"
      />
    </View>
  );

  const titleStyle = [
    styles.title,
    todo.completed && { textDecorationLine: 'line-through' as const },
    todo.completed && { opacity: 0.6 },
  ];

  const isItemOverdue =
    todo.dueDate && !todo.completed && isOverdue(todo.dueDate);

  // Check if the due date has a specific time set (not midnight)
  const hasTime = todo.dueDate
    ? (() => {
        const date = new Date(todo.dueDate);
        return date.getHours() !== 0 || date.getMinutes() !== 0;
      })()
    : false;

  const formatDueDate = (dateString: string) => {
    const formattedDate = formatDate(dateString);
    if (hasTime) {
      return `${formattedDate} at ${formatTime(dateString)}`;
    }
    return formattedDate;
  };

  return (
    <Animated.View style={animatedStyle}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightAction}
        rightThreshold={80}
        onSwipeableWillOpen={direction => {
          if (direction === 'right') {
            handleDelete();
          }
        }}
      >
        <List.Item
          title={todo.title}
          titleStyle={titleStyle}
          contentStyle={{ marginLeft: -10 }}
          description={
            <View style={styles.description}>
              {todo.notes && (
                <Text variant="bodySmall" style={styles.notes}>
                  {todo.notes}
                </Text>
              )}
              {todo.dueDate && (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.dueDate,
                    isItemOverdue && { color: theme.colors.error },
                  ]}
                >
                  Due: {formatDueDate(todo.dueDate)}
                </Text>
              )}
            </View>
          }
          left={() => (
            <IconButton
              icon={todo.completed ? 'check-circle' : 'circle-outline'}
              iconColor={
                todo.completed ? theme.colors.primary : theme.colors.onSurface
              }
              size={24}
              onPress={handleToggleComplete}
              style={styles.checkbox}
            />
          )}
          onPress={onPress}
          style={[
            styles.item,
            todo.completed && { backgroundColor: theme.colors.surfaceVariant },
          ]}
          accessible={true}
          accessibilityLabel={`Todo: ${todo.title}${
            todo.completed ? ', completed' : ''
          }${todo.dueDate ? `, due ${formatDueDate(todo.dueDate)}` : ''}`}
          accessibilityRole="button"
        />
      </Swipeable>
      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.onSurface,
          marginHorizontal: 16,
          opacity: 0.3,
        }}
      ></View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  description: {
    marginTop: 4,
    paddingBottom: 4,
  },
  notes: {
    marginBottom: 4,
    opacity: 0.7,
    lineHeight: 18,
  },
  dueDate: {
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 16,
    paddingBottom: 2,
  },
  deleteAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 100,
    paddingRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  checkbox: {
    margin: 0,
  },
});
