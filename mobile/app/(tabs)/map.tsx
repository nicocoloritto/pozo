import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import PlaceholderScreen from '../../components/PlaceholderScreen';
import { colors, spacing } from '../../theme';

// Screen 02 of the mockup. The link to the detail proves the stack navigation works.
export default function MapScreen() {
  const router = useRouter();

  return (
    <>
      <PlaceholderScreen title="Mapa / Reclamos" subtitle="Pantalla 02 del mockup" />
      <Pressable style={styles.link} onPress={() => router.push('/reports/A1174')}>
        <Text style={styles.linkText}>Abrir reclamo de ejemplo</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.chalk,
  },
  linkText: {
    color: colors.rust,
    fontWeight: '700',
  },
});
