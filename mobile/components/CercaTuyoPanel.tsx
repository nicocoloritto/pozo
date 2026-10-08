import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import EmptyState from './EmptyState';
import ReclamoCard from './ReclamoCard';
import { useUbicacionUsuario } from '../hooks/useUbicacionUsuario';
import { formatearDistancia, RADIO_CERCA_TUYO_METROS, reclamosCercanos } from '../lib/distancia';
import type { Reclamo } from '../types/reclamo';
import { colors, fonts, fontSizes, radii, spacing } from '../theme';

type Props = {
  // Ya filtrados por categoría y estado en la pantalla del mapa: la lista y el mapa
  // siempre muestran lo mismo.
  reclamos: Reclamo[];
  onOpenReclamo: (reclamo: Reclamo) => void;
};

// "Cerca tuyo" de design/figma/02-mapa.png: los reclamos activos a menos de 500 m de donde
// está la persona, del más cercano al más lejano y con la distancia.
export default function CercaTuyoPanel({ reclamos, onOpenReclamo }: Props) {
  const { coords, estado, reintentar } = useUbicacionUsuario();

  const cercanos = useMemo(() => (coords ? reclamosCercanos(reclamos, coords) : []), [reclamos, coords]);
  // Si no hay ninguno dentro del radio, se dice a qué distancia está el más próximo: así
  // "vacío" no parece "roto".
  const masCercano = useMemo(
    () => (coords && cercanos.length === 0 ? (reclamosCercanos(reclamos, coords, Infinity)[0] ?? null) : null),
    [reclamos, coords, cercanos.length]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cerca tuyo</Text>
        {estado === 'lista' && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {cercanos.length} activos · {RADIO_CERCA_TUYO_METROS} m
            </Text>
          </View>
        )}
      </View>

      {estado === 'buscando' && <Text style={styles.hint}>Buscando tu ubicación…</Text>}

      {estado === 'noDisponible' && (
        <EmptyState
          icon="location-outline"
          message="Necesitamos tu ubicación para mostrar los reclamos cerca tuyo."
          actionLabel="Reintentar"
          onAction={reintentar}
        />
      )}

      {estado === 'lista' && (
        <FlatList
          data={cercanos}
          keyExtractor={(item) => item.reclamo.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="map-outline"
              message={
                masCercano
                  ? `No hay reclamos activos a menos de ${RADIO_CERCA_TUYO_METROS} m. El más cercano está a ${formatearDistancia(masCercano.distanciaMetros)}.`
                  : 'No hay reclamos activos para mostrar.'
              }
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(16)}>
              <ReclamoCard
                reclamo={item.reclamo}
                distanciaMetros={item.distanciaMetros}
                onPress={() => onOpenReclamo(item.reclamo)}
              />
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.ink,
  },
  counter: {
    backgroundColor: colors.mangoSoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  counterText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs + 1,
    color: colors.mangoDeep,
  },
  hint: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    padding: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
});
