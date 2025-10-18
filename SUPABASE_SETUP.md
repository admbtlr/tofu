# Supabase Integration Guide

This document explains how the Expo Todo App has been integrated with Supabase for cloud storage and real-time synchronization.

## What Changed

### 1. **Packages Installed**
- `@supabase/supabase-js` - Supabase JavaScript client
- `react-native-url-polyfill` - Required for React Native compatibility

### 2. **Architecture**
The app now uses a hybrid architecture:
- **Zustand** - Local state management (fast, reactive UI)
- **Supabase** - Cloud storage and real-time sync (multi-device support)

This gives you the best of both worlds:
- Instant UI updates (optimistic updates)
- Persistent cloud storage
- Real-time synchronization across devices

## Setup Instructions

### Step 1: Run the SQL Migration

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project: `qtgkfbccpvsiygzbuusz`
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `supabase-setup.sql`
6. Click **Run** to execute the migration

This will:
- Create the `todos` table
- Set up Row Level Security (RLS) policies for anonymous access
- Enable real-time subscriptions
- Create indexes for performance

### Step 2: Test the App

Run your app:
```bash
npm start
# or
yarn start
```

Then:
1. Create a few todos
2. Check your Supabase dashboard → **Table Editor** → `todos` table
3. You should see your todos stored in the cloud!

### Step 3: Test Multi-Device Sync

1. Run the app on two devices/simulators simultaneously
2. Create a todo on device 1
3. Watch it appear automatically on device 2 (within ~1 second)
4. Complete a todo on device 2
5. Watch it update on device 1

## File Changes

### New Files

1. **`src/lib/supabase.ts`**
   - Supabase client configuration
   - Database type definitions

2. **`src/hooks/useSupabaseSync.ts`**
   - Custom hook for real-time synchronization
   - Automatically reloads todos when changes occur in the database

3. **`supabase-setup.sql`**
   - Database migration script
   - Run this in your Supabase SQL Editor

4. **`SUPABASE_SETUP.md`** (this file)
   - Documentation for the Supabase integration

### Modified Files

1. **`src/storage/todoStorage.ts`**
   - Replaced AsyncStorage with Supabase queries
   - Added individual CRUD operations: `createTodo`, `updateTodo`, `deleteTodo`
   - Kept `loadTodos` for initial app load
   - Theme storage still uses AsyncStorage (local preference)

2. **`src/store/useTodoStore.ts`**
   - Updated to use new Supabase storage functions
   - Implements optimistic updates (UI updates immediately, then syncs to server)
   - Error handling for failed network requests

3. **`src/app/App.tsx`**
   - Added `useSupabaseSync()` hook to enable real-time synchronization
   - Initialization logic unchanged (still loads todos on app start)

4. **`package.json`**
   - Added Supabase dependencies

## How It Works

### Data Flow

```
User Action (e.g., "Add Todo")
    ↓
Zustand Store Updates (optimistic)
    ↓
UI Re-renders Immediately
    ↓
Supabase API Call (background)
    ↓
Database Updated
    ↓
Real-time Event Triggered
    ↓
Other Devices Reload Todos
    ↓
Their UIs Update
```

### Optimistic Updates

The app uses **optimistic updates** for a snappy user experience:

1. When you create/update/delete a todo, the UI updates immediately
2. The Supabase API call happens in the background
3. If it fails, an error is logged (you can add UI feedback later)

This means the app feels fast even on slow networks!

### Real-time Sync

The `useSupabaseSync` hook subscribes to changes on the `todos` table:

- When ANY todo is inserted, updated, or deleted
- The hook receives a notification
- It reloads all todos from the database
- The UI updates automatically via Zustand

This enables seamless multi-device synchronization.

## Database Schema

```sql
create table public.todos (
  id text primary key,              -- Client-generated ID
  title text not null,              -- Todo title (max 120 chars in UI)
  notes text,                       -- Optional notes (max 500 chars in UI)
  due_date timestamptz,             -- Optional due date
  created_at timestamptz not null,  -- Auto-set timestamp
  completed_at timestamptz,         -- Set when completed
  completed boolean not null,       -- Completion status
  user_id uuid                      -- For future auth (currently null)
);
```

### Field Mappings

| App Field (camelCase) | Database Field (snake_case) |
|-----------------------|------------------------------|
| `id`                  | `id`                        |
| `title`               | `title`                     |
| `notes`               | `notes`                     |
| `dueDate`             | `due_date`                  |
| `createdAt`           | `created_at`                |
| `completedAt`         | `completed_at`              |
| `completed`           | `completed`                 |

## Security (Row Level Security)

Currently, the app uses **anonymous access** - anyone can read/write todos.

This is fine for development and personal use, but for production you should add authentication:

### Adding Authentication (Future Enhancement)

1. Enable Supabase Auth in your project
2. Update RLS policies to check `user_id`:
   ```sql
   -- Only see your own todos
   create policy "Users can only see their own todos"
     on public.todos
     for select
     using (auth.uid() = user_id);

   -- Only insert with your user_id
   create policy "Users can only create their own todos"
     on public.todos
     for insert
     with check (auth.uid() = user_id);

   -- Only update your own todos
   create policy "Users can only update their own todos"
     on public.todos
     for update
     using (auth.uid() = user_id);

   -- Only delete your own todos
   create policy "Users can only delete their own todos"
     on public.todos
     for delete
     using (auth.uid() = user_id);
   ```

3. Add login/signup screens to your app
4. Set `user_id` when creating todos:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   // Include user_id in todoToRow()
   ```

## Troubleshooting

### Todos Not Syncing?

1. Check your Supabase project is running (not paused)
2. Verify the SQL migration ran successfully
3. Check the app logs for errors: `console.log` and `console.error` messages
4. Verify RLS policies are set correctly (go to **Authentication** → **Policies**)

### Real-time Not Working?

1. Verify the SQL includes: `alter publication supabase_realtime add table public.todos;`
2. Check your Supabase project has real-time enabled (free tier includes it)
3. Look for "Successfully subscribed to realtime changes" in your app logs

### TypeScript Errors?

Run:
```bash
npm run type-check
```

If you see errors, make sure all imports are correct and the database types match.

## Performance Considerations

### Current Implementation
- **Loads all todos** on app start
- **Reloads all todos** on every real-time event

This is simple and works well for personal use (hundreds of todos).

### For Scaling (1000+ Todos)
If you have many todos, consider:

1. **Pagination**: Load todos in batches
2. **Incremental updates**: Instead of reloading everything, apply individual changes
3. **Caching**: Use React Query or SWR for better cache management
4. **Filtering**: Only load active/incomplete todos by default

Example pagination:
```typescript
const { data } = await supabase
  .from('todos')
  .select('*')
  .order('created_at', { ascending: false })
  .range(0, 49); // Load first 50 todos
```

## Next Steps

### Recommended Enhancements

1. **Add Authentication**
   - Protect user data
   - Enable per-user todo lists

2. **Offline Support**
   - Cache todos in AsyncStorage as a backup
   - Queue failed operations and retry later
   - Show offline indicator in UI

3. **Better Error Handling**
   - Show user-friendly error messages
   - Implement retry logic
   - Add undo/redo for failed operations

4. **Loading States**
   - Show skeleton screens while loading
   - Add pull-to-refresh
   - Display sync status

5. **Conflict Resolution**
   - Handle simultaneous edits from multiple devices
   - Use version numbers or timestamps

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Zustand Docs**: https://docs.pmnd.rs/zustand
- **Expo Docs**: https://docs.expo.dev

## Summary

You now have a fully functional cloud-backed todo app with real-time sync! 🎉

The integration:
- ✅ Stores todos in Supabase
- ✅ Syncs across devices in real-time
- ✅ Keeps Zustand for local state (fast UI)
- ✅ Uses optimistic updates for instant feedback
- ✅ Maintains the existing app structure

Test it out by running the app on multiple devices and watching the magic happen!
