import { Linking, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { colors, fonts, fontSizes, radii, spacing } from '../theme';

type PermissionNoticeProps = {
  title: string;
  message: string;
  onRetry: () => void;
};

export default function PermissionNotice({ title, message, onRetry }: PermissionNoticeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        <PressableScale style={styles.button} onPress={onRetry} accessibilityRole="button">
          <Text style={styles.buttonText}>Reintentar</Text>
        </PressableScale>
        <PressableScale
          style={styles.buttonOutline}
          onPress={() => Linking.openSettings()}
          accessibilityRole="button"
        >
          <Text style={styles.buttonOutlineText}>Abrir configuración</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: spacing.lg,
    padding: spacing.xl,
    gap: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  button: {
    flex: 1,
    backgroundColor: colors.cobalt,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  buttonOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cobalt,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.surface,
  },
  buttonOutlineText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.cobalt,
  },
});
