import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import FiltrosMunicipioModal from '../../components/FiltrosMunicipioModal';
import ReclamoCardSkeleton from '../../components/ReclamoCardSkeleton';
import StatusStamp from '../../components/StatusStamp';
import { categoryLabels } from '../../constants/categories';
import { useAuth } from '../../contexts/AuthContext';
import { aplicarFiltros, FILTROS_VACIOS, hayFiltrosActivos } from '../../lib/filtrosMunicipio';
import type { FiltrosMunicipio } from '../../lib/filtrosMunicipio';
import { estaVencido, ordenarPorPrioridad } from '../../lib/prioridad';
import { resumenVerificacion } from '../../lib/verificacion';
import { areaPorId, AREAS } from '../../services/areas';
import { obtenerReclamosPorMunicipio } from '../../services/reclamos';
import { CATEGORIAS_PELIGROSAS } from '../../types/reclamo';
import type { Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../../theme';

type Segmento = 'nuevos' | 'gestion' | 'cerrados';

function esNuevo(reclamo: Reclamo): boolean {
  return (
    reclamo.status === 'ConfirmadoPorVecinos' ||
    (reclamo.status === 'Reportado' && CATEGORIAS_PELIGROSAS.includes(reclamo.category))
  );
}

function esEnGestion(reclamo: Reclamo): boolean {
  return reclamo.status === 'EnviadoAlMunicipio' || reclamo.status === 'EnReparacion';
}

function esCerrado(reclamo: Reclamo): boolean {
  return reclamo.status === 'Resuelto' || reclamo.status === 'Rechazado';
}

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)));
}

export default function BandejaScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [reclamos, setReclamos] = useState<Reclamo[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [segmento, setSegmento] = useState<Segmento>('nuevos');
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState<FiltrosMunicipio>(FILTROS_VACIOS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const municipioId = user && user.rol === 'admin' ? user.municipioId : null;

  const cargar = useCallback(async () => {
    if (!municipioId) return;
    const data = await obtenerReclamosPorMunicipio(municipioId);
    setReclamos(data);
  }, [municipioId]);

  // Se recarga cada vez que la tab vuelve a estar en foco: así aparecen los reclamos
  // recién publicados y los cambios de estado hechos desde el Detalle.
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

  if (!municipioId) return null;

  const porSegmento = (reclamos ?? []).filter((r) =>
    segmento === 'nuevos' ? esNuevo(r) : segmento === 'gestion' ? esEnGestion(r) : esCerrado(r)
  );

  const contadores = {
    nuevos: (reclamos ?? []).filter(esNuevo).length,
    gestion: (reclamos ?? []).filter(esEnGestion).length,
    cerrados: (reclamos ?? []).filter(esCerrado).length,
  };

  const textoBusqueda = busqueda.trim().toLowerCase();
  const filtrados = aplicarFiltros(porSegmento, filtros).filter(
    (r) => !textoBusqueda || r.address?.toLowerCase().includes(textoBusqueda)
  );

  const ordenados = ordenarPorPrioridad(filtrados);
  const filtrosActivos = hayFiltrosActivos(filtros);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Bandeja</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtros"
          onPress={() => setFiltrosAbiertos(true)}
          style={[styles.filterButton, filtrosActivos && styles.filterButtonActive]}
        >
          <Ionicons name="options-outline" size={18} color={filtrosActivos ? colors.bg : colors.ink} />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color={colors.inkSoft} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por dirección…"
          placeholderTextColor={colors.inkSoft}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <View style={styles.segments}>
        {(
          [
            ['nuevos', 'Nuevos'],
            ['gestion', 'En gestión'],
            ['cerrados', 'Cerrados'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setSegmento(key)}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${label}`}
            style={[styles.segment, segmento === key && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, segmento === key && styles.segmentTextActive]}>
              {label} · {contadores[key]}
            </Text>
          </Pressable>
        ))}
      </View>

      {reclamos === null ? (
        <View style={styles.list}>
          {[1, 2, 3].map((n) => (
            <ReclamoCardSkeleton key={n} />
          ))}
        </View>
      ) : (
        <FlatList
          data={ordenados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.inkSoft} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="file-tray-outline"
              message={
                filtrosActivos || textoBusqueda
                  ? 'Ningún reclamo coincide con el filtro.'
                  : 'No hay reclamos en esta bandeja todavía.'
              }
            />
          }
          renderItem={({ item }) => (
            <BandejaRow reclamo={item} onPress={() => router.push(`/admin-reclamo/${item.id}`)} />
          )}
        />
      )}

      <FiltrosMunicipioModal
        visible={filtrosAbiertos}
        municipioId={municipioId}
        filtros={filtros}
        onClose={() => setFiltrosAbiertos(false)}
        onApply={setFiltros}
      />
    </SafeAreaView>
  );
}

function BandejaRow({ reclamo, onPress }: { reclamo: Reclamo; onPress: () => void }) {
  const area = areaPorId(reclamo.areaAsignada);
  const vencido = estaVencido(reclamo, AREAS);
  const { yaNoEsta, posiblementeResuelto } = resumenVerificacion(reclamo, null);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reclamo de ${categoryLabels[reclamo.category]} en ${reclamo.address ?? 'ubicación sin resolver'}${vencido ? ', vencido' : ''}${posiblementeResuelto ? ', posiblemente resuelto' : ''}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowPhotoWrap}>
        <Text style={styles.rowDays}>{daysSince(reclamo.createdAt)}d</Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTopLine}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {categoryLabels[reclamo.category]}
          </Text>
          <View style={styles.chips}>
            {posiblementeResuelto && (
              <View style={styles.resueltoChip}>
                <Text style={styles.vencidoChipText}>POSIBLEMENTE RESUELTO</Text>
              </View>
            )}
            {vencido && (
              <View style={styles.vencidoChip}>
                <Text style={styles.vencidoChipText}>VENCIDO</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.rowAddress} numberOfLines={1}>
          {reclamo.address ?? 'Ubicación sin resolver'} · {reclamo.neighborhood ?? '—'}
        </Text>
        <View style={styles.rowFooter}>
          <StatusStamp status={reclamo.status} />
          <Text style={styles.rowMeta}>
            {reclamo.confirmaciones.length} sigue · {yaNoEsta} ya no está{area ? ` · ${area.nombre}` : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.ink,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  segments: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  segmentActive: {
    backgroundColor: colors.ink,
  },
  segmentText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  segmentTextActive: {
    color: colors.bg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  rowPhotoWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDays: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
    flexShrink: 1,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexShrink: 0,
  },
  resueltoChip: {
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  vencidoChip: {
    backgroundColor: colors.coral,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  vencidoChipText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 9,
    color: colors.bg,
  },
  rowAddress: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rowMeta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
});
