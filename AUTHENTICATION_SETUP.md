# Authentication Setup Guide

This guide explains how the authentication system works in the Tofu todo app and how to set it up.

## Overview

The app now uses **real Supabase authentication** with email and password. Users must sign up or sign in to access the app. All todos are automatically scoped to the authenticated user via Row Level Security (RLS).

## Features

- ✅ Email/password authentication
- ✅ Sign up for new users
- ✅ Sign in for existing users
- ✅ Sign out functionality
- ✅ Automatic session persistence (via AsyncStorage)
- ✅ Row Level Security (RLS) - users only see their own todos
- ✅ Auth state management with Zustand
- ✅ Loading states and error handling

## Setup Instructions

### Step 1: Run the SQL Migration

1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Open the file `supabase-auth-rls-setup.sql` from your project root
4. Copy and paste the entire SQL script
5. Click **Run** to execute the migration

This will:
- Drop any old RLS policies
- Enable Row Level Security on the `todos` table
- Create new RLS policies that check `user_id = auth.uid()`
- Set `user_id` to default to the authenticated user's ID

### Step 2: Configure Email Settings (Optional)

By default, Supabase requires email confirmation for new signups.

**For Development (Quick Testing):**
1. Go to **Authentication > Settings** in Supabase Dashboard
2. Disable **"Enable email confirmations"**
3. Users can sign up and immediately sign in

**For Production (Recommended):**
1. Keep email confirmations enabled
2. Configure SMTP settings in Supabase Dashboard
3. Customize email templates
4. Users will receive confirmation emails after signup

### Step 3: Test the App

The authentication flow is now fully functional:

```bash
# iOS
npm run ios

# Android
npm run android

# macOS
npm run macos

# Web
npm run web
```

## How It Works

### Architecture

```
┌─────────────┐
│  App.tsx    │ - Initializes auth, shows AuthScreen or main app
└──────┬──────┘
       │
       ├─────► ┌──────────────────┐
       │       │  useAuthStore    │ - Manages auth state (Zustand)
       │       └────────┬─────────┘
       │                │
       │                ├─────► signIn(email, password)
       │                ├─────► signUp(email, password)
       │                ├─────► signOut()
       │                └─────► getCurrentUser()
       │
       ├─────► ┌──────────────────┐
       │       │  AuthScreen.tsx  │ - Login/signup UI
       │       └──────────────────┘
       │
       └─────► ┌──────────────────┐
               │  HomeScreen.tsx  │ - Main app (with logout button)
               └──────────────────┘
```

### Authentication Flow

1. **App Initialization** (`App.tsx`):
   ```typescript
   - Initialize auth store
   - Check for existing session in AsyncStorage
   - If session exists, restore user
   - If no session, show AuthScreen
   ```

2. **Sign Up Flow**:
   ```typescript
   User enters email/password
   → authStore.signUp()
   → Supabase creates user account
   → Session stored in AsyncStorage
   → User object stored in Zustand
   → App shows main content
   ```

3. **Sign In Flow**:
   ```typescript
   User enters email/password
   → authStore.signIn()
   → Supabase validates credentials
   → Session stored in AsyncStorage
   → User object stored in Zustand
   → App shows main content
   ```

4. **Sign Out Flow**:
   ```typescript
   User clicks logout button
   → authStore.signOut()
   → Supabase clears session
   → AsyncStorage cleared
   → User object set to null
   → App shows AuthScreen
   ```

### Session Persistence

Sessions are automatically persisted to AsyncStorage:

```typescript
// In supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

This means:
- Users stay logged in even after closing the app
- Tokens are automatically refreshed
- No need to sign in again on app restart

### Row Level Security (RLS)

All database queries automatically filter by the authenticated user:

**SQL Policies:**
```sql
-- Users can only see their own todos
CREATE POLICY "Users can view own todos"
  ON public.todos FOR SELECT
  USING (user_id = auth.uid());

-- Users can only create todos for themselves
CREATE POLICY "Users can create own todos"
  ON public.todos FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Similar policies for UPDATE and DELETE
```

**How it works in code:**
```typescript
// In todoStorage.ts
export const loadTodos = async () => {
  // This query automatically filters by auth.uid()
  const { data } = await supabase
    .from('todos')
    .select('*');

  // Returns only the current user's todos!
  return data;
};
```

No need to manually add `user_id` filters - Supabase does it automatically!

## Key Files

### Core Authentication Files

| File | Purpose |
|------|---------|
| `src/store/useAuthStore.ts` | Zustand store managing auth state |
| `src/lib/supabase.ts` | Auth functions (signIn, signUp, signOut) |
| `src/screens/AuthScreen.tsx` | Login/signup UI |
| `src/app/App.tsx` | App initialization and conditional rendering |
| `src/components/Header.tsx` | Logout button component |

### Database Files

| File | Purpose |
|------|---------|
| `supabase-auth-rls-setup.sql` | RLS policies for real authentication |
| `src/storage/todoStorage.ts` | Database queries (RLS-compatible) |

## User Experience

### First Time User
1. Opens app
2. Sees sign up screen
3. Enters email and password
4. (Optional: Confirms email if required)
5. Automatically signed in
6. Sees empty todo list

### Returning User
1. Opens app
2. Automatically signed in (session persisted)
3. Sees their todo list

### Signing Out
1. Taps logout button in header
2. Returns to sign in screen
3. All local session data cleared

## Security Features

### Password Requirements
- Minimum 6 characters (enforced by UI and Supabase)

### Email Validation
- Valid email format required
- Validated on client and server

### Secure Storage
- Passwords never stored locally
- Only auth tokens stored in AsyncStorage
- Tokens automatically refreshed

### Row Level Security
- Database-level security
- Users cannot access other users' data
- Works even if app is compromised

## Troubleshooting

### "Invalid login credentials" error
- Check that email/password are correct
- If new user, make sure you signed up first
- Check Supabase Dashboard → Authentication → Users to verify account exists

### "Email not confirmed" error
- Email confirmation is enabled in Supabase
- Check email inbox for confirmation link
- OR disable email confirmation in Supabase Dashboard (development only)

### Todos not loading after login
- Check that RLS migration ran successfully
- Verify policies exist: Supabase Dashboard → Database → Policies
- Check browser console / app logs for errors

### User stays logged out after closing app
- Check that AsyncStorage is working
- Verify session persistence is enabled in supabase.ts
- Clear app data and try again

### "Rate limit exceeded" error
- Supabase has rate limits on auth endpoints
- Wait a few minutes before trying again
- For production, consider upgrading Supabase plan

## Testing

### Manual Testing Checklist

- [ ] Sign up with new email/password
- [ ] Sign out
- [ ] Sign in with same credentials
- [ ] Create a todo
- [ ] Close and reopen app (should still be logged in)
- [ ] Verify todo persists
- [ ] Sign out and sign in with different account
- [ ] Verify previous todos are NOT visible
- [ ] Create todo with second account
- [ ] Sign back into first account
- [ ] Verify only first account's todos are visible

### Database Verification

Check the `todos` table in Supabase:
```sql
SELECT id, title, user_id FROM todos;
```

Each todo should have:
- Different `user_id` values for different users
- All todos for one user have the same `user_id`

## Production Considerations

Before deploying to production:

1. **Enable email confirmation**
   - Go to Supabase Dashboard → Authentication → Settings
   - Enable "Enable email confirmations"

2. **Configure SMTP**
   - Set up email provider (SendGrid, Mailgun, etc.)
   - Add SMTP settings to Supabase

3. **Customize email templates**
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Customize confirmation and reset password emails

4. **Add password reset**
   - Implement "Forgot Password" flow
   - Use `supabase.auth.resetPasswordForEmail()`

5. **Add email change**
   - Allow users to update their email
   - Use `supabase.auth.updateUser()`

6. **Add profile management**
   - Create a `profiles` table
   - Add user display names, avatars, etc.

7. **Consider OAuth providers**
   - Add Google, GitHub, Apple sign-in
   - Configure in Supabase Dashboard

8. **Monitor auth metrics**
   - Track signup conversion rates
   - Monitor failed login attempts
   - Set up alerts for suspicious activity

## Next Steps

Potential features to add:

- [ ] Password reset functionality
- [ ] Email change functionality
- [ ] User profile management
- [ ] OAuth providers (Google, GitHub, Apple)
- [ ] Multi-factor authentication (MFA)
- [ ] Account deletion
- [ ] Session management (view/revoke sessions)

## Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs
2. Check app console for errors
3. Verify RLS policies are correct
4. Test auth in Supabase SQL Editor:
   ```sql
   SELECT auth.uid(); -- Should return user ID when authenticated
   ```
