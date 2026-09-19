import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

// Placeholder for screen 01 of the mockup. Only the entry into the tabs works for now.
export default function Onboarding() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        POZO<Text style={styles.logoDot}>.</Text>
      </Text>
      <Text style={styles.headline}>Onboarding</Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => router.replace('/map')}
      >
        <Text style={styles.buttonText}>Empezar a reportar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.asphalt,
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.chalk,
  },
  logoDot: {
    color: colors.yellow,
  },
  headline: {
    fontSize: 16,
    color: colors.concreteLight,
  },
  button: {
    backgroundColor: colors.yellow,
    padding: spacing.lg,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.asphalt,
  },
});
