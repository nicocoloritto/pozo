import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import ReclamoCard from '../../components/ReclamoCard';
import ReclamoCardSkeleton from '../../components/ReclamoCardSkeleton';
import { statusLabels } from '../../constants/status';
import { useAuth } from '../../contexts/AuthContext';
import { devLog } from '../../lib/devLog';
import { ESTADOS_RECLAMO, obtenerReclamos, obtenerReclamosPorAutor } from '../../services/reclamos';
import type { EstadoReclamo, Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../../theme';

export default function MineScreen() {
  const router = useRouter();
  const { user } = useAuth();

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
        {reclamos && (
          <View style={styles.countersRow}>
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
          </View>
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.concrete} />
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
          renderItem={({ item }) => (
            <ReclamoCard reclamo={item} onPress={() => router.push(`/reclamos/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.chalk,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.asphalt,
  },
  countersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  counterChip: {
    borderWidth: 1,
    borderColor: colors.asphalt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  counterChipActive: {
    backgroundColor: colors.asphalt,
  },
  counterChipText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.asphalt,
  },
  counterChipTextActive: {
    color: colors.chalk,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
