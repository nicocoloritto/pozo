import { StyleSheet, View } from 'react-native';
import Skeleton from './Skeleton';
import { spacing } from '../theme';

// Matches ReclamoCard's layout (foto + 3 líneas + chip), usado mientras carga el mapa
// o "Mis reclamos".
export default function ReclamoCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={56} height={56} />
      <View style={styles.body}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="85%" height={13} />
        <Skeleton width="40%" height={13} />
      </View>
      <Skeleton width={56} height={56} />
    </View>
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
  body: {
    flex: 1,
    gap: spacing.xs,
  },
});
