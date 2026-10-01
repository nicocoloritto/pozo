import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import areasData from '../../data/areas.json';
import barriosData from '../../data/barrios.json';
import EmptyState from '../../components/EmptyState';
import ReclamoCardSkeleton from '../../components/ReclamoCardSkeleton';
import StatusStamp from '../../components/StatusStamp';
import { categoryLabels, categoryOrder } from '../../constants/categories';
import { useAuth } from '../../contexts/AuthContext';
import { estaVencido, ordenarPorPrioridad } from '../../lib/prioridad';
import { obtenerReclamosPorMunicipio } from '../../services/reclamos';
import type { Area } from '../../types/area';
import type { Barrio } from '../../types/estadisticas';
import { CATEGORIAS_PELIGROSAS } from '../../types/reclamo';
import type { Categoria, Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../../theme';

type Segmento = 'nuevos' | 'gestion' | 'cerrados';

const areas = areasData as Area[];
const barrios = barriosData as Barrio[];

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

type Filtros = {
  barrio: string | null;
  comuna: number | null;
  categoria: Categoria | null;
  area: string | null;
};

const FILTROS_VACIOS: Filtros = { barrio: null, comuna: null, categoria: null, area: null };

export default function BandejaScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [reclamos, setReclamos] = useState<Reclamo[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [segmento, setSegmento] = useState<Segmento>('nuevos');
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const municipioId = user && user.rol === 'admin' ? user.municipioId : null;

  const cargar = useCallback(async () => {
    if (!municipioId) return;
    const data = await obtenerReclamosPorMunicipio(municipioId);
    setReclamos(data);
  }, [municipioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleRefresh() {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  }

  if (!municipioId) return null;

  const barriosDelMunicipio = barrios.filter((b) => b.municipioId === municipioId);
  const comunas = Array.from(new Set(barriosDelMunicipio.map((b) => b.comuna))).sort((a, b) => a - b);

  const porSegmento = (reclamos ?? []).filter((r) =>
    segmento === 'nuevos' ? esNuevo(r) : segmento === 'gestion' ? esEnGestion(r) : esCerrado(r)
  );

  const contadores = {
    nuevos: (reclamos ?? []).filter(esNuevo).length,
    gestion: (reclamos ?? []).filter(esEnGestion).length,
    cerrados: (reclamos ?? []).filter(esCerrado).length,
  };

  const textoBusqueda = busqueda.trim().toLowerCase();
  const filtrados = porSegmento.filter((r) => {
    if (filtros.barrio && r.neighborhood !== filtros.barrio) return false;
    if (filtros.comuna && r.comuna !== filtros.comuna) return false;
    if (filtros.categoria && r.category !== filtros.categoria) return false;
    if (filtros.area && r.areaAsignada !== filtros.area) return false;
    if (textoBusqueda && !r.address?.toLowerCase().includes(textoBusqueda)) return false;
    return true;
  });

  const ordenados = ordenarPorPrioridad(filtrados);
  const hayFiltrosActivos = Object.values(filtros).some(Boolean);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Bandeja</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtros"
          onPress={() => setFiltrosAbiertos(true)}
          style={[styles.filterButton, hayFiltrosActivos && styles.filterButtonActive]}
        >
          <Ionicons name="options-outline" size={18} color={hayFiltrosActivos ? colors.chalk : colors.asphalt} />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color={colors.concrete} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por dirección…"
          placeholderTextColor={colors.concrete}
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.concrete} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="file-tray-outline"
              message={
                hayFiltrosActivos || textoBusqueda
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

      <Modal visible={filtrosAbiertos} animationType="slide" onRequestClose={() => setFiltrosAbiertos(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <Pressable onPress={() => setFiltrosAbiertos(false)} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Ionicons name="close" size={24} color={colors.asphalt} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <FiltroSeccion
              titulo="Barrio"
              opciones={barriosDelMunicipio.map((b) => ({ id: b.nombre, label: b.nombre }))}
              valor={filtros.barrio}
              onChange={(valor) => setFiltros((prev) => ({ ...prev, barrio: valor }))}
            />
            <FiltroSeccion
              titulo="Comuna"
              opciones={comunas.map((c) => ({ id: String(c), label: `Comuna ${c}` }))}
              valor={filtros.comuna ? String(filtros.comuna) : null}
              onChange={(valor) => setFiltros((prev) => ({ ...prev, comuna: valor ? Number(valor) : null }))}
            />
            <FiltroSeccion
              titulo="Categoría"
              opciones={categoryOrder.map((c) => ({ id: c, label: categoryLabels[c] }))}
              valor={filtros.categoria}
              onChange={(valor) => setFiltros((prev) => ({ ...prev, categoria: valor as Categoria | null }))}
            />
            <FiltroSeccion
              titulo="Área"
              opciones={areas.map((a) => ({ id: a.id, label: a.nombre }))}
              valor={filtros.area}
              onChange={(valor) => setFiltros((prev) => ({ ...prev, area: valor }))}
            />
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
            onPress={() => setFiltros(FILTROS_VACIOS)}
            accessibilityRole="button"
            accessibilityLabel="Limpiar filtros"
          >
            <Text style={styles.clearButtonText}>Limpiar filtros</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

type Opcion = { id: string; label: string };

function FiltroSeccion({
  titulo,
  opciones,
  valor,
  onChange,
}: {
  titulo: string;
  opciones: Opcion[];
  valor: string | null;
  onChange: (valor: string | null) => void;
}) {
  return (
    <View style={styles.filtroSeccion}>
      <Text style={styles.filtroTitulo}>{titulo}</Text>
      <View style={styles.filtroOpciones}>
        {opciones.map((opcion) => (
          <Pressable
            key={opcion.id}
            onPress={() => onChange(valor === opcion.id ? null : opcion.id)}
            style={[styles.filtroChip, valor === opcion.id && styles.filtroChipActive]}
          >
            <Text style={[styles.filtroChipText, valor === opcion.id && styles.filtroChipTextActive]}>
              {opcion.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function BandejaRow({ reclamo, onPress }: { reclamo: Reclamo; onPress: () => void }) {
  const area = useMemo(() => areas.find((a) => a.id === reclamo.areaAsignada), [reclamo.areaAsignada]);
  const vencido = estaVencido(reclamo, areas);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reclamo de ${categoryLabels[reclamo.category]} en ${reclamo.address ?? 'ubicación sin resolver'}${vencido ? ', vencido' : ''}`}
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
          {vencido && (
            <View style={styles.vencidoChip}>
              <Text style={styles.vencidoChipText}>VENCIDO</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowAddress} numberOfLines={1}>
          {reclamo.address ?? 'Ubicación sin resolver'} · {reclamo.neighborhood ?? '—'}
        </Text>
        <View style={styles.rowFooter}>
          <StatusStamp status={reclamo.status} />
          <Text style={styles.rowMeta}>
            {reclamo.confirmaciones.length} conf. {area ? `· ${area.nombre}` : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.chalk,
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
    color: colors.asphalt,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.asphalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.asphalt,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.chalk2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
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
    borderColor: colors.asphalt,
  },
  segmentActive: {
    backgroundColor: colors.asphalt,
  },
  segmentText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.asphalt,
  },
  segmentTextActive: {
    color: colors.chalk,
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
    color: colors.concrete,
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
    color: colors.asphalt,
    flexShrink: 1,
  },
  vencidoChip: {
    backgroundColor: colors.rust,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  vencidoChipText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 9,
    color: colors.chalk,
  },
  rowAddress: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.concrete,
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
    color: colors.concrete,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.chalk,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.asphalt,
  },
  modalContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  filtroSeccion: {
    gap: spacing.sm,
  },
  filtroTitulo: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
  },
  filtroOpciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filtroChip: {
    borderWidth: 1,
    borderColor: colors.asphalt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  filtroChipActive: {
    backgroundColor: colors.asphalt,
  },
  filtroChipText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
  },
  filtroChipTextActive: {
    color: colors.chalk,
  },
  clearButton: {
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.rust,
    padding: spacing.md,
    alignItems: 'center',
  },
  clearButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.rust,
  },
});
