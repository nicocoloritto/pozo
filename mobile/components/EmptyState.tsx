import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../theme';

type EmptyStateProps = {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

// Required by US-05: "una lista vacía muestra un mensaje", never a blank screen. The
// icon + optional action keep it from feeling like an error state.
export default function EmptyState({ message, icon = 'file-tray-outline', actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={40} color={colors.concrete} />
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.concrete,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.asphalt,
  },
});
