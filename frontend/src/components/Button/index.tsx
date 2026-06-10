import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/themes';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: ButtonProps) {
  const isInactive = disabled || loading;
  const textColor = getTextColor(variant, isInactive);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isInactive}
      onPress={onPress}
      style={[
        styles.base,
        styles[size],
        styles[variant],
        isInactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

function getTextColor(variant: ButtonVariant, disabled: boolean) {
  if (disabled) {
    return colors.white;
  }

  if (variant === 'outline' || variant === 'ghost') {
    return colors.primary;
  }

  return colors.white;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  small: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  medium: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  large: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
  text: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.size.md,
    fontWeight: '600',
  },
});
