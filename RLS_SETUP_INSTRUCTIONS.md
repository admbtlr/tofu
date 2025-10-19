# Row Level Security (RLS) Setup Instructions

This guide explains how to enable and test Row Level Security for your todo app.

## Overview

The app now uses Supabase authentication with a hard-coded user ID for development. This allows Row Level Security (RLS) policies to automatically filter todos so users only see their own data.

## Step 1: Run the SQL Migration

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the file `supabase-rls-setup.sql` from your project root
4. Copy and paste the entire SQL script into the SQL Editor
5. Click "Run" to execute the migration

### What the Migration Does:

- **Drops old policies**: Removes the existing anonymous access policies
- **Creates test user**: Creates a user in `auth.users` with ID `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`
  - Email: `test@tofu.app`
  - Password: `test-password-123`
- **Adds RLS policies**: Creates policies that restrict access based on `user_id = auth.uid()`
  - Users can only view their own todos
  - Users can only create todos for themselves
  - Users can only update their own todos
  - Users can only delete their own todos
- **Sets default**: Makes `user_id` default to `auth.uid()` for new rows

## Step 2: How Authentication Works

The app automatically signs in with the hard-coded user on startup:

```typescript
// In src/app/App.tsx
await signInWithHardcodedUser();
```

This function (in `src/lib/supabase.ts`):
1. Checks if already signed in with the test user
2. If not, signs in with `test@tofu.app` / `test-password-123`
3. Returns success/failure status

## Step 3: How RLS Works with Your Code

### Database Layer (`src/storage/todoStorage.ts`)

All queries work automatically with RLS:

- **loadTodos()**: Returns only todos where `user_id = auth.uid()`
- **createTodo()**: The `user_id` column defaults to `auth.uid()`, so new todos are automatically associated with the authenticated user
- **updateTodo()**: Only updates if the todo belongs to the authenticated user
- **deleteTodo()**: Only deletes if the todo belongs to the authenticated user

**No code changes needed** - Supabase RLS handles all filtering automatically!

### Store Layer (`src/store/useTodoStore.ts`)

The Zustand store calls the storage functions, which now respect RLS policies.

### Realtime Sync (`src/hooks/useSupabaseSync.ts`)

The realtime subscription automatically only receives updates for the authenticated user's todos.

## Step 4: Testing the Implementation

### Test 1: Basic Functionality
1. Start the app: `npm run ios` or `npm run android` or `npm run macos`
2. Check the console for: `"Signed in successfully: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"`
3. Create a few todos - they should save normally
4. Refresh the app - todos should load correctly

### Test 2: Verify RLS in Supabase Dashboard
1. Go to Supabase Dashboard → Table Editor → `todos` table
2. Look at the `user_id` column for your todos
3. They should all have the value: `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`

### Test 3: Test RLS Policies (Optional Advanced Test)
1. In Supabase SQL Editor, try to query as an unauthenticated user:
```sql
-- This should return empty (no access)
SELECT * FROM todos;
```

2. Try to insert with a different user_id:
```sql
-- This should fail (RLS policy blocks it)
INSERT INTO todos (title, user_id)
VALUES ('Test', '00000000-0000-0000-0000-000000000000');
```

### Test 4: Multi-Device Sync
1. Run the app on two different devices/simulators
2. Create a todo on one device
3. The todo should appear on the other device (via realtime sync)
4. Both devices show the same todos (belonging to the test user)

## Troubleshooting

### "Auth error: Invalid login credentials"
- Make sure you ran the SQL migration that creates the test user
- Check that the email/password in the migration match those in `src/lib/supabase.ts`

### "Error loading todos" or empty todo list
- Check if authentication succeeded (look for console log)
- Verify RLS policies are enabled: Supabase Dashboard → Database → Tables → todos → Check "Enable RLS"
- Confirm existing todos have the correct `user_id`

### Todos not syncing
- Check that the realtime subscription is active
- Verify the user is authenticated before loading todos

## Production Considerations

This setup uses a **hard-coded user ID for development only**. For production:

1. **Remove hard-coded credentials**: Delete `signInWithHardcodedUser()` and the test user
2. **Add real authentication**:
   - Implement sign up / sign in screens
   - Use Supabase auth methods (email/password, OAuth, etc.)
   - Store auth state properly
3. **Keep the RLS policies**: They will automatically work with real users
4. **Update the default**: Change `user_id` default to `auth.uid()` (already set)

## Files Modified

- ✅ `src/lib/supabase.ts` - Added authentication function
- ✅ `src/app/App.tsx` - Calls authentication on startup
- ✅ `src/storage/todoStorage.ts` - Already RLS-compatible (no changes needed)
- ✅ `supabase-rls-setup.sql` - New migration file to run

## Next Steps

After enabling RLS, you may want to:
- Add user profile functionality
- Implement real authentication (sign up/sign in screens)
- Add user settings
- Share todos between users (would need additional policies)
