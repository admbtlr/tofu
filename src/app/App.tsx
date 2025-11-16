import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { useCurrentTheme, useThemeStore } from '@/app/theme/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { initializeTodoStore } from '@/store/useTodoStore';
import { initializeListStore } from '@/store/useListStore';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { requestNotificationPermissions } from '@/utils/notifications';
import RootNavigator from '@/app/navigation/RootNavigator';
import AuthScreen from '@/screens/AuthScreen';

function AppContent() {
  const theme = useCurrentTheme();
  const { themeMode } = useThemeStore();
  const { user, initialized } = useAuthStore();

  // Set up realtime sync with Supabase only when authenticated
  // We pass the user to the hook so it only subscribes when logged in
  useSupabaseSync(user);

  const statusBarStyle =
    themeMode === 'dark' || (themeMode === 'system' && theme.dark)
      ? 'light'
      : 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style={statusBarStyle} />

          {/* Show loading screen while checking auth state */}
          {!initialized ? (
            <View
              style={[
                styles.loadingContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : !user ? (
            /* Show auth screen if not authenticated */
            <AuthScreen />
          ) : (
            /* Show main app if authenticated */
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          )}
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const { initialize: initializeTheme } = useThemeStore();
  const { initialize: initializeAuth, user } = useAuthStore();
  const theme = useCurrentTheme();

  const [fontsLoaded] = useFonts({
    Body: require('../../assets/fonts/IBMPlexSans-Medium.ttf'),
    Title: require('../../assets/fonts/Fraunces_72pt_SuperSoft-Light.ttf'),
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Promise.all([initializeTheme(), initializeAuth()]);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [initializeTheme, initializeAuth]);

  // Initialize todos, lists, and notifications only when user is authenticated
  useEffect(() => {
    const initializeUserData = async () => {
      if (user) {
        try {
          await Promise.all([
            initializeListStore(),
            initializeTodoStore(),
            requestNotificationPermissions(),
          ]);
        } catch (error) {
          console.error('Failed to initialize user data:', error);
        }
      }
    };

    initializeUserData();
  }, [user]);

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <AppContent />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
