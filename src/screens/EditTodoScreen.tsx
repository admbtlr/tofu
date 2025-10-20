import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/app/navigation/RootNavigator';
import { useTodoStore } from '@/store/useTodoStore';
import { Todo, RepeatType } from '@/types/todo';
import Header from '@/components/Header';
import TodoEditor from '@/components/TodoEditor';
import { useTheme } from 'react-native-paper';

type EditTodoScreenRouteProp = RouteProp<RootStackParamList, 'EditTodo'>;
type EditTodoScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EditTodo'
>;

interface EditTodoScreenProps {
  route: EditTodoScreenRouteProp;
  navigation: EditTodoScreenNavigationProp;
}

export default function EditTodoScreen({
  route,
  navigation,
}: EditTodoScreenProps) {
  const { todoId } = route.params;
  const { todos, addTodo, updateTodo } = useTodoStore();

  const todo = todoId ? todos.find((t: Todo) => t.id === todoId) : undefined;
  const isEditing = !!todo;

  const handleSave = (todoData: {
    title: string;
    notes?: string;
    dueDate?: string;
    notifyEnabled?: boolean;
    repeat?: RepeatType;
  }) => {
    if (isEditing && todo) {
      updateTodo(todo.id, todoData);
    } else {
      addTodo({
        ...todoData,
        completed: false,
      });
    }
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const dimensions = useWindowDimensions();
  const theme = useTheme();

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
      <Header
        title={isEditing ? 'Edit Todo' : 'New Todo'}
        showBack
        onBackPress={handleCancel}
      />

      <TodoEditor todo={todo} onSave={handleSave} onCancel={handleCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
