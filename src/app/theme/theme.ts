import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { loadTheme, saveTheme } from '@/storage/todoStorage';

const customFont = {
  bodyLarge: {
    ...MD3LightTheme.fonts.bodyLarge,
    fontFamily: 'iAWriterQuattroS',
  },
  bodyMedium: {
    ...MD3LightTheme.fonts.bodyMedium,
    fontFamily: 'iAWriterQuattroS',
  },
  bodySmall: {
    ...MD3LightTheme.fonts.bodySmall,
    fontFamily: 'iAWriterQuattroS',
  },
  labelLarge: {
    ...MD3LightTheme.fonts.labelLarge,
    fontFamily: 'iAWriterQuattroS',
  },
  labelMedium: {
    ...MD3LightTheme.fonts.labelMedium,
    fontFamily: 'iAWriterQuattroS',
  },
  labelSmall: {
    ...MD3LightTheme.fonts.labelSmall,
    fontFamily: 'iAWriterQuattroS',
  },
  titleLarge: {
    ...MD3LightTheme.fonts.titleLarge,
    fontFamily: 'iAWriterQuattroS',
  },
  titleMedium: {
    ...MD3LightTheme.fonts.titleMedium,
    fontFamily: 'iAWriterQuattroS',
  },
  titleSmall: {
    ...MD3LightTheme.fonts.titleSmall,
    fontFamily: 'iAWriterQuattroS',
  },
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(228, 107, 26)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(208, 237, 255)',
    onPrimaryContainer: 'rgb(0, 32, 66)',
    background: 'rgb(225, 225, 220)',
    onSurface: 'rgb(60, 30, 10)',
    surfaceVariant: 'rgb(255, 255, 255)',
    onSurfaceVariant: 'rgb(60, 30, 10)',
  },
  fonts: {
    ...MD3LightTheme.fonts,
    ...customFont,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: 'rgb(159, 216, 255)',
    onPrimary: 'rgb(0, 32, 66)',
    primaryContainer: 'rgb(0, 96, 183)',
    onPrimaryContainer: 'rgb(208, 237, 255)',
    surface: 'rgb(24, 24, 27)',
    surfaceVariant: 'rgb(68, 71, 78)',
    onSurface: 'rgb(227, 226, 230)',
    onSurfaceVariant: 'rgb(196, 199, 206)',
    outline: 'rgb(142, 145, 153)',
    outlineVariant: 'rgb(68, 71, 78)',
    background: 'rgb(16, 16, 20)',
    onBackground: 'rgb(227, 226, 230)',
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    ...customFont,
  },
};

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  initialize: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>(set => ({
  themeMode: 'system',
  setThemeMode: (mode: ThemeMode) => {
    set({ themeMode: mode });
    saveTheme(mode);
  },
  initialize: async () => {
    const savedTheme = await loadTheme();
    set({ themeMode: savedTheme });
  },
}));

export const useCurrentTheme = (): MD3Theme => {
  const { themeMode } = useThemeStore();
  const systemColorScheme = useColorScheme();

  if (themeMode === 'system') {
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  }

  return themeMode === 'dark' ? darkTheme : lightTheme;
};
