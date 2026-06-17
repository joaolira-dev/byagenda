import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/themes';

type SearchBarProps = Omit<TextInputProps, 'onChangeText' | 'style' | 'value'> & {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  searchIcon?: ReactNode;
  containerStyle?: ViewStyle;
  style?: TextStyle;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar',
  onClear,
  searchIcon,
  containerStyle,
  placeholderTextColor = colors.placeholder,
  style,
  ...props
}: SearchBarProps) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {searchIcon ?? <Text style={styles.searchIcon}>⌕</Text>}
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        style={[styles.input, style]}
        value={value}
        {...props}
      />
      {value.length > 0 ? (
        <TouchableOpacity activeOpacity={0.7} onPress={handleClear} style={styles.clearButton}>
          <Text style={styles.clearText}>×</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    color: colors.textSecondary,
    fontSize: typography.size.lg,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.md,
    paddingVertical: 0,
  },
  clearButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  clearText: {
    color: colors.textSecondary,
    fontSize: 24,
    lineHeight: 26,
  },
});
