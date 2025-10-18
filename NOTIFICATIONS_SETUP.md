# Notifications Feature Documentation

This document explains the notifications feature added to the Expo Todo App. You can now get reminded when a todo is due!

## What Changed

### 1. **Packages Installed**
- `expo-notifications` - Expo's notification API for scheduling local notifications

### 2. **New Features**
- **Notification Toggle**: Each todo has a "Remind me" toggle in the editor
- **Smart Scheduling**: Notifications are scheduled at the exact due date/time
- **Auto-Cancellation**: Notifications are automatically cancelled when:
  - Todo is completed
  - Todo is deleted
  - Todo is updated (old notification cancelled, new one scheduled)
- **Permission Handling**: App requests notification permissions on startup

## Setup Instructions

### Step 1: Run the Database Migration

Run this SQL in your Supabase SQL Editor to add the notification fields:

```sql
-- Add notification columns to existing todos table
alter table public.todos
  add column if not exists notify_enabled boolean default false,
  add column if not exists notification_id text;
```

Or simply run the file `supabase-notifications-migration.sql` in your Supabase dashboard.

### Step 2: Test the Feature

1. **Start the app**:
   ```bash
   npm start
   ```

2. **Grant permissions**: When prompted, allow notifications

3. **Create a todo with notification**:
   - Add a new todo
   - Set a due date
   - Toggle "Include time" and set a specific time (e.g., 2 minutes from now)
   - Toggle "Remind me" ON
   - Save

4. **Wait for the notification**: You should receive a notification at the scheduled time!

## How It Works

### Notification Flow

```
User creates/edits todo with notification enabled
    ↓
App schedules notification with expo-notifications
    ↓
Notification ID is saved to todo in database
    ↓
At scheduled time, device shows notification
    ↓
If todo is completed/deleted before notification fires:
    - Notification is cancelled automatically
```

### Data Model Changes

**Todo Type** (`src/types/todo.ts`):
```typescript
interface Todo {
  // ... existing fields
  notifyEnabled?: boolean;      // Whether notification is enabled
  notificationId?: string;      // ID of scheduled notification
}
```

**Database** (Supabase):
```sql
alter table public.todos
  add column notify_enabled boolean default false,
  add column notification_id text;
```

## File Changes

### New Files

1. **`src/utils/notifications.ts`**
   - Notification permission handling
   - Scheduling notifications
   - Cancelling notifications
   - Helper functions

2. **`supabase-notifications-migration.sql`**
   - Database migration for notification fields

3. **`NOTIFICATIONS_SETUP.md`** (this file)
   - Documentation for the notifications feature

### Modified Files

1. **`src/types/todo.ts`**
   - Added `notifyEnabled` and `notificationId` fields

2. **`src/lib/supabase.ts`**
   - Updated `TodoRow` type with notification fields

3. **`src/storage/todoStorage.ts`**
   - Updated `rowToTodo` and `todoToRow` converters
   - Updated `updateTodo` to handle notification fields

4. **`src/components/TodoEditor.tsx`**
   - Added "Remind me" toggle UI
   - Updated save handler to include `notifyEnabled`
   - Toggle is disabled if no due date is set

5. **`src/store/useTodoStore.ts`**
   - `addTodo`: Schedules notification if enabled
   - `updateTodo`: Cancels old and schedules new notification
   - `deleteTodo`: Cancels notification
   - `toggleComplete`: Cancels notification when completing

6. **`src/app/App.tsx`**
   - Requests notification permissions on app startup

7. **`package.json`**
   - Added `expo-notifications` dependency

## Configuration

### Android

For Android, a notification channel is automatically created:
- **Channel Name**: "Todo Reminders"
- **Importance**: HIGH
- **Sound**: Default
- **Vibration**: Pattern

### iOS

iOS uses the default notification configuration. Users can customize notification settings in system settings.

## Important Notes

### Notification Timing

- **With Time**: Notification fires at the exact date and time
- **Without Time**: Notification fires at midnight (00:00) on the due date
  - Consider this when creating todos without specific times

### Permissions

- App requests permissions on first launch
- If user denies permissions, notifications won't work
- User can enable permissions later in device settings
- The "Remind me" toggle will still work in the app, but notifications won't show

### Background Notifications

- Notifications work even when the app is closed
- They're stored locally on the device
- If device is off at notification time, it will fire when device turns on

### Limitations

- **Device-specific**: Notifications are scheduled on each device independently
- **Not synced**: If you use the app on multiple devices, notifications are per-device
- **Local only**: Uses expo-notifications (local), not push notifications
- **Past dates**: Cannot schedule notifications for past dates/times

## Debugging

### Check Scheduled Notifications

Add this to your code temporarily to see all scheduled notifications:

```typescript
import { getScheduledNotifications } from '@/utils/notifications';

const notifications = await getScheduledNotifications();
console.log('Scheduled notifications:', notifications);
```

### Common Issues

1. **Notifications not showing?**
   - Check permissions in device settings
   - Verify due date is in the future
   - Check console logs for errors

2. **Toggle disabled?**
   - Make sure you've set a due date first
   - Toggle only works when `dueDate` is set

3. **Notifications not cancelling?**
   - Check `notificationId` is saved in database
   - Verify `cancelNotification` is being called

### Console Logs

The app logs notification events:
- `"Notification scheduled: <id>"` - When notification is scheduled
- `"Notification cancelled: <id>"` - When notification is cancelled
- Permission status on startup

## Future Enhancements

Possible improvements to consider:

1. **Advance Reminders**: Remind X minutes/hours before due time
2. **Recurring Notifications**: Repeat reminders every N minutes
3. **Custom Notification Time**: Set notification time separately from due date
4. **Snooze**: Add snooze functionality to notifications
5. **Action Buttons**: Add "Complete" or "Snooze" buttons to notifications
6. **Sound Customization**: Let users choose notification sounds
7. **Push Notifications**: Use Expo's push notification service for cross-device sync

## Testing Notifications

### Quick Test (2 minutes)

1. Create a new todo
2. Set due date to today
3. Toggle "Include time" ON
4. Set time to 2 minutes from now
5. Toggle "Remind me" ON
6. Save and close the app
7. Wait 2 minutes

You should see a notification!

### Test Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Create todo with notification | Notification scheduled |
| Complete todo with notification | Notification cancelled |
| Delete todo with notification | Notification cancelled |
| Update todo's date/time | Old cancelled, new scheduled |
| Toggle notification OFF | Notification cancelled |
| Toggle notification ON | Notification scheduled |
| Set due date in past | Notification NOT scheduled |

## API Reference

### Notification Functions

**`requestNotificationPermissions()`**
- Requests notification permissions from user
- Returns: `Promise<boolean>` - true if granted

**`scheduleNotification(todoId, title, dueDate)`**
- Schedules a notification
- Returns: `Promise<string | null>` - notification ID or null

**`cancelNotification(notificationId)`**
- Cancels a scheduled notification
- Returns: `Promise<void>`

**`hasNotificationPermissions()`**
- Checks if permissions are granted
- Returns: `Promise<boolean>`

## Summary

You now have a fully functional notification system! 🔔

The integration:
- ✅ Schedules notifications at due date/time
- ✅ Automatically cancels when todo is completed/deleted
- ✅ Syncs with Supabase database
- ✅ Works in background
- ✅ Handles permissions gracefully
- ✅ Updates notifications when todo changes

Enjoy never missing a todo again! 🎉
