import { StyleSheet, View } from 'react-native';
import Skeleton from './Skeleton';
import { colors, radii, shadows, spacing } from '../theme';

// Mismo layout que ReclamoCard (foto + 3 líneas), usado mientras carga el mapa o
// "Mis reclamos".
export default function ReclamoCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={88} height={88} style={styles.photo} />
      <View style={styles.body}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="85%" height={12} />
        <Skeleton width="40%" height={20} style={styles.pill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  photo: {
    borderRadius: radii.md,
  },
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  pill: {
    borderRadius: radii.pill,
  },
});
