import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import MiniMapaReclamo from '../../components/MiniMapaReclamo';
import VerificacionReclamo from '../../components/VerificacionReclamo';
import RubberStamp from '../../components/RubberStamp';
import Skeleton from '../../components/Skeleton';
import { categoryLabels } from '../../constants/categories';
import { fotoResolucionSource, fotoSource } from '../../lib/fotoReclamo';
import { resumenVerificacion } from '../../lib/verificacion';
import { severityLabels, statusColors, statusLabels } from '../../constants/status';
import { useAuth } from '../../contexts/AuthContext';
import {
  obtenerReclamoPorId,
  ESTADOS_TIMELINE_VECINO,
  ReclamoError,
  votarReclamo,
} from '../../services/reclamos';
import { areaPorId } from '../../services/areas';
import type { EstadoReclamo, Reclamo, TipoVoto } from '../../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../../theme';

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReclamoDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [reclamo, setReclamo] = useState<Reclamo | null | undefined>(undefined);
  const [votando, setVotando] = useState(false);
  const [votoError, setVotoError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const data = await obtenerReclamoPorId(id);
    setReclamo(data ?? null);
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (reclamo === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <Skeleton height={190} />
          <Skeleton width="70%" height={28} />
          <Skeleton width="50%" height={16} />
          <Skeleton height={120} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!reclamo) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <EmptyState icon="alert-circle-outline" message="Este reclamo no existe o fue eliminado." />
      </SafeAreaView>
    );
  }

  const reclamoId = reclamo.id;
  const vecinoId = user && user.rol === 'vecino' ? user.id : null;
  const isOwnReclamo = vecinoId !== null && reclamo.autorId === vecinoId;
  const resumen = resumenVerificacion(reclamo, vecinoId);
  const reclamoAbierto = reclamo.status !== 'Resuelto' && reclamo.status !== 'Rechazado';

  async function handleVotar(voto: TipoVoto) {
    if (!vecinoId || votando) return;
    setVotando(true);
    setVotoError(null);
    try {
      const actualizado = await votarReclamo(reclamoId, vecinoId, voto);
      setReclamo({ ...actualizado });
    } catch (err) {
      setVotoError(err instanceof ReclamoError ? err.message : 'No se pudo registrar tu voto. Probá de nuevo.');
    } finally {
      setVotando(false);
    }
  }

  const fechaPorEstado = new Map(reclamo.history.map((entry) => [entry.status, entry.createdAt]));
  const fueRechazado = reclamo.status === 'Rechazado';
  // Si lo rechazaron, el timeline lineal de 5 pasos se congela en el último estado
  // real que tuvo antes del rechazo (Rechazado puede llegar desde cualquiera, no es
  // "el paso después de En reparación").
  const ultimoEstadoTimeline: EstadoReclamo = fueRechazado
    ? ([...reclamo.history].reverse().find((entry) => ESTADOS_TIMELINE_VECINO.includes(entry.status))
        ?.status ?? 'Reportado')
    : reclamo.status;
  const indiceActual = ESTADOS_TIMELINE_VECINO.indexOf(ultimoEstadoTimeline);
  const area = areaPorId(reclamo.areaAsignada);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Text style={styles.navText}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.navText}>Reclamo · {reclamo.caseNumber}</Text>
      </View>

      <View style={styles.photoWrap}>
        <Image source={fotoSource(reclamo)} style={styles.photo} resizeMode="cover" />
        <Text style={styles.tagline}>Foto del vecino · {formatDateTime(reclamo.createdAt)}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.category}>
          ● {categoryLabels[reclamo.category]} · Severidad {severityLabels[reclamo.severity].toLowerCase()}
        </Text>
        <Text style={styles.title}>{categoryLabels[reclamo.category]}</Text>
        <Text style={styles.address}>{reclamo.address ?? 'Dirección sin resolver'}</Text>

        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Sigue ahí</Text>
            <Text style={styles.statValue}>{resumen.sigue}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Ya no está</Text>
            <Text style={styles.statValue}>{resumen.yaNoEsta}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Días abierto</Text>
            <Text style={styles.statValue}>{daysSince(reclamo.createdAt)}</Text>
          </View>
        </View>

        <MiniMapaReclamo
          reclamo={reclamo}
          style={styles.miniMapWrap}
          onPress={() => router.dismissTo({ pathname: '/map', params: { reclamoId: reclamo.id } })}
        />

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Coordenadas</Text>
            <Text style={styles.metaValue}>
              {reclamo.latitude.toFixed(5)}, {reclamo.longitude.toFixed(5)}
              {reclamo.accuracyMeters ? ` · ±${Math.round(reclamo.accuracyMeters)} m` : ''}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Barrio</Text>
            <Text style={styles.metaValue}>{reclamo.neighborhood ?? 'Sin resolver'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>N° expediente</Text>
            <Text style={styles.metaValue}>{reclamo.caseNumber}</Text>
          </View>
          {area && (
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Área asignada</Text>
              <Text style={styles.metaValue}>{area.nombre}</Text>
            </View>
          )}
          {reclamo.fechaEstimada && (
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Fecha estimada</Text>
              <Text style={styles.metaValue}>
                {new Date(reclamo.fechaEstimada).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {fueRechazado && reclamo.motivoRechazo && (
          <View style={styles.rechazadoBox}>
            <Text style={styles.rechazadoTitulo}>Este reclamo fue rechazado</Text>
            <Text style={styles.rechazadoTexto}>{reclamo.motivoRechazo}</Text>
          </View>
        )}

        {reclamo.status === 'Resuelto' && fotoResolucionSource(reclamo) && (
          <>
            <Text style={styles.sectionTitle}>Antes / Después</Text>
            <View style={styles.beforeAfterRow}>
              <View style={styles.beforeAfterItem}>
                <Image source={fotoSource(reclamo)} style={styles.beforeAfterPhoto} resizeMode="cover" />
                <Text style={styles.beforeAfterLabel}>Antes</Text>
              </View>
              <View style={styles.beforeAfterItem}>
                <Image source={fotoResolucionSource(reclamo) ?? undefined} style={styles.beforeAfterPhoto} resizeMode="cover" />
                <Text style={styles.beforeAfterLabel}>Después</Text>
              </View>
            </View>
          </>
        )}

        {reclamo.notas && reclamo.notas.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Novedades del municipio</Text>
            <View style={styles.notasBox}>
              {reclamo.notas.map((nota, index) => (
                <View key={index} style={styles.notaRow}>
                  <Text style={styles.notaFecha}>{formatDateTime(nota.fecha)}</Text>
                  <Text style={styles.notaTexto}>{nota.texto}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {reclamoAbierto && (
          <VerificacionReclamo
            reclamo={reclamo}
            resumen={resumen}
            esAutor={isOwnReclamo}
            puedeVotar={vecinoId !== null}
            votando={votando}
            error={votoError}
            onVotar={handleVotar}
          />
        )}

        <View style={styles.stampRow}>
          <RubberStamp
            size={110}
            color={
              reclamo.status === 'Resuelto'
                ? colors.mint
                : fueRechazado
                  ? colors.ink
                  : colors.mango
            }
            curvedText="RECLAMO · VECINAL ·"
            centerLines={[statusLabels[reclamo.status].toUpperCase(), formatDateTime(reclamo.createdAt).split(',')[0]]}
          />
        </View>

        <Text style={styles.sectionTitle}>Línea de tiempo</Text>
        <View style={styles.timeline}>
          {ESTADOS_TIMELINE_VECINO.map((estado, index) => {
            const fecha = fechaPorEstado.get(estado);
            // Si fue rechazado, ningún paso de acá en más se marca como "actual":
            // el estado real pasa a mostrarse en la fila de Rechazado, abajo.
            const esActual = !fueRechazado && index === indiceActual;
            const yaPaso = index <= indiceActual;
            return (
              <View key={estado} style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: yaPaso ? statusColors[estado] : colors.inkMuted },
                    esActual && styles.timelineDotActual,
                  ]}
                />
                <View style={styles.timelineTextWrap}>
                  <Text style={[styles.timelineLabel, !yaPaso && styles.timelineLabelFuturo, esActual && styles.timelineLabelActual]}>
                    {statusLabels[estado]}
                  </Text>
                  {fecha && <Text style={styles.timelineFecha}>{formatDateTime(fecha)}</Text>}
                </View>
              </View>
            );
          })}
          {fueRechazado && (
            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, styles.timelineDotActual, { backgroundColor: statusColors.Rechazado }]} />
              <View style={styles.timelineTextWrap}>
                <Text style={[styles.timelineLabel, styles.timelineLabelActual]}>{statusLabels.Rechazado}</Text>
                {fechaPorEstado.get('Rechazado') && (
                  <Text style={styles.timelineFecha}>{formatDateTime(fechaPorEstado.get('Rechazado')!)}</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  navText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  photoWrap: {
    height: 190,
    backgroundColor: colors.inkRaised,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    color: colors.bg,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
  },
  body: {
    padding: spacing.lg,
  },
  category: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.coral,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.ink,
    marginBottom: 4,
  },
  address: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    marginBottom: spacing.lg,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    padding: spacing.sm,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.ink,
  },
  miniMapWrap: {
    marginBottom: spacing.lg,
  },
  metaBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inkSoft,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  metaKey: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  metaValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.ink,
  },
  rechazadoBox: {
    backgroundColor: colors.ink,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.lg,
  },
  rechazadoTitulo: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.bg,
  },
  rechazadoTexto: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  beforeAfterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  beforeAfterItem: {
    flex: 1,
    gap: 4,
  },
  beforeAfterPhoto: {
    width: '100%',
    height: 120,
    backgroundColor: colors.inkRaised,
  },
  beforeAfterLabel: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: colors.inkSoft,
  },
  notasBox: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  notaRow: {
    borderLeftWidth: 2,
    borderLeftColor: colors.mango,
    paddingLeft: spacing.sm,
    gap: 2,
  },
  notaFecha: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  notaTexto: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginBottom: spacing.sm,
  },
  timeline: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 2,
  },
  timelineDotActual: {
    borderWidth: 2,
    borderColor: colors.ink,
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  timelineLabelFuturo: {
    color: colors.inkSoft,
  },
  timelineLabelActual: {
    fontFamily: fonts.bodyBold,
  },
  timelineFecha: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
});
