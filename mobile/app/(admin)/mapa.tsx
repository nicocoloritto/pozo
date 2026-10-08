import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import FiltrosMunicipioModal from '../../components/FiltrosMunicipioModal';
import ReclamosMap from '../../components/ReclamosMap';
import { useAuth } from '../../contexts/AuthContext';
import { aplicarFiltros, FILTROS_VACIOS, hayFiltrosActivos } from '../../lib/filtrosMunicipio';
import type { FiltrosMunicipio } from '../../lib/filtrosMunicipio';
import { obtenerReclamosPorMunicipio } from '../../services/reclamos';
import type { Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, radii, shadows, spacing } from '../../theme';

// Mapa del municipio: el mismo mapa del vecino con todos los reclamos del municipio, los
// mismos filtros que la Bandeja, y marcas para los vencidos y los peligrosos. La tarjeta
// del marcador abre el Detalle con gestión.
export default function MapaAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // router.setParams manda SET_PARAMS al navegador raíz y el param termina en la ruta
  // "(admin)", no en esta pantalla: reclamoId nunca se borraba. navigation.setParams actúa
  // sobre la ruta de esta pantalla.
  const navigation = useNavigation<{ setParams: (params: { reclamoId?: string }) => void }>();
  const { user } = useAuth();
  // Viene del mini mapa del Detalle: el reclamo que hay que mostrar centrado.
  const { reclamoId } = useLocalSearchParams<{ reclamoId?: string }>();
  const reclamoIdRef = useRef(reclamoId);
  reclamoIdRef.current = reclamoId;
  // Ref para que la función sea estable aunque useNavigation devuelva otro objeto: si
  // cambiara, useFocusEffect volvería a leer los reclamos en cada render.
  const navigationRef = useRef(navigation);
  navigationRef.current = navigation;
  const limpiarReclamoId = useCallback(() => navigationRef.current.setParams({ reclamoId: undefined }), []);
  const municipioId = user && user.rol === 'admin' ? user.municipioId : null;

  const [reclamos, setReclamos] = useState<Reclamo[] | null>(null);
  const [filtros, setFiltros] = useState<FiltrosMunicipio>(FILTROS_VACIOS);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [avisoFiltros, setAvisoFiltros] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!municipioId) return;
      obtenerReclamosPorMunicipio(municipioId).then((lista) => {
        setReclamos(lista);
        // Con la lista recién leída: si el reclamo pedido ya no existe, se descarta el
        // parámetro para que no quede pendiente.
        const pedido = reclamoIdRef.current;
        if (pedido && !lista.some((r) => r.id === pedido)) limpiarReclamoId();
      });
    }, [municipioId, limpiarReclamoId])
  );

  // Si el reclamo pedido no pasa los filtros activos, se limpian (y se avisa) para que se
  // vea igual.
  useEffect(() => {
    if (!reclamoId || !reclamos) return;
    const objetivo = reclamos.find((r) => r.id === reclamoId);
    if (!objetivo) return;
    if (aplicarFiltros([objetivo], filtros).length === 0) {
      setFiltros(FILTROS_VACIOS);
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

  // Memoizada (antes del return temprano, por las reglas de hooks): un array nuevo en cada
  // render rearmaba el índice de supercluster del mapa.
  const visibles = useMemo(() => aplicarFiltros(reclamos ?? [], filtros), [reclamos, filtros]);

  if (!municipioId) return null;

  const filtrosActivos = hayFiltrosActivos(filtros);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mapa</Text>
          <Text style={styles.subtitle}>
            {visibles.length} reclamo{visibles.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtros"
          onPress={() => setFiltrosAbiertos(true)}
          style={[styles.filterButton, filtrosActivos && styles.filterButtonActive]}
        >
          <Ionicons name="options-outline" size={18} color={filtrosActivos ? colors.bg : colors.ink} />
        </Pressable>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.pink }]}>
            <Ionicons name="alarm" size={9} color={colors.ink} />
          </View>
          <Text style={styles.legendText}>Vencido</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.mandarin }]}>
            <Ionicons name="warning" size={9} color={colors.ink} />
          </View>
          <Text style={styles.legendText}>Peligroso</Text>
        </View>
      </View>

      {avisoFiltros && (
        <View style={styles.aviso}>
          <Text style={styles.avisoText}>Quitamos los filtros para mostrar ese reclamo.</Text>
        </View>
      )}
      <ReclamosMap
        reclamos={visibles}
        loading={reclamos === null}
        enfocarId={reclamoId}
        onEnfocado={limpiarReclamoId}
        modoMunicipio
        overlayBottom={82 + insets.bottom}
        onOpenReclamo={(reclamo) => router.push(`/admin-reclamo/${reclamo.id}`)}
      />

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
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cobaltSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.cobalt,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  aviso: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.cobalt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  avisoText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.surface,
  },
});
