import React from 'react';
import { Appbar, IconButton, Menu, useTheme } from 'react-native-paper';
import { useThemeStore, ThemeMode } from '@/app/theme/theme';
import { useAuthStore } from '@/store/useAuthStore';

interface HeaderProps {
  title: string;
  showAdd?: boolean;
  onAddPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  showThemeToggle?: boolean;
  showLogout?: boolean;
  showMenu?: boolean;
  onMenuPress?: () => void;
}

export default function Header({
  title,
  showAdd = false,
  onAddPress,
  showBack = false,
  onBackPress,
  showThemeToggle = false,
  showLogout = false,
  showMenu = false,
  onMenuPress,
}: HeaderProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const { themeMode, setThemeMode } = useThemeStore();
  const { signOut } = useAuthStore();

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    closeMenu();
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getThemeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'weather-sunny';
      case 'dark':
        return 'weather-night';
      default:
        return 'theme-light-dark';
    }
  };

  return (
    <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
      {showMenu && (
        <IconButton
          icon="menu"
          onPress={onMenuPress}
          accessibilityLabel="Open menu"
        />
      )}
      {showThemeToggle && (
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <IconButton
              icon={getThemeIcon(themeMode)}
              onPress={openMenu}
              accessibilityLabel="Theme settings"
            />
          }
        >
          <Menu.Item
            onPress={() => handleThemeChange('light')}
            title="Light"
            leadingIcon="weather-sunny"
            trailingIcon={themeMode === 'light' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => handleThemeChange('dark')}
            title="Dark"
            leadingIcon="weather-night"
            trailingIcon={themeMode === 'dark' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => handleThemeChange('system')}
            title="System"
            leadingIcon="theme-light-dark"
            trailingIcon={themeMode === 'system' ? 'check' : undefined}
          />
        </Menu>
      )}
      {showBack && <Appbar.BackAction onPress={onBackPress} />}
      <Appbar.Content title={title} />
      {showAdd && (
        <IconButton
          icon="plus"
          onPress={onAddPress}
          accessibilityLabel="Add new todo"
        />
      )}
      {showLogout && (
        <IconButton
          icon="logout"
          onPress={handleLogout}
          accessibilityLabel="Sign out"
        />
      )}
    </Appbar.Header>
  );
}
