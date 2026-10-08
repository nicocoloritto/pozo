import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';
import PressableScale from './PressableScale';
import { colors, fonts, fontSizes, radii, spacing } from '../theme';

type EmptyStateProps = {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ message, icon = 'file-tray-outline', actionLabel, onAction }: EmptyStateProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInUp.springify().damping(16)} style={styles.container}>
      <View style={styles.iconBubble}>
        <Ionicons name={icon} size={30} color={colors.cobaltDeep} />
      </View>
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction && (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </PressableScale>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.cobaltSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md - 1,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.cobalt,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm + 1,
    color: colors.surface,
  },
});
