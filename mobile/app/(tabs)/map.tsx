import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import ReportCard from '../../components/ReportCard';
import { statusColors } from '../../constants/status';
import { REPORTS } from '../../data/reports';
import { colors, fonts, fontSizes, spacing } from '../../theme';

// Static positions for up to a handful of pins on the illustrated map. Sprint 1 uses
// an illustrative map, not a real one (react-native-maps is Sprint 2, class 13):
// see docs/adr/README.md and docs/diseno-funcional.md.
const PIN_POSITIONS = [
  { top: '28%', left: '22%' },
  { top: '52%', left: '58%' },
  { top: '18%', left: '68%' },
  { top: '68%', left: '38%' },
] as const;

// Screen 02 of the mockup (design/figma/02-mapa.png).
export default function MapScreen() {
  const router = useRouter();

  const activeReports = REPORTS.filter((report) => report.status !== 'Resolved');
  const worstBlock = [...activeReports].sort((a, b) => b.confirmations - a.confirmations)[0];

  return (
    <View style={styles.container}>
      <FlatList
        data={REPORTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.map}>
              {REPORTS.map((report, index) => (
                <Pressable
                  key={report.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver reclamo: ${report.address ?? report.caseNumber}`}
                  onPress={() => router.push(`/reports/${report.id}`)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pinWrap,
                    PIN_POSITIONS[index % PIN_POSITIONS.length],
                    pressed && styles.pinPressed,
                  ]}
                >
                  <View style={[styles.pin, { backgroundColor: statusColors[report.status] }]} />
                </Pressable>
              ))}
              <View style={styles.chips}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>GPS ±6 m</Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>Radio 500 m</Text>
                </View>
              </View>
            </View>

            {worstBlock && (
              <View style={styles.callout}>
                <Text style={styles.calloutBig}>#{activeReports.length}</Text>
                <Text style={styles.calloutText}>
                  CUADRA MÁS ROTA DE TU RADIO{'\n'}
                  {worstBlock.address ?? 'Ubicación sin resolver'}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              Cerca tuyo · {activeReports.length} activos
            </Text>
          </>
        }
        ListEmptyComponent={<EmptyState message="No hay reclamos cerca tuyo todavía." />}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ReportCard report={item} onPress={() => router.push(`/reports/${item.id}`)} />
          </View>
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
    paddingBottom: spacing.lg,
  },
  map: {
    height: 200,
    backgroundColor: colors.asphalt,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardWrap: {
    paddingHorizontal: spacing.lg,
  },
  pinWrap: {
    position: 'absolute',
    padding: 4,
  },
  pinPressed: {
    opacity: 0.6,
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderTopLeftRadius: 0,
    borderWidth: 2,
    borderColor: colors.chalk,
    transform: [{ rotate: '45deg' }],
  },
  chips: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.chalk,
  },
  callout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.yellow,
    padding: spacing.md,
  },
  calloutBig: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.asphalt,
  },
  calloutText: {
    flex: 1,
    marginLeft: spacing.md,
    textAlign: 'right',
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.asphalt,
    lineHeight: 14,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});
