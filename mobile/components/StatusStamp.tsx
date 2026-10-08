import { StyleSheet, Text, View } from 'react-native';
import { statusColors, statusLabels, statusSoftColors, statusTextColors } from '../constants/status';
import type { EstadoReclamo } from '../types/reclamo';
import { fonts, fontSizes, radii, spacing } from '../theme';

type StatusStampProps = {
  status: EstadoReclamo;
};

export default function StatusStamp({ status }: StatusStampProps) {
  return (
    <View style={[styles.pill, { backgroundColor: statusSoftColors[status] }]}>
      <View style={[styles.dot, { backgroundColor: statusColors[status] }]} />
      <Text style={[styles.text, { color: statusTextColors[status] }]}>{statusLabels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs + 1,
  },
});
