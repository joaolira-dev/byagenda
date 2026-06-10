import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/themes';

type AppModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  showCloseButton?: boolean;
};

export function AppModal({
  visible,
  onClose,
  title,
  children,
  footer,
  showCloseButton = true,
}: AppModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable style={styles.content}>
          <View style={styles.header}>
            {title ? <Text style={styles.title}>{title}</Text> : <View />}
            {showCloseButton ? (
              <Pressable hitSlop={8} onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            ) : null}
          </View>

          {children ? <View style={styles.body}>{children}</View> : null}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    elevation: 8,
    maxWidth: 420,
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOffset: {
      height: 14,
      width: 0,
    },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.size.lg,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 26,
    lineHeight: 28,
  },
  body: {
    marginTop: spacing.md,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
