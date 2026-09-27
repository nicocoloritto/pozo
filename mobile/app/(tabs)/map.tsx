import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import ReportCard from '../../components/ReportCard';
import { REPORTS } from '../../data/reports';
import { colors, fonts, fontSizes, spacing } from '../../theme';

// Screen 02 of the mockup (design/figma/02-mapa.png). The map illustration itself is
// still pending; this wires up the "Cerca tuyo" list with real components and data,
// which is what US-05's acceptance criteria actually check.
export default function MapScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <FlatList
        data={REPORTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Cerca tuyo</Text>}
        ListEmptyComponent={<EmptyState message="No hay reclamos cerca tuyo todavía." />}
        renderItem={({ item }) => (
          <ReportCard report={item} onPress={() => router.push(`/reports/${item.id}`)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.chalk,
  },
  list: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
    marginBottom: spacing.sm,
  },
});
