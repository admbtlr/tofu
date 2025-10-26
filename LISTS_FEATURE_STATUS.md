# Lists Feature Implementation Status

## ✅ Completed

1. **Database Structure**
   - Created `supabase-migrations.sql` with lists table and list_id column
   - Run this SQL in your Supabase SQL editor to create the tables

2. **Types**
   - Created `/src/types/list.ts` with List type and EVERYTHING_LIST_ID constant
   - Updated `/src/types/todo.ts` to include `listId` field
   - Updated `/src/lib/supabase.ts` with ListRow and TodoRow types

3. **Storage Layer**
   - Created `/src/storage/listStorage.ts` with full CRUD operations for lists
   - Includes `migrateTodosToDefaultList()` function for existing todos
   - Updated `/src/storage/todoStorage.ts` to handle list_id field

4. **State Management**
   - Created `/src/store/useListStore.ts` with list management and selection
   - Updated `/src/store/useTodoStore.ts` to filter by selected list
   - `visibleTodos(selectedListId?)` now accepts a list ID parameter

## 🚧 Still Needed

### 1. ListDrawer Component
Need to create `/src/components/ListDrawer.tsx` with:
- Drawer that slides in from left
- "Everything" entry at top
- List of all user lists
- Swipe-to-delete on non-default lists (with confirmation dialog)
- "+" button to add new list
- Tapping a list closes drawer and sets as selected

### 2. Update Header Component
In `/src/components/Header.tsx`:
- Add hamburger menu icon button
- Pass `onMenuPress` callback prop
- Position it on the left side

### 3. Update HomeScreen
In `/src/screens/HomeScreen.tsx`:
- Import `useListStore` and get `selectedListId`
- Pass `selectedListId` to `visibleTodos(selectedListId)`
- Add state for drawer open/close
- Render ListDrawer component
- Pass hamburger handler to Header

### 4. Update TodoEditor
In `/src/components/TodoEditor.tsx`:
- Add list dropdown/picker
- Import `useListStore` to get available lists
- Default to currently selected list
- Include `listId` in `onSave` callback

### 5. Update EditTodoScreen
In `/src/screens/EditTodoScreen.tsx`:
- Update `handleSave` to include `listId`
- Pass to `addTodo` or `updateTodo`

### 6. Initialize Lists in App
In `/src/app/App.tsx`:
- Import `initializeListStore`
- Call it in the initialization Promise.all alongside `initializeTodoStore()`
- This will create default list and migrate existing todos

## Key Implementation Details

### Default List
- Name: "Personal"
- `isDefault: true`
- Cannot be deleted
- Created automatically on first launch

### Everything View
- Special ID: `EVERYTHING_LIST_ID` ('__everything__')
- Shows todos from all lists
- Always appears at top of drawer

### List Filtering
- When list selected: `todo.listId === selectedListId`
- When "Everything": show all todos
- Applied before other filters (Today/All/Completed)

### New Todo Creation
- Should include `listId` field
- Default to currently selected list
- Allow changing via dropdown in editor

## Next Steps

1. Run the SQL migration in Supabase
2. Create the ListDrawer component
3. Update Header, HomeScreen, and TodoEditor
4. Initialize lists in App.tsx
5. Test the feature end-to-end
