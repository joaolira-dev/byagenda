import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/themes';

type LoadingProps = {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
};

export function Loading({ size = 'large', message, fullScreen = false }: LoadingProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator color={colors.primary} size={size} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  fullScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  message: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.sm,
  },
});
