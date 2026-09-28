import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../../theme';

// Screen 04c of the mockup (design/figma/04c-reclamo-publicado.png). This is a
// functional placeholder for the "US-05 pantalla B" work: the circular rubber-stamp
// illustration with curved text still needs to be built (see that story). What matters
// here for US-06 is that the flow ends somewhere real, with the case number generated
// by Nuevo reclamo.
export default function Published() {
  const router = useRouter();
  const { caseNumber, address, lat, lng } = useLocalSearchParams<{
    caseNumber: string;
    address?: string;
    lat: string;
    lng: string;
  }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expediente generado</Text>
      <Text style={styles.caseNumber}>{caseNumber}</Text>
      {address ? <Text style={styles.address}>{address}</Text> : null}
      <Text style={styles.coords}>
        {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
      </Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => router.replace('/map')}
      >
        <Text style={styles.buttonText}>Ver en el mapa</Text>
      </Pressable>
      <Text style={styles.footer}>Tu expediente es público para la comunidad</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.asphalt,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.yellow,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  caseNumber: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.chalk,
    textAlign: 'center',
  },
  address: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.concreteLight,
    textAlign: 'center',
  },
  coords: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.yellow,
    padding: spacing.lg,
    alignItems: 'center',
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
  footer: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
