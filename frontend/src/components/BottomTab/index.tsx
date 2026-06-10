import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/themes';

type BottomTabProps = {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function BottomTab({
  label,
  icon,
  active = false,
  onPress,
  style,
}: BottomTabProps) {
  const color = active ? colors.primary : colors.textSecondary;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.container, active && styles.active, style]}
    >
      {icon}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radius.md,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 56,
    minWidth: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  active: {
    backgroundColor: '#EFF6FF',
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.xs,
    fontWeight: '500',
  },
});
