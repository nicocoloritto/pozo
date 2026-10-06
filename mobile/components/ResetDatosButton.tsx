import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors, fonts, fontSizes, spacing } from '../theme';

// Solo para desarrollo y demos: vuelve la app al estado inicial (usuarios y reclamos de
// los JSON de prueba, sin sesión). En un build de producción __DEV__ es false y no se
// renderiza nada.
export default function ResetDatosButton() {
  const router = useRouter();
  const { restablecerDatosDePrueba } = useAuth();
  const [procesando, setProcesando] = useState(false);

  if (!__DEV__) return null;

  function confirmar() {
    Alert.alert(
      'Restablecer datos de prueba',
      'Se borran los usuarios, los reclamos y la sesión guardados en este teléfono, y se vuelven a cargar los datos de prueba. Vas a volver al login.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            setProcesando(true);
            try {
              await restablecerDatosDePrueba();
              router.replace('/login');
            } catch (err) {
              console.warn('[reset] No se pudieron restablecer los datos de prueba', err);
              Alert.alert('No se pudo restablecer', 'Probá de nuevo.');
            } finally {
              setProcesando(false);
            }
          },
        },
      ]
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Restablecer datos de prueba"
      onPress={confirmar}
      disabled={procesando}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{procesando ? 'Restableciendo…' : 'Restablecer datos de prueba'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.concrete,
    padding: spacing.md,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
  },
});
