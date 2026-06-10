import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/themes';

type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerStyle?: ViewStyle;
  inputWrapperStyle?: ViewStyle;
  style?: TextStyle;
};

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputWrapperStyle,
  placeholderTextColor = colors.placeholder,
  multiline,
  style,
  ...props
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
          error && styles.inputWrapperError,
          inputWrapperStyle,
        ]}
      >
        {leftIcon}
        <TextInput
          multiline={multiline}
          placeholderTextColor={placeholderTextColor}
          style={[styles.input, multiline && styles.multilineInput, style]}
          {...props}
        />
        {rightIcon}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    width: '100%',
  },
  label: {
    color: colors.text,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.sm,
    fontWeight: '500',
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  multilineWrapper: {
    alignItems: 'flex-start',
    minHeight: 104,
    paddingVertical: spacing.sm,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.md,
    paddingVertical: 0,
  },
  multilineInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.error,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.xs,
  },
});
