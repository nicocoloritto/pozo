import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarChart from '../../components/BarChart';
import Skeleton from '../../components/Skeleton';
import { categoryLabels } from '../../constants/categories';
import { statusColors, statusLabels } from '../../constants/status';
import { useAuth } from '../../contexts/AuthContext';
import {
  barrioMasCercano,
  buscarBarrioPorNombre,
  obtenerBarrios,
  obtenerEstadisticasBarrio,
  obtenerRanking,
} from '../../services/estadisticas';
import { ESTADOS_RECLAMO } from '../../services/reclamos';
import type { Barrio, EstadisticasBarrio, RankingBarrio } from '../../types/estadisticas';
import { colors, fonts, fontSizes, spacing } from '../../theme';

const MUNICIPIO_ID = 'caba';

export default function EstadisticasScreen() {
  const { user } = useAuth();

  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [barrio, setBarrio] = useState<Barrio | null>(null);
  const [origenBarrio, setOrigenBarrio] = useState<'ubicación' | 'perfil' | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasBarrio | null>(null);
  const [ranking, setRanking] = useState<RankingBarrio[]>([]);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);

  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // 1) Trae la lista de barrios y elige el inicial: el más cercano por GPS o, si no
  // hay permiso/falla, el del perfil del vecino.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lista = await obtenerBarrios(MUNICIPIO_ID);
      if (cancelled) return;
      setBarrios(lista);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.granted) {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          const cercano = barrioMasCercano(lista, position.coords.latitude, position.coords.longitude);
          if (cercano && !cancelled) {
            setBarrio(cercano);
            setOrigenBarrio('ubicación');
            return;
          }
        }
      } catch {
        // sigue al fallback de abajo
      }

      if (cancelled) return;
      const neighborhood = user && user.rol === 'vecino' ? user.neighborhood : undefined;
      const delPerfil = neighborhood ? buscarBarrioPorNombre(lista, neighborhood) : undefined;
      setBarrio(delPerfil ?? lista[0] ?? null);
      setOrigenBarrio('perfil');
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Cada vez que cambia el barrio elegido, pide sus estadísticas y el ranking.
  useEffect(() => {
    if (!barrio) return;
    let cancelled = false;
    setCargandoEstadisticas(true);
    (async () => {
      const [stats, rankingCompleto] = await Promise.all([
        obtenerEstadisticasBarrio(barrio.id),
        obtenerRanking(MUNICIPIO_ID),
      ]);
      if (cancelled) return;
      setEstadisticas(stats ?? null);
      setRanking(rankingCompleto);
      setCargandoEstadisticas(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [barrio]);

  const puesto = useMemo(
    () => ranking.find((item) => item.barrioId === barrio?.id)?.puesto,
    [ranking, barrio]
  );

  const barriosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return barrios;
    return barrios.filter((b) => b.nombre.toLowerCase().includes(texto));
  }, [barrios, busqueda]);

  function seleccionarBarrio(seleccionado: Barrio) {
    setBarrio(seleccionado);
    setOrigenBarrio(null);
    setSelectorAbierto(false);
    setBusqueda('');
  }

  const categoriaData = estadisticas
    ? Object.entries(estadisticas.porCategoria).map(([categoria, valor]) => ({
        label: categoryLabels[categoria as keyof typeof categoryLabels],
        value: valor,
      }))
    : [];

  const evolucionData = estadisticas
    ? estadisticas.evolucionUltimos6Meses.map((item) => ({ label: item.mes, value: item.reclamos }))
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Estadísticas</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cambiar barrio"
          onPress={() => setSelectorAbierto(true)}
          style={({ pressed }) => [styles.barrioSelector, pressed && styles.pressed]}
        >
          <View>
            <Text style={styles.barrioLabel}>
              {origenBarrio === 'ubicación'
                ? 'Barrio más cercano a tu ubicación'
                : origenBarrio === 'perfil'
                  ? 'Barrio de tu perfil'
                  : 'Barrio elegido'}
            </Text>
            <Text style={styles.barrioNombre}>{barrio?.nombre ?? 'Elegí un barrio'}</Text>
          </View>
          <Ionicons name="chevron-expand-outline" size={20} color={colors.concrete} />
        </Pressable>

        {cargandoEstadisticas || !estadisticas ? (
          <View style={styles.skeletonBlock}>
            <Skeleton height={90} />
            <Skeleton height={160} />
            <Skeleton height={160} />
          </View>
        ) : (
          <>
            <View style={styles.statGrid}>
              <StatCard label="Total reclamos" value={String(estadisticas.totalReclamos)} />
              <StatCard label="Resueltos" value={String(estadisticas.resueltos)} />
              <StatCard label="% Resolución" value={`${estadisticas.porcentajeResolucion}%`} />
              <StatCard label="Días promedio" value={String(estadisticas.tiempoPromedioResolucionDias)} />
            </View>

            {puesto && (
              <View style={styles.rankingBox}>
                <Text style={styles.rankingBig}>{puesto}°</Text>
                <Text style={styles.rankingText}>
                  de {ranking.length} barrios de CABA por % de resolución
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Reclamos por categoría</Text>
            <View style={styles.card}>
              <BarChart data={categoriaData} color={colors.yellow} />
            </View>

            <Text style={styles.sectionTitle}>Evolución últimos 6 meses</Text>
            <View style={styles.card}>
              <BarChart data={evolucionData} color={colors.blue} />
            </View>

            <Text style={styles.sectionTitle}>Distribución por estado</Text>
            <View style={styles.card}>
              {ESTADOS_RECLAMO.map((estado) => {
                const cantidad = estadisticas.porEstado[estado] ?? 0;
                const porcentaje = estadisticas.totalReclamos
                  ? Math.round((cantidad / estadisticas.totalReclamos) * 100)
                  : 0;
                return (
                  <View key={estado} style={styles.estadoRow}>
                    <View style={[styles.estadoDot, { backgroundColor: statusColors[estado] }]} />
                    <Text style={styles.estadoLabel}>{statusLabels[estado]}</Text>
                    <View style={styles.estadoBarTrack}>
                      <View
                        style={[
                          styles.estadoBarFill,
                          { width: `${porcentaje}%`, backgroundColor: statusColors[estado] },
                        ]}
                      />
                    </View>
                    <Text style={styles.estadoCantidad}>{cantidad}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={selectorAbierto} animationType="slide" onRequestClose={() => setSelectorAbierto(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Elegí un barrio</Text>
            <Pressable onPress={() => setSelectorAbierto(false)} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Ionicons name="close" size={24} color={colors.asphalt} />
            </Pressable>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar barrio…"
            placeholderTextColor={colors.concrete}
            value={busqueda}
            onChangeText={setBusqueda}
            autoCapitalize="words"
          />
          <FlatList
            data={barriosFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.modalRow, pressed && styles.pressed]}
                onPress={() => seleccionarBarrio(item)}
                accessibilityRole="button"
                accessibilityLabel={`Elegir ${item.nombre}`}
              >
                <Text style={styles.modalRowText}>{item.nombre}</Text>
                <Text style={styles.modalRowComuna}>Comuna {item.comuna}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.chalk,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.asphalt,
  },
  pressed: {
    opacity: 0.7,
  },
  barrioSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.asphalt,
    padding: spacing.md,
  },
  barrioLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
    marginBottom: 2,
  },
  barrioNombre: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.asphalt,
  },
  skeletonBlock: {
    gap: spacing.md,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    padding: spacing.md,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.asphalt,
  },
  rankingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.yellow,
    padding: spacing.md,
  },
  rankingBig: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.asphalt,
  },
  rankingText: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
    marginTop: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    padding: spacing.md,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  estadoDot: {
    width: 10,
    height: 10,
  },
  estadoLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
    width: 130,
  },
  estadoBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.chalk2,
    overflow: 'hidden',
  },
  estadoBarFill: {
    height: '100%',
  },
  estadoCantidad: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
    width: 28,
    textAlign: 'right',
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
  searchInput: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.chalk2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalRowText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
  },
  modalRowComuna: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
  },
});
