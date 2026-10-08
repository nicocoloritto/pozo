import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressableScale from '../../components/PressableScale';
import RubberStamp from '../../components/RubberStamp';
import { colors, fonts, fontSizes, radii, spacing } from '../../theme';

// Claim published screen (mockup screen 04c).
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
          color={colors.lime}
          curvedText="EXPEDIENTE · GENERADO ·"
          centerLines={['INGRESADO', today]}
        />
      </View>
      <Text style={styles.title}>Tu reclamo ya está en marcha</Text>
      <Text style={styles.caseNumber}>{caseNumber}</Text>
      {address ? <Text style={styles.address}>{address}</Text> : null}
      <Text style={styles.coords}>
        {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
      </Text>
      <PressableScale
        style={styles.button}
        onPress={() => router.replace('/map')}
        accessibilityRole="button"
        accessibilityLabel="Ver reclamo en el mapa"
      >
        <Text style={styles.buttonText}>Ver en el mapa</Text>
      </PressableScale>
      <Text style={styles.footer}>Tu expediente es público para la comunidad</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cobalt,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stampWrap: {
    marginBottom: spacing.lg,
  },
  title: {
    maxWidth: 300,
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    lineHeight: 36,
    color: colors.surface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  caseNumber: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.surface,
    textAlign: 'center',
  },
  address: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.surface,
    textAlign: 'center',
  },
  coords: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.surface,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    alignSelf: 'stretch',
    backgroundColor: colors.lime,
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: radii.pill,
    marginTop: spacing.sm,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  footer: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.surface,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
