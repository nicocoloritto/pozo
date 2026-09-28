import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../theme';

type PermissionNoticeProps = {
  title: string;
  message: string;
  onRetry: () => void;
};

// US-06: "Si rechazo un permiso, veo un mensaje que explica qué se pierde; la app no
// se cierra." Used for both camera and location denial in Nuevo reclamo.
export default function PermissionNotice({ title, message, onRetry }: PermissionNoticeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onRetry}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.buttonOutline, pressed && styles.pressed]}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.buttonOutlineText}>Abrir configuración</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.asphalt2,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.chalk,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.concreteLight,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  button: {
    flex: 1,
    backgroundColor: colors.yellow,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  buttonOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.concrete,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
    textTransform: 'uppercase',
  },
  buttonOutlineText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.chalk,
    textTransform: 'uppercase',
  },
});
