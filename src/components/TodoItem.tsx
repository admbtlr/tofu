import { useTodoStore } from '@/store/useTodoStore';
import { Todo } from '@/types/todo';
import { formatDate, formatTime, isOverdue } from '@/utils/date';
import React, { useEffect, useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Icon, IconButton, List, Text, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
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
  const { toggleComplete, deleteTodo, filter, removePendingRemoval } =
    useTodoStore();
  const swipeableRef = React.useRef<Swipeable>(null);
  const removalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasCompleted = useRef(todo.completed);

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const height = useSharedValue(1);

  useEffect(() => {
    // Check if the todo was just completed (transition from uncompleted to completed)
    const justCompleted = !wasCompleted.current && todo.completed;
    wasCompleted.current = todo.completed;

    if (justCompleted && filter !== 'completed') {
      // Show greyed out state immediately
      opacity.value = withSpring(0.5);
      scale.value = withSpring(0.98);

      // After 3 seconds, animate out and remove
      removalTimerRef.current = setTimeout(() => {
        // Fade out
        opacity.value = withTiming(0, { duration: 300 });
        // height.value = withTiming(0, { duration: 300 });

        // Remove from pending list after animation completes
        setTimeout(() => {
          removePendingRemoval(todo.id);
        }, 300);
      }, 3000);
    } else if (!todo.completed) {
      // Reset animation values if uncompleted
      opacity.value = withSpring(1);
      scale.value = withSpring(1);
      height.value = withSpring(1);
      // Make sure it's not in pending removal
      removePendingRemoval(todo.id);
    }

    return () => {
      if (removalTimerRef.current) {
        clearTimeout(removalTimerRef.current);
      }
    };
  }, [
    todo.completed,
    todo.id,
    filter,
    opacity,
    scale,
    height,
    removePendingRemoval,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { scaleY: height.value }],
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
    todo.completed && {
      textDecorationLine: 'line-through' as const,
      color: theme.colors.onSurfaceVariant,
    },
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
      return `${formattedDate}, ${formatTime(dateString)}`;
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {todo.dueDate && (
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.dueDate,
                      isItemOverdue && { color: theme.colors.error },
                      { marginRight: 6 },
                    ]}
                  >
                    {formatDueDate(todo.dueDate)}
                  </Text>
                )}
                {todo.repeat && todo.repeat !== 'never' && (
                  <>
                    <Icon source="repeat-variant" size={16} />
                    <Text
                      style={{
                        ...styles.dueDate,
                        marginLeft: 2,
                      }}
                    >
                      {todo.repeat.charAt(0).toUpperCase() +
                        todo.repeat.slice(1)}
                    </Text>
                  </>
                )}
              </View>
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
          style={[styles.item]}
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
    opacity: 0.9,
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
    marginTop: -8,
  },
});
