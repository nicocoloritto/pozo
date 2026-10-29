import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { categoryIcons } from '../constants/categories';
import { seccionColors, statusColors } from '../constants/status';
import type { Seccion } from '../lib/filtrosMunicipio';
import type { Reclamo } from '../types/reclamo';
import { colors, shadows } from '../theme';

type ReclamoMarkerProps = {
  reclamo: Pick<Reclamo, 'category' | 'status'>;
  size?: number;
  // Mapa del municipio: pinta el pin con el color de la sección en vez del del estado.
  seccion?: Seccion;
};

// Pin del mapa y del mini-mapa del Detalle: un círculo del color del estado con el
// ícono de la categoría, así de un vistazo se ve qué es y en qué etapa está.
export default function ReclamoMarker({ reclamo, size = 34, seccion }: ReclamoMarkerProps) {
  const fondo = seccion ? seccionColors[seccion] : statusColors[reclamo.status];
  const iconColor = fondo === colors.cobalt ? colors.surface : colors.ink;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.pin,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: fondo },
        ]}
      >
        <Ionicons name={categoryIcons[reclamo.category]} size={size * 0.5} color={iconColor} />
      </View>
      <View style={[styles.tail, { backgroundColor: fondo }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.card,
  },
  tail: {
    width: 8,
    height: 8,
    marginTop: -5,
    transform: [{ rotate: '45deg' }],
    borderBottomRightRadius: 2,
  },
});
