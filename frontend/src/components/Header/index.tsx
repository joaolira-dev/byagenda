import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/themes';

type HeaderProps = {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: ReactNode;
  onRightPress?: () => void;
  style?: ViewStyle;
};

export function Header({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightIcon,
  onRightPress,
  style,
}: HeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>
        {showBackButton ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBackPress}
            style={styles.iconButton}
          >
            <Text style={styles.backIcon}>{'‹'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.titleContainer}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.side}>
        {rightIcon ? (
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!onRightPress}
            onPress={onRightPress}
            style={styles.iconButton}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: spacing.md,
  },
  side: {
    alignItems: 'center',
    minWidth: 44,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backIcon: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 36,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.size.lg,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
  },
});
