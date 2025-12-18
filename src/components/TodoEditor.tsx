import { Todo, RepeatType } from '@/types/todo';
import { createDateString } from '@/utils/date';
import { validateTodoNotes, validateTodoTitle } from '@/utils/validators';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { Button, Surface, Text, TextInput, useTheme, Switch, Menu } from 'react-native-paper';
import { useListStore } from '@/store/useListStore';

const BORDER_RADIUS = 12;

interface TodoEditorProps {
  todo?: Todo;
  onSave: (todoData: {
    title: string;
    notes?: string;
    dueDate?: string;
    notifyEnabled?: boolean;
    repeat?: RepeatType;
    listId?: string;
  }) => void;
  onCancel: () => void;
}

export default function TodoEditor({
  todo,
  onSave,
  onCancel,
}: TodoEditorProps) {
  const theme = useTheme();
  const [title, setTitle] = useState(todo?.title || '');
  const [notes, setNotes] = useState(todo?.notes || '');
  const [dueDate, setDueDate] = useState<Date | null>(() => {
    if (todo?.dueDate) {
      const date = new Date(todo.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today ? date : null;
    }
    return null;
  });
  const [includeTime, setIncludeTime] = useState<boolean>(() => {
    if (todo?.dueDate) {
      const date = new Date(todo.dueDate);
      // Check if time is set (not midnight)
      return date.getHours() !== 0 || date.getMinutes() !== 0;
    }
    return false;
  });
  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(todo?.notifyEnabled || false);
  const [repeat, setRepeat] = useState<RepeatType>(todo?.repeat || 'never');
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);

  const { lists, selectedListId } = useListStore();
  const [listId, setListId] = useState<string>(todo?.listId || selectedListId || '');
  const [showListMenu, setShowListMenu] = useState(false);

  // Check if running on Mac (Catalyst) - Mac Catalyst doesn't support native iOS date picker
  // @ts-ignore - interfaceIdiom might not be in types but exists on Mac Catalyst
  const isMac = Platform.OS === 'ios' &&
    (Platform.constants?.interfaceIdiom === 'mac' || Platform.constants?.isMacCatalyst);

  useEffect(() => {
    const titleValidation = validateTodoTitle(title);
    setTitleError(titleValidation);
  }, [title]);

  useEffect(() => {
    const notesValidation = validateTodoNotes(notes);
    setNotesError(notesValidation);
  }, [notes]);

  const handleSave = () => {
    const titleValidation = validateTodoTitle(title);
    const notesValidation = validateTodoNotes(notes);

    if (titleValidation || notesValidation) {
      Alert.alert('Validation Error', titleValidation || notesValidation || '');
      return;
    }

    let finalDueDate = dueDate;
    if (dueDate && !includeTime) {
      // If time is not included, set to start of day
      finalDueDate = new Date(dueDate);
      finalDueDate.setHours(0, 0, 0, 0);
    }

    onSave({
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueDate: finalDueDate ? createDateString(finalDueDate) : undefined,
      notifyEnabled: notifyEnabled && !!finalDueDate, // Only enable if there's a due date
      repeat: repeat,
      listId: listId || undefined,
    });
  };

  const handleDateConfirm = (selectedDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate >= today) {
      // Preserve the existing time if includeTime is enabled
      if (includeTime && dueDate) {
        const newDate = new Date(selectedDate);
        newDate.setHours(dueDate.getHours());
        newDate.setMinutes(dueDate.getMinutes());
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        setDueDate(newDate);
      } else {
        setDueDate(selectedDate);
      }
    } else {
      // If somehow a past date is selected, set to today
      const newDate = new Date();
      if (includeTime && dueDate) {
        newDate.setHours(dueDate.getHours());
        newDate.setMinutes(dueDate.getMinutes());
      }
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      setDueDate(newDate);
    }
  };

  const canSave = title.trim().length > 0 && !titleError && !notesError;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          error={!!titleError}
          accessibilityLabel="Todo title"
          maxLength={120}
          autoFocus={!todo}
        />
        {titleError && (
          <Text
            variant="bodySmall"
            style={[styles.error, { color: theme.colors.error }]}
          >
            {titleError}
          </Text>
        )}

        <TextInput
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={[styles.input, styles.notesInput]}
          error={!!notesError}
          accessibilityLabel="Todo notes"
          maxLength={500}
        />
        {notesError && (
          <Text
            variant="bodySmall"
            style={[styles.error, { color: theme.colors.error }]}
          >
            {notesError}
          </Text>
        )}

        <Surface style={styles.dueDateSection} elevation={1}>
          <View style={styles.dueDateHeader}>
            <Text variant="titleMedium">Due Date</Text>
          </View>

          {(Platform.OS === 'ios' && !isMac) ? (
            <View style={[styles.datePickerContainer]}>
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate >= today) {
                      handleDateConfirm(selectedDate);
                    }
                  }
                }}
                textColor={theme.colors.onSurface}
                accentColor={theme.colors.primary}
              />
            </View>
          ) : (
            <>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
              >
                {dueDate ? dueDate.toLocaleDateString() : 'Select Date'}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (event.type === 'set' && selectedDate) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (selectedDate >= today) {
                        handleDateConfirm(selectedDate);
                      }
                    }
                  }}
                />
              )}
            </>
          )}

          <View style={styles.timeToggleContainer}>
            <Text variant="bodyMedium">Include time</Text>
            <Switch
              value={includeTime}
              onValueChange={(value) => {
                setIncludeTime(value);
                if (value) {
                  // If enabling time and no date is set, set to today
                  if (!dueDate) {
                    const today = new Date();
                    today.setHours(9, 0, 0, 0);
                    setDueDate(today);
                  } else {
                    // Set default time to 9:00 AM if enabling time
                    const newDate = new Date(dueDate);
                    if (newDate.getHours() === 0 && newDate.getMinutes() === 0) {
                      newDate.setHours(9, 0, 0, 0);
                      setDueDate(newDate);
                    }
                  }
                }
              }}
            />
          </View>

          {includeTime && (
            (Platform.OS === 'ios' && !isMac) ? (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="time"
                  display="spinner"
                  onChange={(_, selectedTime) => {
                    if (selectedTime) {
                      // Use existing dueDate or today if no date is set
                      const baseDate = dueDate || new Date();
                      const newDate = new Date(baseDate);
                      newDate.setHours(selectedTime.getHours());
                      newDate.setMinutes(selectedTime.getMinutes());
                      setDueDate(newDate);
                    }
                  }}
                  textColor={theme.colors.onSurface}
                  accentColor={theme.colors.primary}
                />
              </View>
            ) : (
              <>
                <Button
                  mode="outlined"
                  onPress={() => setShowTimePicker(true)}
                  style={styles.dateButton}
                  icon="clock-outline"
                >
                  {dueDate ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                </Button>
                {showTimePicker && (
                  <DateTimePicker
                    value={dueDate || new Date()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(false);
                      if (event.type === 'set' && selectedTime) {
                        // Use existing dueDate or today if no date is set
                        const baseDate = dueDate || new Date();
                        const newDate = new Date(baseDate);
                        newDate.setHours(selectedTime.getHours());
                        newDate.setMinutes(selectedTime.getMinutes());
                        setDueDate(newDate);
                      }
                    }}
                  />
                )}
              </>
            )
          )}

          <View style={styles.timeToggleContainer}>
            <View style={styles.notificationToggleText}>
              <Text variant="bodyMedium">Remind me</Text>
              {!dueDate && (
                <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                  Set a due date first
                </Text>
              )}
            </View>
            <Switch
              value={notifyEnabled}
              onValueChange={setNotifyEnabled}
              disabled={!dueDate}
            />
          </View>

          <View style={styles.repeatContainer}>
            <Text variant="bodyMedium">Repeat</Text>
            <Menu
              visible={showRepeatMenu}
              onDismiss={() => setShowRepeatMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowRepeatMenu(true)}
                  style={styles.repeatButton}
                  compact
                >
                  {repeat === 'never' ? 'Never' :
                   repeat === 'daily' ? 'Daily' :
                   repeat === 'weekdays' ? 'Weekdays' :
                   'Weekly'}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  setRepeat('never');
                  setShowRepeatMenu(false);
                }}
                title="Never"
                leadingIcon={repeat === 'never' ? 'check' : undefined}
              />
              <Menu.Item
                onPress={() => {
                  setRepeat('daily');
                  setShowRepeatMenu(false);
                }}
                title="Daily"
                leadingIcon={repeat === 'daily' ? 'check' : undefined}
              />
              <Menu.Item
                onPress={() => {
                  setRepeat('weekdays');
                  setShowRepeatMenu(false);
                }}
                title="Weekdays"
                leadingIcon={repeat === 'weekdays' ? 'check' : undefined}
              />
              <Menu.Item
                onPress={() => {
                  setRepeat('weekly');
                  setShowRepeatMenu(false);
                }}
                title="Weekly"
                leadingIcon={repeat === 'weekly' ? 'check' : undefined}
              />
            </Menu>
          </View>

          <View style={styles.repeatContainer}>
            <Text variant="bodyMedium">List</Text>
            <Menu
              visible={showListMenu}
              onDismiss={() => setShowListMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowListMenu(true)}
                  style={styles.repeatButton}
                  compact
                >
                  {lists.find(l => l.id === listId)?.name || 'Select List'}
                </Button>
              }
            >
              {lists.map(list => (
                <Menu.Item
                  key={list.id}
                  onPress={() => {
                    setListId(list.id);
                    setShowListMenu(false);
                  }}
                  title={list.name}
                  leadingIcon={listId === list.id ? 'check' : undefined}
                />
              ))}
            </Menu>
          </View>
        </Surface>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.actionButton}
          accessibilityLabel="Cancel"
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!canSave}
          style={styles.actionButton}
          accessibilityLabel="Save todo"
        >
          {todo ? 'Update' : 'Save'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  notesInput: {
    minHeight: 100,
  },
  error: {
    marginBottom: 16,
    marginLeft: 12,
  },
  dueDateSection: {
    padding: 16,
    marginVertical: 16,
    borderRadius: BORDER_RADIUS,
  },
  dueDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDate: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  datePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    borderRadius: BORDER_RADIUS,
  },
  timeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  notificationToggleText: {
    flex: 1,
  },
  dateButton: {
    marginVertical: 12,
    marginHorizontal: 8,
    borderRadius: BORDER_RADIUS,
  },
  dateSpinner: {
    width: '100%',
    height: 140,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS,
  },
  repeatContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  repeatButton: {
    borderRadius: BORDER_RADIUS,
    minWidth: 100,
  },
});
