import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { useColorScheme, Platform } from 'react-native';
import { create } from 'zustand';
import { loadTheme, saveTheme } from '@/storage/todoStorage';

// Detect if running on Mac Catalyst
// @ts-ignore - interfaceIdiom might not be in types but exists on Mac Catalyst
export const isMac = Platform.OS === 'ios' && (Platform.constants?.interfaceIdiom === 'mac' || Platform.constants?.isMacCatalyst);

// Scale factor for Mac - reduces font sizes by 15%
const MAC_FONT_SCALE = 0.85;

// Helper to scale font sizes for Mac
export const scaleFontForMac = (font: any) => {
  if (!isMac) return font;
  return {
    ...font,
    fontSize: Math.round(font.fontSize * MAC_FONT_SCALE),
  };
};

const customFont = {
  bodyLarge: scaleFontForMac({
    ...MD3LightTheme.fonts.bodyLarge,
    fontFamily: 'Body',
  }),
  bodyMedium: scaleFontForMac({
    ...MD3LightTheme.fonts.bodyMedium,
    fontFamily: 'Body',
  }),
  bodySmall: scaleFontForMac({
    ...MD3LightTheme.fonts.bodySmall,
    fontFamily: 'Body',
  }),
  labelLarge: scaleFontForMac({
    ...MD3LightTheme.fonts.labelLarge,
    fontFamily: 'Body',
  }),
  labelMedium: scaleFontForMac({
    ...MD3LightTheme.fonts.labelMedium,
    fontFamily: 'Body',
  }),
  labelSmall: scaleFontForMac({
    ...MD3LightTheme.fonts.labelSmall,
    fontFamily: 'Body',
  }),
  titleLarge: scaleFontForMac({
    ...MD3LightTheme.fonts.titleLarge,
    fontFamily: 'Title',
    fontSize: 28,
  }),
  titleMedium: scaleFontForMac({
    ...MD3LightTheme.fonts.titleMedium,
    fontFamily: 'Title',
  }),
  titleSmall: scaleFontForMac({
    ...MD3LightTheme.fonts.titleSmall,
    fontFamily: 'Title',
  }),
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(218, 107, 26)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(208, 237, 255)',
    onPrimaryContainer: 'rgb(0, 32, 66)',
    background: 'rgb(245, 245, 240)',
    surface: 'rgb(225, 225, 220)',
    onSurface: 'rgb(60, 30, 10)',
    secondaryContainer: 'rgb(230, 215, 205)',
    onSurfaceVariant: 'rgb(60, 30, 60)',
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
    primary: 'rgb(218, 107, 26)',
    onPrimary: 'rgb(0, 32, 66)',
    primaryContainer: 'rgb(0, 96, 183)',
    onPrimaryContainer: 'rgb(208, 237, 255)',
    surface: 'rgb(24, 24, 27)',
    surfaceVariant: 'rgb(68, 71, 78)',
    onSurface: 'rgb(227, 226, 230)',
    onSurfaceVariant: 'rgb(196, 199, 206)',
    outline: 'rgb(142, 145, 153)',
    outlineVariant: 'rgb(68, 71, 78)',
    background: 'rgb(36, 36, 38)',
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

// Spacing scale factors for Mac
const MAC_SPACING_SCALE = 0.75; // Reduces spacing by 25%

/**
 * Helper function to get platform-adjusted spacing values
 * Can be used ANYWHERE - inside or outside components, in StyleSheet.create(), etc.
 * Usage: spacing(16) returns 12 on Mac, 16 on other platforms
 */
export const spacing = (value: number): number => {
  return isMac ? Math.round(value * MAC_SPACING_SCALE) : value;
};

/**
 * Utility to check if running on Mac
 */
export const useIsMac = (): boolean => {
  return isMac;
};
