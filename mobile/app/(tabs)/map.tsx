import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CercaTuyoPanel from '../../components/CercaTuyoPanel';
import PressableScale from '../../components/PressableScale';
import ReclamosMap from '../../components/ReclamosMap';
import { categoryLabels, categoryOrder, categoryTints } from '../../constants/categories';
import { statusColors, statusLabels } from '../../constants/status';
import { useAuth } from '../../contexts/AuthContext';
import { ESTADOS_RECLAMO, obtenerReclamos } from '../../services/reclamos';
import type { Categoria, EstadoReclamo, Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, radii, shadows, spacing } from '../../theme';

type FilterChipProps = {
  label: string;
  dotColor: string;
  active: boolean;
  onPress: () => void;
};

function FilterChip({ label, dotColor, active, onPress }: FilterChipProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filtrar por ${label}`}
      onPress={onPress}
      pressedScale={0.92}
      style={[styles.chip, active && styles.chipActive]}
    >
      <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </PressableScale>
  );
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  // router.setParams manda SET_PARAMS al navegador raíz y el param termina en la ruta
  // "(tabs)", no en esta pantalla: reclamoId nunca se borraba. navigation.setParams actúa
  // sobre la ruta de esta pantalla.
  const navigation = useNavigation<{ setParams: (params: { reclamoId?: string }) => void }>();
  // Viene del mini mapa de un Detalle: el reclamo que hay que mostrar centrado.
  const { reclamoId } = useLocalSearchParams<{ reclamoId?: string }>();
  const reclamoIdRef = useRef(reclamoId);
  reclamoIdRef.current = reclamoId;
  // Ref para que la función sea estable aunque useNavigation devuelva otro objeto: si
  // cambiara, useFocusEffect volvería a leer los reclamos en cada render.
  const navigationRef = useRef(navigation);
  navigationRef.current = navigation;
  const limpiarReclamoId = useCallback(() => navigationRef.current.setParams({ reclamoId: undefined }), []);

  const [avisoFiltros, setAvisoFiltros] = useState(false);
  const [reclamos, setReclamos] = useState<Reclamo[] | null>(null);
  const [nearbyHeight, setNearbyHeight] = useState(280);
  const [categoriaFiltro, setCategoriaFiltro] = useState<Set<Categoria>>(new Set());
  const [estadoFiltro, setEstadoFiltro] = useState<Set<EstadoReclamo>>(new Set());

  // Se recarga cada vez que la tab vuelve a estar en foco: así se ven los reclamos
  // recién publicados o confirmados.
  useFocusEffect(
    useCallback(() => {
      obtenerReclamos().then((lista) => {
        setReclamos(lista);
        // Con la lista recién leída: si el reclamo pedido ya no existe, se descarta el
        // parámetro para que no quede pendiente.
        const pedido = reclamoIdRef.current;
        if (pedido && !lista.some((r) => r.id === pedido)) limpiarReclamoId();
      });
    }, [limpiarReclamoId])
  );

  // Si el reclamo pedido no pasa los filtros activos, se limpian (y se avisa) para que se
  // vea igual.
  useEffect(() => {
    if (!reclamoId || !reclamos) return;
    const objetivo = reclamos.find((r) => r.id === reclamoId);
    if (!objetivo) return;
    const pasaFiltros =
      (categoriaFiltro.size === 0 || categoriaFiltro.has(objetivo.category)) &&
      (estadoFiltro.size === 0 || estadoFiltro.has(objetivo.status));
    if (!pasaFiltros) {
      setCategoriaFiltro(new Set());
      setEstadoFiltro(new Set());
      setAvisoFiltros(true);
    }
    // Solo cuando llega un pedido nuevo o datos nuevos, no en cada cambio de filtro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reclamoId, reclamos]);

  useEffect(() => {
    if (!avisoFiltros) return;
    const timeout = setTimeout(() => setAvisoFiltros(false), 4000);
    return () => clearTimeout(timeout);
  }, [avisoFiltros]);

  function toggleCategoria(categoria: Categoria) {
    setCategoriaFiltro((prev) => {
      const next = new Set(prev);
      if (next.has(categoria)) next.delete(categoria);
      else next.add(categoria);
      return next;
    });
  }

  function toggleEstado(estado: EstadoReclamo) {
    setEstadoFiltro((prev) => {
      const next = new Set(prev);
      if (next.has(estado)) next.delete(estado);
      else next.add(estado);
      return next;
    });
  }

  // Memoizada: un array nuevo en cada render rearmaba el índice de supercluster del mapa.
  const reclamosFiltrados = useMemo(
    () =>
      (reclamos ?? []).filter((reclamo) => {
        if (categoriaFiltro.size > 0 && !categoriaFiltro.has(reclamo.category)) return false;
        if (estadoFiltro.size > 0 && !estadoFiltro.has(reclamo.status)) return false;
        return true;
      }),
    [reclamos, categoriaFiltro, estadoFiltro]
  );

  return (
    <View style={styles.container}>
      <ReclamosMap
        reclamos={reclamosFiltrados}
        loading={reclamos === null}
        enfocarId={reclamoId}
        onEnfocado={limpiarReclamoId}
        centrarEnUsuario
        overlayBottom={82 + insets.bottom + nearbyHeight}
        onOpenReclamo={(reclamo) => router.push(`/reclamos/${reclamo.id}`)}
      />

      <SafeAreaView style={styles.controls} edges={['top']} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola{user ? `, ${user.firstName}` : ''}</Text>
          <Text style={styles.title}>¿Qué pasa en tu barrio?</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {categoryOrder.map((categoria) => (
            <FilterChip
              key={categoria}
              label={categoryLabels[categoria]}
              dotColor={categoryTints[categoria].base}
              active={categoriaFiltro.has(categoria)}
              onPress={() => toggleCategoria(categoria)}
            />
          ))}
          <View style={styles.filterDivider} />
          {ESTADOS_RECLAMO.map((estado) => (
            <FilterChip
              key={estado}
              label={statusLabels[estado]}
              dotColor={statusColors[estado]}
              active={estadoFiltro.has(estado)}
              onPress={() => toggleEstado(estado)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      {avisoFiltros && (
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.springify().damping(15)}
          exiting={reducedMotion ? undefined : FadeOutUp}
          style={[styles.aviso, { top: insets.top + 150 }]}
        >
          <Text style={styles.avisoText}>Quitamos los filtros para mostrar ese reclamo.</Text>
        </Animated.View>
      )}
      <View
        style={[styles.nearby, { bottom: 82 + insets.bottom }]}
        onLayout={(event) => setNearbyHeight(event.nativeEvent.layout.height)}
      >
        <View style={styles.handle} />
        <CercaTuyoPanel
          reclamos={reclamosFiltrados}
          onOpenReclamo={(reclamo) => router.push(`/reclamos/${reclamo.id}`)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  controls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    gap: 2,
    ...shadows.float,
  },
  greeting: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl + 2,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  filterScroll: {
    flexGrow: 0,
    marginTop: spacing.xs,
  },
  filterRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  filterDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.line,
    marginHorizontal: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  chipActive: {
    backgroundColor: colors.cobalt,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.surface,
  },
  aviso: {
    position: 'absolute',
    zIndex: 4,
    alignSelf: 'center',
    backgroundColor: colors.cobalt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  avisoText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs + 1,
    color: colors.surface,
  },
  nearby: {
    position: 'absolute',
    left: 0,
    right: 0,
    maxHeight: 280,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    ...shadows.float,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    marginTop: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.inkMuted,
  },
});
