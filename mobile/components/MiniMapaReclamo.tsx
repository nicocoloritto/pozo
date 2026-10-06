import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Reclamo } from '../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../theme';
import ReclamoMarker from './ReclamoMarker';

type Props = {
  reclamo: Reclamo;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

// Mini mapa de los Detalles. No se mueve con el dedo (scroll, zoom y rotación apagados y
// pointerEvents="none" sobre el MapView), así cualquier toque lo recibe el Pressable de
// afuera y se interpreta como "abrir el mapa completo".
export default function MiniMapaReclamo({ reclamo, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ver este reclamo en el mapa completo"
      style={({ pressed }) => [styles.wrap, style, pressed && styles.pressed]}
    >
      <MapView
        style={styles.map}
        pointerEvents="none"
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        initialRegion={{
          latitude: reclamo.latitude,
          longitude: reclamo.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={{ latitude: reclamo.latitude, longitude: reclamo.longitude }}>
          <ReclamoMarker reclamo={reclamo} size={30} />
        </Marker>
      </MapView>
      <View style={styles.hint} pointerEvents="none">
        <Ionicons name="expand" size={14} color={colors.chalk} />
        <Text style={styles.hintText}>Ver en el mapa</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 140,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  map: {
    flex: 1,
  },
  hint: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(28,27,26,0.85)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  hintText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.chalk,
  },
});
