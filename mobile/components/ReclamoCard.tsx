import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import StatusStamp from './StatusStamp';
import { categoryLabels } from '../constants/categories';
import { formatearDistancia } from '../lib/distancia';
import { fotoSource } from '../lib/fotoReclamo';
import type { Reclamo } from '../types/reclamo';
import { colors, fonts, fontSizes, radii, shadows, spacing } from '../theme';

type ReclamoCardProps = {
  reclamo: Reclamo;
  // Solo se pasa en "Cerca tuyo": a cuántos metros está el reclamo de la persona.
  distanciaMetros?: number;
  onPress?: () => void;
};

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function antiguedad(isoDate: string): string {
  const dias = daysSince(isoDate);
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} d`;
}

// Reused across el mapa, "Mis reclamos" y resultados de búsqueda.
export default function ReclamoCard({ reclamo, distanciaMetros, onPress }: ReclamoCardProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reclamo de ${categoryLabels[reclamo.category]} en ${reclamo.address ?? 'ubicación sin resolver'}`}
      style={styles.card}
    >
      <Image source={fotoSource(reclamo)} style={styles.photo} resizeMode="cover" />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.title} numberOfLines={1}>
            {categoryLabels[reclamo.category]}
          </Text>
          <Text style={styles.meta}>
            {distanciaMetros !== undefined ? `${formatearDistancia(distanciaMetros)} · ` : ''}
            {antiguedad(reclamo.createdAt)}
          </Text>
        </View>
        <Text style={styles.address} numberOfLines={1}>
          {reclamo.address ?? 'Ubicación sin resolver'}
        </Text>
        <View style={styles.footer}>
          <StatusStamp status={reclamo.status} />
          <View style={styles.votes}>
            <Ionicons name="people" size={13} color={colors.inkMuted} />
            <Text style={styles.voteText}>{reclamo.confirmaciones.length}</Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm + 2,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  photo: {
    width: 76,
    height: 76,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  body: {
    flex: 1,
    gap: 3,
    paddingRight: spacing.xs,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: fontSizes.md + 1,
    color: colors.ink,
    flexShrink: 1,
  },
  meta: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  address: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  votes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs + 1,
    color: colors.inkSoft,
  },
});
