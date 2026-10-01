import { StyleSheet, Text, View } from 'react-native';
import { statusColors, statusLabels, statusTextColors } from '../constants/status';
import type { EstadoReclamo } from '../types/reclamo';
import { fonts, fontSizes, spacing } from '../theme';

type StatusStampProps = {
  status: EstadoReclamo;
};

// Flat tag used on report cards and lists (design/pozo-pantallas-hifi.html). The
// circular "sello" version for the detail screen lives with that screen: this one is
// the compact, reusable piece.
export default function StatusStamp({ status }: StatusStampProps) {
  return (
    <View style={[styles.tag, { backgroundColor: statusColors[status] }]}>
      <Text style={[styles.text, { color: statusTextColors[status] }]}>{statusLabels[status]}</Text>
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
  },
});
