import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  List,
  IconButton,
  Dialog,
  Portal,
  Button,
  TextInput,
  useTheme,
  Text,
} from 'react-native-paper';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useListStore } from '@/store/useListStore';
import { EVERYTHING_LIST_ID } from '@/types/list';
import { useTodoStore } from '@/store/useTodoStore';
import Header from './Header';
import { isMac, scaleFontForMac, spacing } from '@/app/theme/theme';

export default function ListDrawer(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const { lists, selectedListId, setSelectedList, addList, deleteList } =
    useListStore();
  const { todos } = useTodoStore();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleSelectList = (listId: string) => {
    setSelectedList(listId);
    props.navigation.closeDrawer();
  };

  const handleDeletePress = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (list?.isDefault) return; // Can't delete default list

    setListToDelete(listId);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (listToDelete) {
      await deleteList(listToDelete);
      setDeleteDialogVisible(false);
      setListToDelete(null);
    }
  };

  const handleAddList = async () => {
    if (newListName.trim()) {
      await addList({
        name: newListName.trim(),
        isDefault: false,
      });
      setNewListName('');
      setAddDialogVisible(false);
    }
  };

  const getListTodoCount = (listId: string) => {
    if (listId === EVERYTHING_LIST_ID) {
      return todos.filter(t => !t.completed).length;
    }
    return todos.filter(t => t.listId === listId && !t.completed).length;
  };

  const listToDeleteName = lists.find(l => l.id === listToDelete)?.name;
  const todosInListToDelete = listToDelete
    ? todos.filter(t => t.listId === listToDelete).length
    : 0;

  const getLabel = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    const title = listId === EVERYTHING_LIST_ID ? 'Everything' : list?.name;
    const count = getListTodoCount(listId);
    return title;
    // return (
    //   <Text variant="bodyLarge">
    //     {title}
    //     {count > 0 && <Text style={{ opacity: 0.4 }}> {count}</Text>}
    //   </Text>
    // );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isMac ? 'transparent' : theme.colors.surface }}>
      <DrawerContentScrollView
        {...props}
        style={[styles.drawerSection, isMac && { backgroundColor: 'transparent' }]}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Everything entry */}
        <List.Item
          title={getLabel(EVERYTHING_LIST_ID)}
          titleStyle={styles.titleStyle}
          left={props => (
            <List.Icon
              {...props}
              color={theme.colors.primary}
              icon="inbox-multiple"
              style={{
                marginLeft: 16,
                marginRight: -8
              }}
            />
          )}
          onPress={() => handleSelectList(EVERYTHING_LIST_ID)}
          style={[
            styles.listItem,
            isMac && { backgroundColor: 'transparent' },
            selectedListId === EVERYTHING_LIST_ID && {
              backgroundColor: isMac ? 'rgba(255, 255, 255, 0.1)' : theme.colors.secondaryContainer,
            },
          ]}
        />

        {/* User's lists */}
        {lists.map(list => (
          <List.Item
            key={list.id}
            title={getLabel(list.id)}
            titleStyle={styles.titleStyle}
            left={props => (
              <List.Icon
                {...props}
                color={theme.colors.primary}
                icon="format-list-bulleted"
                style={{
                  marginLeft: 16,
                  marginRight: -8
                }}
              />
            )}
            right={() => (
              <View style={styles.rightContainer}>
                {!list.isDefault && (
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    onPress={() => handleDeletePress(list.id)}
                    style={{
                      padding: 0,
                      margin: 0,
                      marginRight: -16,
                      height: 24
                    }}
                  />
                )}
              </View>
            )}
            onPress={() => handleSelectList(list.id)}
            style={[
              styles.listItem,
              isMac && { backgroundColor: 'transparent' },
              selectedListId === list.id && {
                backgroundColor: isMac ? 'rgba(255, 255, 255, 0.1)' : theme.colors.secondaryContainer,
              },
            ]}
          />
        ))}
      </DrawerContentScrollView>

      {/* Add new list button - now at the bottom */}
      <View style={[styles.addListContainer, { backgroundColor: isMac ? 'transparent' : theme.colors.surface }]}>
        <List.Item
          title="Add List"
          left={props => (
            <List.Icon {...props} color={theme.colors.primary} icon="plus" />
          )}
          onPress={() => setAddDialogVisible(true)}
          style={[styles.listItem, isMac && { backgroundColor: 'transparent' }]}
        />
      </View>

      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          style={{
            backgroundColor: theme.colors.secondaryContainer,
          }}
        >
          <Dialog.Title>Delete List</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title={`Are you sure you want to delete "${listToDeleteName}"?`}
              description={
                todosInListToDelete > 0
                  ? `This will delete ${todosInListToDelete} todo${todosInListToDelete === 1 ? '' : 's'}.`
                  : 'This list is empty.'
              }
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={confirmDelete} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Add list dialog */}
        <Dialog
          visible={addDialogVisible}
          onDismiss={() => {
            setAddDialogVisible(false);
            setNewListName('');
          }}
          style={ styles.dialogStyle }
        >
          <Dialog.Title>New List</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="List Name"
              value={newListName}
              onChangeText={setNewListName}
              mode="outlined"
              style={styles.input}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setAddDialogVisible(false);
                setNewListName('');
              }}
            >
              Cancel
            </Button>
            <Button onPress={handleAddList} disabled={!newListName.trim()}>
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerSection: {
    flex: 1,
    paddingTop: 32,
  },
  listItem: {
    // padding: spacing(4),
    margin: isMac ? 2 : 4,
    marginHorizontal: spacing(16),
    paddingVertical: isMac ? 2 : 12,
    borderRadius: 8,
  },
  titleStyle: {
    fontSize: isMac ? 14 : 16
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    marginRight: 8,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  input: {
    marginTop: 8,
  },
  addListContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.12)',
    paddingBottom: isMac ? 0 : 32,
  },
  dialogStyle: {
    maxWidth: 400
  }
});
