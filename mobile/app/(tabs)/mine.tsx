import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import ReclamoCard from '../../components/ReclamoCard';
import ReclamoCardSkeleton from '../../components/ReclamoCardSkeleton';
import { statusLabels } from '../../constants/status';
import { useAuth } from '../../contexts/AuthContext';
import { devLog } from '../../lib/devLog';
import { ESTADOS_RECLAMO, obtenerReclamos, obtenerReclamosPorAutor } from '../../services/reclamos';
import type { EstadoReclamo, Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, radii, spacing } from '../../theme';

export default function MineScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();

  const [reclamos, setReclamos] = useState<Reclamo[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<EstadoReclamo | null>(null);

  const autorId = user && user.rol === 'vecino' ? user.id : null;

  const cargar = useCallback(async () => {
    if (!autorId) return;
    const data = await obtenerReclamosPorAutor(autorId);
    setReclamos(data);
    if (__DEV__) {
      // Diagnóstico: si faltan reclamos, acá se ve si el id de la sesión coincide con los
      // autorId guardados y cuántos reclamos hay en total en el storage.
      const todos = await obtenerReclamos();
      devLog('mis-reclamos', {
        idDeLaSesion: autorId,
        reclamosEnStorage: todos.length,
        conEseAutorId: data.length,
        autorIdsEnStorage: Array.from(new Set(todos.map((r) => r.autorId))),
      });
    }
  }, [autorId]);

  // Se recarga cada vez que la tab vuelve a estar en foco: un reclamo recién publicado o
  // confirmado tiene que aparecer sin tener que hacer pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  }

  if (!autorId) return null;

  const contadores = ESTADOS_RECLAMO.reduce<Record<EstadoReclamo, number>>((acc, estado) => {
    acc[estado] = (reclamos ?? []).filter((r) => r.status === estado).length;
    return acc;
  }, {} as Record<EstadoReclamo, number>);

  const listaFiltrada = filtro ? (reclamos ?? []).filter((r) => r.status === filtro) : reclamos ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis reclamos</Text>
        <Text style={styles.subtitle}>Seguí el avance de lo que reportaste</Text>
        {reclamos && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.countersRow}
          >
            <Pressable
              onPress={() => setFiltro(null)}
              style={[styles.counterChip, filtro === null && styles.counterChipActive]}
            >
              <Text style={[styles.counterChipText, filtro === null && styles.counterChipTextActive]}>
                Todos · {reclamos.length}
              </Text>
            </Pressable>
            {ESTADOS_RECLAMO.map((estado) => (
              <Pressable
                key={estado}
                onPress={() => setFiltro(estado)}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${statusLabels[estado]}`}
                style={[styles.counterChip, filtro === estado && styles.counterChipActive]}
              >
                <Text style={[styles.counterChipText, filtro === estado && styles.counterChipTextActive]}>
                  {statusLabels[estado]} · {contadores[estado]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {reclamos === null ? (
        <View style={styles.list}>
          {[1, 2, 3].map((n) => (
            <ReclamoCardSkeleton key={n} />
          ))}
        </View>
      ) : (
        <FlatList
          data={listaFiltrada}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.inkSoft} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              message={
                filtro
                  ? `No tenés reclamos en "${statusLabels[filtro]}".`
                  : 'Todavía no hiciste reclamos.'
              }
              actionLabel={filtro ? undefined : 'Hacer un reclamo'}
              onAction={filtro ? undefined : () => router.push('/reclamos/new')}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(Math.min(index, 5) * 55).springify().damping(17)}>
              <ReclamoCard reclamo={item} onPress={() => router.push(`/reclamos/${item.id}`)} />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.ink,
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  countersRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  counterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  counterChipActive: {
    backgroundColor: colors.cobalt,
  },
  counterChipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs + 1,
    color: colors.inkSoft,
  },
  counterChipTextActive: {
    color: colors.surface,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 120,
    gap: spacing.md,
  },
});
