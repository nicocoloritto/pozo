import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import CategoryChip from './CategoryChip';
import StatusStamp from './StatusStamp';
import { categoryLabels } from '../constants/categories';
import { formatearDistancia } from '../lib/distancia';
import { fotoSource } from '../lib/fotoReclamo';
import type { Reclamo } from '../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../theme';

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

// Reused across el mapa, "Mis reclamos" y resultados de búsqueda
// (design/pozo-pantallas-hifi.html).
export default function ReclamoCard({ reclamo, distanciaMetros, onPress }: ReclamoCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reclamo de ${categoryLabels[reclamo.category]} en ${reclamo.address ?? 'ubicación sin resolver'}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={fotoSource(reclamo)} style={styles.photo} resizeMode="cover" />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.title} numberOfLines={1}>
            {categoryLabels[reclamo.category]}
          </Text>
          <Text style={styles.days}>
            {distanciaMetros !== undefined ? `${formatearDistancia(distanciaMetros)} · ` : ''}
            {daysSince(reclamo.createdAt)}d
          </Text>
        </View>
        <Text style={styles.address} numberOfLines={1}>
          {reclamo.address ?? 'Ubicación sin resolver'}
        </Text>
        <View style={styles.footer}>
          <View style={styles.votes}>
            <View style={styles.vote}>
              <Ionicons name="thumbs-up-outline" size={13} color={colors.inkSoft} />
              <Text style={styles.voteText}>{reclamo.confirmaciones.length}</Text>
            </View>
            <View style={styles.vote}>
              <Ionicons name="thumbs-down-outline" size={13} color={colors.inkSoft} />
              <Text style={styles.voteText}>{reclamo.votosYaNoEsta?.length ?? 0}</Text>
            </View>
          </View>
          <StatusStamp status={reclamo.status} />
        </View>
      </View>
      <CategoryChip category={reclamo.category} />
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
    backgroundColor: colors.ink,
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
    color: colors.ink,
    flexShrink: 1,
  },
  days: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
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
    gap: spacing.sm,
  },
  vote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  voteText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
});
