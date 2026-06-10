import {
  Image,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, radius, typography } from '@/themes';

type AvatarProps = {
  imageUrl?: string;
  name?: string;
  size?: number;
  style?: ViewStyle;
};

export function Avatar({ imageUrl, name, size = 48, style }: AvatarProps) {
  const initials = getInitials(name);
  const avatarStyle = {
    borderRadius: size / 2,
    height: size,
    width: size,
  };

  if (imageUrl) {
    return (
      <View style={[styles.avatar, avatarStyle, style]}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
      </View>
    );
  }

  return (
    <View style={[styles.avatar, avatarStyle, style]}>
      <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.36) }]}>
        {initials}
      </Text>
    </View>
  );
}

function getInitials(name?: string) {
  if (!name?.trim()) {
    return '?';
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  initials: {
    color: colors.white,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
  },
});
