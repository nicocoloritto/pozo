import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PlaceholderScreen from '../../components/PlaceholderScreen';
import { colors, spacing } from '../../theme';

// Screen 04 of the mockup. Camera and location arrive with US-06.
export default function NewReport() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <PlaceholderScreen title="Nuevo reclamo" subtitle="Pantalla 04 del mockup" />
      <Pressable style={styles.cancel} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.chalk,
  },
  cancel: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.concrete,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
