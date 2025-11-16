import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Pressable, View } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BORDER_RADIUS = 12;

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  expanded: boolean;
  onToggle: () => void;
  maxWidth?: number;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search todos...',
  expanded,
  onToggle,
  maxWidth = 300,
}: SearchBarProps) {
  const theme = useTheme();
  const widthAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const inputRef = useRef<any>(null);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false, // Width animation cannot use native driver
    }).start();

    if (expanded) {
      // Focus input when expanded
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      // Clear search when collapsed
      if (value) {
        onChangeText('');
      }
    }
  }, [expanded, value, onChangeText, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [48, maxWidth], // Icon size to full width
  });

  const inputOpacity = widthAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View style={[styles.container, { width }]}>
      {!expanded ? (
        <Pressable onPress={onToggle} style={styles.iconButton}>
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={theme.colors.onSurface}
          />
        </Pressable>
      ) : (
        <View style={styles.expandedContainer}>
          <Pressable onPress={onToggle} style={styles.iconButtonExpanded}>
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color={theme.colors.onSurface}
            />
          </Pressable>
          <Animated.View
            style={[styles.inputContainer, { opacity: inputOpacity }]}
          >
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              mode="flat"
              style={styles.input}
              dense
              underlineStyle={{ display: 'none' }}
            />
          </Animated.View>
          <Pressable onPress={onToggle} style={styles.closeButton}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.colors.onSurface}
            />
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  iconButton: {
    width: 48,
    height: 36,
    borderRadius: BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  iconButtonExpanded: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    height: 40,
    backgroundColor: 'transparent',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
