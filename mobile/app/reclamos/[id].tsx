import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import areasData from '../../data/areas.json';
import EmptyState from '../../components/EmptyState';
import ReclamoMarker from '../../components/ReclamoMarker';
import RubberStamp from '../../components/RubberStamp';
import Skeleton from '../../components/Skeleton';
import { categoryLabels } from '../../constants/categories';
import { severityLabels, statusColors, statusLabels } from '../../constants/status';
import { useAuth } from '../../contexts/AuthContext';
import {
  confirmarReclamo,
  obtenerReclamoPorId,
  ESTADOS_TIMELINE_VECINO,
  ReclamoError,
} from '../../services/reclamos';
import type { Area } from '../../types/area';
import type { EstadoReclamo, Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../../theme';

const areas = areasData as Area[];

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
  const [confirmando, setConfirmando] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

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
  const yaConfirmado = vecinoId !== null && reclamo.confirmaciones.includes(vecinoId);
  const canConfirm = vecinoId !== null && !isOwnReclamo && !yaConfirmado;

  async function handleConfirm() {
    if (!vecinoId || !canConfirm) return;
    setConfirmando(true);
    setConfirmError(null);
    try {
      const actualizado = await confirmarReclamo(reclamoId, vecinoId);
      setReclamo(actualizado);
    } catch (err) {
      setConfirmError(err instanceof ReclamoError ? err.message : 'No se pudo confirmar. Probá de nuevo.');
    } finally {
      setConfirmando(false);
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
  const area = areas.find((a) => a.id === reclamo.areaAsignada);

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
        <Image source={{ uri: reclamo.photoUrl }} style={styles.photo} resizeMode="cover" />
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
            <Text style={styles.statLabel}>Confirmaron</Text>
            <Text style={styles.statValue}>{reclamo.confirmaciones.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Días abierto</Text>
            <Text style={styles.statValue}>{daysSince(reclamo.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.miniMapWrap}>
          <MapView
            style={styles.miniMap}
            pointerEvents="none"
            initialRegion={{
              latitude: reclamo.latitude,
              longitude: reclamo.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={{ latitude: reclamo.latitude, longitude: reclamo.longitude }}>
              <ReclamoMarker reclamo={reclamo} size={30} />
            </Marker>
          </MapView>
        </View>

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

        {reclamo.status === 'Resuelto' && reclamo.fotoResolucion && (
          <>
            <Text style={styles.sectionTitle}>Antes / Después</Text>
            <View style={styles.beforeAfterRow}>
              <View style={styles.beforeAfterItem}>
                <Image source={{ uri: reclamo.photoUrl }} style={styles.beforeAfterPhoto} resizeMode="cover" />
                <Text style={styles.beforeAfterLabel}>Antes</Text>
              </View>
              <View style={styles.beforeAfterItem}>
                <Image source={{ uri: reclamo.fotoResolucion }} style={styles.beforeAfterPhoto} resizeMode="cover" />
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

        <View style={styles.stampRow}>
          <RubberStamp
            size={110}
            color={
              reclamo.status === 'Resuelto'
                ? colors.green
                : fueRechazado
                  ? colors.asphalt
                  : colors.yellow
            }
            curvedText="RECLAMO · VECINAL ·"
            centerLines={[statusLabels[reclamo.status].toUpperCase(), formatDateTime(reclamo.createdAt).split(',')[0]]}
          />
          {!isOwnReclamo && (
            <View style={styles.confirmBox}>
              <Pressable
                disabled={!canConfirm || confirmando}
                onPress={handleConfirm}
                accessibilityRole="button"
                accessibilityLabel={yaConfirmado ? 'Ya confirmaste este reclamo' : 'Confirmar reclamo'}
                style={({ pressed }) => [
                  styles.confirmButton,
                  (!canConfirm || confirmando) && styles.confirmButtonDisabled,
                  pressed && canConfirm && styles.pressed,
                ]}
              >
                <Text style={styles.confirmButtonText}>
                  {yaConfirmado ? '✓ Ya confirmaste' : confirmando ? 'Confirmando…' : '+ Confirmar'}
                </Text>
              </Pressable>
              {confirmError && <Text style={styles.confirmErrorText}>{confirmError}</Text>}
            </View>
          )}
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
                    { backgroundColor: yaPaso ? statusColors[estado] : colors.concreteLight },
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
    backgroundColor: colors.chalk,
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
    color: colors.concrete,
  },
  photoWrap: {
    height: 190,
    backgroundColor: colors.asphalt2,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    color: colors.chalk,
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
    color: colors.rust,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.asphalt,
    marginBottom: 4,
  },
  address: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.concrete,
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
    color: colors.concrete,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.asphalt,
  },
  miniMapWrap: {
    height: 140,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  miniMap: {
    flex: 1,
  },
  metaBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.concrete,
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
    color: colors.concrete,
  },
  metaValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
  },
  rechazadoBox: {
    backgroundColor: colors.asphalt,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.lg,
  },
  rechazadoTitulo: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.chalk,
  },
  rechazadoTexto: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.concreteLight,
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
    backgroundColor: colors.asphalt2,
  },
  beforeAfterLabel: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: colors.concrete,
  },
  notasBox: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  notaRow: {
    borderLeftWidth: 2,
    borderLeftColor: colors.yellow,
    paddingLeft: spacing.sm,
    gap: 2,
  },
  notaFecha: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
  },
  notaTexto: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
  },
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  confirmBox: {
    flex: 1,
    gap: spacing.xs,
  },
  confirmButton: {
    backgroundColor: colors.asphalt,
    padding: spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.concreteLight,
  },
  pressed: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.chalk,
  },
  confirmErrorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.rust,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
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
    borderColor: colors.asphalt,
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
  },
  timelineLabelFuturo: {
    color: colors.concrete,
  },
  timelineLabelActual: {
    fontFamily: fonts.bodyBold,
  },
  timelineFecha: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
  },
});
