import type { ReactNode } from 'react';
import {
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/themes';

type CardProps = {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, title, subtitle, onPress, style }: CardProps) {
  const content = (
    <>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.86} onPress={onPress} style={[styles.card, style]}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: colors.text,
    shadowOffset: {
      height: 8,
      width: 0,
    },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  title: {
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.sm,
  },
});
