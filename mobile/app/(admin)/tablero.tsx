import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarChart from '../../components/BarChart';
import Skeleton from '../../components/Skeleton';
import { statusColors, statusLabels } from '../../constants/status';
import { useAuth } from '../../contexts/AuthContext';
import { estaVencido } from '../../lib/prioridad';
import { AREAS } from '../../services/areas';
import { obtenerEvolucionMunicipio, obtenerRanking } from '../../services/estadisticas';
import { ESTADOS_RECLAMO, obtenerReclamosPorMunicipio } from '../../services/reclamos';
import type { RankingBarrio } from '../../types/estadisticas';
import { CATEGORIAS_PELIGROSAS as PELIGROSAS } from '../../types/reclamo';
import type { EstadoReclamo, Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../../theme';

function esEstadoFinal(status: EstadoReclamo): boolean {
  return status === 'Resuelto' || status === 'Rechazado';
}

function esNuevoSinTomar(reclamo: Pick<Reclamo, 'status' | 'category'>): boolean {
  return reclamo.status === 'ConfirmadoPorVecinos' || (reclamo.status === 'Reportado' && PELIGROSAS.includes(reclamo.category));
}

function tiempoPromedioResolucionDias(reclamos: Reclamo[]): number {
  const resueltos = reclamos.filter((r) => r.status === 'Resuelto');
  if (resueltos.length === 0) return 0;

  const totalDias = resueltos.reduce((acc, r) => {
    const resueltoEn = r.history.find((h) => h.status === 'Resuelto')?.createdAt ?? r.createdAt;
    const dias = (new Date(resueltoEn).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return acc + Math.max(0, dias);
  }, 0);

  return Math.round((totalDias / resueltos.length) * 10) / 10;
}

export default function TableroScreen() {
  const { user } = useAuth();
  const [reclamos, setReclamos] = useState<Reclamo[] | null>(null);
  const [evolucion, setEvolucion] = useState<{ label: string; value: number }[]>([]);
  const [ranking, setRanking] = useState<RankingBarrio[]>([]);

  const municipioId = user && user.rol === 'admin' ? user.municipioId : null;

  useEffect(() => {
    if (!municipioId) return;
    let cancelled = false;
    (async () => {
      const [reclamosData, evolucionData, rankingData] = await Promise.all([
        obtenerReclamosPorMunicipio(municipioId),
        obtenerEvolucionMunicipio(municipioId),
        obtenerRanking(municipioId),
      ]);
      if (cancelled) return;
      setReclamos(reclamosData);
      setEvolucion(evolucionData.map((item) => ({ label: item.mes, value: item.reclamos })));
      setRanking(rankingData);
    })();
    return () => {
      cancelled = true;
    };
  }, [municipioId]);

  if (!municipioId) return null;

  if (!reclamos) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Tablero</Text>
          <Skeleton height={90} />
          <Skeleton height={160} />
          <Skeleton height={160} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // TODO: estos números (abiertos/nuevos/vencidos/% resuelto/tiempo promedio) van a
  // venir de la base de datos del municipio una vez que exista el backend; hoy se
  // calculan en el cliente a partir de lo que hay en AsyncStorage.
  const abiertos = reclamos.filter((r) => !esEstadoFinal(r.status)).length;
  const nuevosSinTomar = reclamos.filter(esNuevoSinTomar).length;
  const vencidos = reclamos.filter((r) => estaVencido(r, AREAS)).length;
  const resueltos = reclamos.filter((r) => r.status === 'Resuelto').length;
  const porcentajeResuelto = reclamos.length ? Math.round((resueltos / reclamos.length) * 1000) / 10 : 0;
  const diasPromedio = tiempoPromedioResolucionDias(reclamos);

  const porAreaData = AREAS.map((area) => ({
    label: area.nombre,
    value: reclamos.filter((r) => r.areaAsignada === area.id).length,
  }));

  const rankingTop = ranking.slice(0, 8);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Tablero</Text>

        <View style={styles.statGrid}>
          <StatCard label="Reclamos abiertos" value={String(abiertos)} />
          <StatCard label="Nuevos sin tomar" value={String(nuevosSinTomar)} />
          <StatCard label="Vencidos" value={String(vencidos)} resaltar={vencidos > 0} />
          <StatCard label="% Resuelto" value={`${porcentajeResuelto}%`} />
          <StatCard label="Días promedio" value={String(diasPromedio)} />
        </View>

        <Text style={styles.sectionTitle}>Reclamos por área</Text>
        <View style={styles.card}>
          <BarChart data={porAreaData} color={colors.yellow} />
        </View>

        <Text style={styles.sectionTitle}>Reclamos por estado</Text>
        <View style={styles.card}>
          {ESTADOS_RECLAMO.map((estado) => {
            const cantidad = reclamos.filter((r) => r.status === estado).length;
            const porcentaje = reclamos.length ? Math.round((cantidad / reclamos.length) * 100) : 0;
            return (
              <View key={estado} style={styles.estadoRow}>
                <View style={[styles.estadoDot, { backgroundColor: statusColors[estado] }]} />
                <Text style={styles.estadoLabel}>{statusLabels[estado]}</Text>
                <View style={styles.estadoBarTrack}>
                  <View style={[styles.estadoBarFill, { width: `${porcentaje}%`, backgroundColor: statusColors[estado] }]} />
                </View>
                <Text style={styles.estadoCantidad}>{cantidad}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Evolución últimos 6 meses (CABA)</Text>
        <View style={styles.card}>
          <BarChart data={evolucion} color={colors.blue} />
        </View>

        <Text style={styles.sectionTitle}>Ranking de barrios por % de resolución</Text>
        <View style={styles.card}>
          {rankingTop.map((item) => (
            <View key={item.barrioId} style={styles.rankingRow}>
              <Text style={styles.rankingPuesto}>{item.puesto}°</Text>
              <Text style={styles.rankingNombre} numberOfLines={1}>
                {item.nombre}
              </Text>
              <Text style={styles.rankingPorcentaje}>{item.porcentajeResolucion}%</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, resaltar }: { label: string; value: string; resaltar?: boolean }) {
  return (
    <View style={[styles.statCard, resaltar && styles.statCardResaltado]}>
      <Text style={[styles.statLabel, resaltar && styles.statLabelResaltado]}>{label}</Text>
      <Text style={[styles.statValue, resaltar && styles.statValueResaltado]}>{value}</Text>
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
  statCardResaltado: {
    backgroundColor: colors.rust,
    borderColor: colors.rust,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
    marginBottom: 4,
  },
  statLabelResaltado: {
    color: colors.chalk,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.asphalt,
  },
  statValueResaltado: {
    color: colors.chalk,
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
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rankingPuesto: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
    width: 32,
  },
  rankingNombre: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
  },
  rankingPorcentaje: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.sm,
    color: colors.concrete,
  },
});
