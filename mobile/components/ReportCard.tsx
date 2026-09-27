import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import CategoryChip from './CategoryChip';
import StatusStamp from './StatusStamp';
import { categoryLabels } from '../constants/categories';
import type { Report } from '../types/report';
import { isUrgent } from '../types/report';
import { colors, fonts, fontSizes, spacing } from '../theme';

type ReportCardProps = {
  report: Report;
  onPress?: () => void;
};

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

// Reused across the map feed, "Mis reclamos" and search results
// (design/figma/02-mapa.png, 05-mis-reclamos.png).
export default function ReportCard({ report, onPress }: ReportCardProps) {
  const urgent = isUrgent(report);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={{ uri: report.photoUrl }} style={styles.photo} resizeMode="cover" />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.title} numberOfLines={1}>
            {categoryLabels[report.category]}
          </Text>
          <Text style={styles.days}>{daysSince(report.createdAt)}d</Text>
        </View>
        <Text style={styles.address} numberOfLines={1}>
          {report.address ?? 'Ubicación sin resolver'}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.confirmations}>{report.confirmations} CONF.</Text>
          <StatusStamp status={report.status} urgent={urgent} />
        </View>
      </View>
      <CategoryChip category={report.category} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  pressed: {
    opacity: 0.7,
  },
  photo: {
    width: 56,
    height: 56,
    backgroundColor: colors.asphalt,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.asphalt,
    flexShrink: 1,
  },
  days: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
  },
  address: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.concrete,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  confirmations: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
  },
});
