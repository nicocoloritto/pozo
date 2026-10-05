import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReclamosMap from '../../components/ReclamosMap';
import { categoryLabels, categoryOrder } from '../../constants/categories';
import { statusLabels } from '../../constants/status';
import { ESTADOS_RECLAMO, obtenerReclamos } from '../../services/reclamos';
import type { Categoria, EstadoReclamo, Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../../theme';

export default function MapScreen() {
  const router = useRouter();
  // Viene del mini mapa de un Detalle: el reclamo que hay que mostrar centrado.
  const { reclamoId } = useLocalSearchParams<{ reclamoId?: string }>();
  const reclamoIdRef = useRef(reclamoId);
  reclamoIdRef.current = reclamoId;

  const [avisoFiltros, setAvisoFiltros] = useState(false);
  const [reclamos, setReclamos] = useState<Reclamo[] | null>(null);
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
        if (pedido && !lista.some((r) => r.id === pedido)) router.setParams({ reclamoId: undefined });
      });
    }, [router])
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

  const reclamosFiltrados = (reclamos ?? []).filter((reclamo) => {
    if (categoriaFiltro.size > 0 && !categoriaFiltro.has(reclamo.category)) return false;
    if (estadoFiltro.size > 0 && !estadoFiltro.has(reclamo.status)) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {categoryOrder.map((categoria) => (
          <Pressable
            key={categoria}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${categoryLabels[categoria]}`}
            onPress={() => toggleCategoria(categoria)}
            style={[styles.chip, categoriaFiltro.has(categoria) && styles.chipActive]}
          >
            <Text style={[styles.chipText, categoriaFiltro.has(categoria) && styles.chipTextActive]}>
              {categoryLabels[categoria]}
            </Text>
          </Pressable>
        ))}
        <View style={styles.filterDivider} />
        {ESTADOS_RECLAMO.map((estado) => (
          <Pressable
            key={estado}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${statusLabels[estado]}`}
            onPress={() => toggleEstado(estado)}
            style={[styles.chip, estadoFiltro.has(estado) && styles.chipActive]}
          >
            <Text style={[styles.chipText, estadoFiltro.has(estado) && styles.chipTextActive]}>
              {statusLabels[estado]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {avisoFiltros && (
        <View style={styles.aviso}>
          <Text style={styles.avisoText}>Quitamos los filtros para mostrar ese reclamo.</Text>
        </View>
      )}
      <ReclamosMap
        reclamos={reclamosFiltrados}
        loading={reclamos === null}
        enfocarId={reclamoId}
        onEnfocado={() => router.setParams({ reclamoId: undefined })}
        centrarEnUsuario
        onOpenReclamo={(reclamo) => router.push(`/reclamos/${reclamo.id}`)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.chalk,
  },
  filterScroll: {
    flexGrow: 0,
    backgroundColor: colors.chalk,
  },
  filterRow: {
    gap: spacing.xs,
    padding: spacing.md,
    alignItems: 'center',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginHorizontal: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.asphalt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.asphalt,
  },
  chipText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.asphalt,
  },
  chipTextActive: {
    color: colors.chalk,
  },
  aviso: {
    backgroundColor: colors.asphalt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  avisoText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.chalk,
  },
});
