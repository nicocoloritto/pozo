import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RubberStamp from '../../components/RubberStamp';
import { colors, fonts, fontSizes, spacing } from '../../theme';

// Screen 04c of the mockup (design/figma/04c-reclamo-publicado.png).
export default function Published() {
  const router = useRouter();
  const { caseNumber, address, lat, lng } = useLocalSearchParams<{
    caseNumber: string;
    address?: string;
    lat: string;
    lng: string;
  }>();

  const today = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.stampWrap}>
        <RubberStamp
          size={190}
          color={colors.mango}
          curvedText="EXPEDIENTE · GENERADO ·"
          centerLines={['INGRESADO', today]}
        />
      </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stampWrap: {
    marginBottom: spacing.lg,
  },
  caseNumber: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.bg,
    textAlign: 'center',
  },
  address: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  coords: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    alignSelf: 'stretch',
    backgroundColor: colors.mango,
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
    color: colors.ink,
  },
  footer: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
