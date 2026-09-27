import { StyleSheet, Text, View } from 'react-native';
import { statusColors, statusLabels } from '../constants/status';
import type { ReportStatus } from '../types/report';
import { colors, fonts, fontSizes, spacing } from '../theme';

type StatusStampProps = {
  status: ReportStatus;
  urgent?: boolean;
};

// Flat tag used on report cards and lists (design/figma/05-mis-reclamos.png). The
// circular "sello" version for the detail screen lives with that screen: this one is
// the compact, reusable piece.
export default function StatusStamp({ status, urgent = false }: StatusStampProps) {
  const color = urgent ? colors.rust : statusColors[status];

  return (
    <View style={[styles.tag, { backgroundColor: color }]}>
      <Text style={styles.text}>{urgent ? 'Urgente' : statusLabels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.asphalt,
  },
});
