import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { categoryIcons } from '../constants/categories';
import { statusColors } from '../constants/status';
import type { Reclamo } from '../types/reclamo';
import { colors } from '../theme';

type ReclamoMarkerProps = {
  reclamo: Pick<Reclamo, 'category' | 'status'>;
  size?: number;
};

// Pin used on the real map (app/(tabs)/map.tsx) and the mini-map in Detalle: a rombo
// colored by estado with the category icon inside, so a glance at the map already
// tells you what and how far along it is.
export default function ReclamoMarker({ reclamo, size = 34 }: ReclamoMarkerProps) {
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.rombo,
          { width: size, height: size, backgroundColor: statusColors[reclamo.status] },
        ]}
      >
        <View style={{ transform: [{ rotate: '-45deg' }] }}>
          <Ionicons name={categoryIcons[reclamo.category]} size={size * 0.5} color={colors.asphalt} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rombo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.chalk,
    transform: [{ rotate: '45deg' }],
  },
});
