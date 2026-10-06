import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import areasData from '../../data/areas.json';
import EmptyState from '../../components/EmptyState';
import MiniMapaReclamo from '../../components/MiniMapaReclamo';
import SheetModal from '../../components/SheetModal';
import Skeleton from '../../components/Skeleton';
import StatusStamp from '../../components/StatusStamp';
import { categoryLabels } from '../../constants/categories';
import { fotoResolucionSource, fotoSource } from '../../lib/fotoReclamo';
import { severityLabels } from '../../constants/status';
import { useAuth } from '../../contexts/AuthContext';
import {
  agregarNota,
  asignarArea,
  definirFechaEstimada,
  obtenerReclamoPorId,
  pasarAReparacion,
  rechazar,
  resolver,
  tomar,
  ReclamoError,
} from '../../services/reclamos';
import type { Area } from '../../types/area';
import { CATEGORIAS_PELIGROSAS } from '../../types/reclamo';
import type { Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../../theme';

const areas = areasData as Area[];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// "DD/MM/AAAA" -> Date a medianoche, o null si no matchea / no es una fecha real.
function parseFechaInput(texto: string): Date | null {
  const match = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const fecha = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (fecha.getDate() !== Number(dd) || fecha.getMonth() !== Number(mm) - 1) return null;
  return fecha;
}

function formatFechaInput(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${fecha.getFullYear()}`;
}

export default function AdminReclamoDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [reclamo, setReclamo] = useState<Reclamo | null | undefined>(undefined);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [fechaModalVisible, setFechaModalVisible] = useState(false);
  const [fechaInput, setFechaInput] = useState('');
  const [rechazoModalVisible, setRechazoModalVisible] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [notaTexto, setNotaTexto] = useState('');

  const adminId = user && user.rol === 'admin' ? user.id : null;

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
          <Skeleton height={120} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!reclamo || !adminId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <EmptyState icon="alert-circle-outline" message="Este reclamo no existe o fue eliminado." />
      </SafeAreaView>
    );
  }

  // TS no retiene el narrowing de `reclamo`/`adminId` dentro de los closures
  // (funciones) definidos más abajo: estas copias quedan tipadas sin `null` desde el
  // vamos, así que no hace falta repetir el chequeo en cada handler.
  const reclamoId = reclamo.id;
  const reclamoActual = reclamo;
  const adminIdSeguro = adminId;
  const area = areas.find((a) => a.id === reclamo.areaAsignada);
  const esFinal = reclamo.status === 'Resuelto' || reclamo.status === 'Rechazado';
  const puedeTomar =
    reclamo.status === 'ConfirmadoPorVecinos' ||
    (reclamo.status === 'Reportado' && CATEGORIAS_PELIGROSAS.includes(reclamo.category));
  const puedePasarAReparacion = reclamo.status === 'EnviadoAlMunicipio';
  const puedeResolver = reclamo.status === 'EnReparacion';

  async function ejecutar<T>(accion: () => Promise<T>, onOk?: (resultado: T) => void) {
    setProcesando(true);
    setError(null);
    try {
      const resultado = await accion();
      if (onOk) onOk(resultado);
      await cargar();
    } catch (err) {
      setError(err instanceof ReclamoError ? err.message : 'No se pudo completar la acción. Probá de nuevo.');
    } finally {
      setProcesando(false);
    }
  }

  function handleTomar() {
    ejecutar(() => tomar(reclamoId, adminIdSeguro));
  }

  function handleAsignarArea(areaId: string) {
    ejecutar(() => asignarArea(reclamoId, areaId), () => setAreaModalVisible(false));
  }

  function handlePasarAReparacion() {
    ejecutar(() => pasarAReparacion(reclamoId, adminIdSeguro));
  }

  function abrirModalFecha() {
    setFechaInput(reclamoActual.fechaEstimada ? formatFechaInput(new Date(reclamoActual.fechaEstimada)) : '');
    setFechaModalVisible(true);
  }

  function handleFechaRapida(dias: number) {
    setFechaInput(formatFechaInput(new Date(Date.now() + dias * 86400000)));
  }

  function handleGuardarFecha() {
    const fecha = parseFechaInput(fechaInput);
    if (!fecha) {
      setError('La fecha tiene que tener el formato DD/MM/AAAA');
      return;
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fecha < hoy) {
      setError('La fecha estimada no puede ser una fecha pasada');
      return;
    }
    ejecutar(() => definirFechaEstimada(reclamoId, fecha.toISOString()), () => setFechaModalVisible(false));
  }

  async function capturarFotoResolucion(origen: 'camera' | 'library') {
    let result: ImagePicker.ImagePickerResult;
    if (origen === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Necesitamos permiso de cámara para la foto del "después"');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    }
    if (result.canceled || !result.assets[0]) return;

    const foto = result.assets[0].uri;
    Alert.alert('Resolver reclamo', '¿Confirmás que el problema está resuelto con esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Resolver', onPress: () => ejecutar(() => resolver(reclamoId, adminIdSeguro, foto)) },
    ]);
  }

  function handleResolverPress() {
    Alert.alert('Foto del "después"', '¿Cómo querés agregarla?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sacar foto', onPress: () => capturarFotoResolucion('camera') },
      { text: 'Elegir de galería', onPress: () => capturarFotoResolucion('library') },
    ]);
  }

  function handleRechazarConfirmado() {
    if (!motivoRechazo.trim()) {
      setError('El motivo de rechazo es obligatorio');
      return;
    }
    Alert.alert('Rechazar reclamo', '¿Confirmás que querés rechazarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        style: 'destructive',
        onPress: () =>
          ejecutar(
            () => rechazar(reclamoId, adminIdSeguro, motivoRechazo),
            () => {
              setRechazoModalVisible(false);
              setMotivoRechazo('');
            }
          ),
      },
    ]);
  }

  function handleAgregarNota() {
    if (!notaTexto.trim()) return;
    ejecutar(
      () => agregarNota(reclamoId, notaTexto, adminIdSeguro),
      () => setNotaTexto('')
    );
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.navSafeArea}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
            <Text style={styles.navText}>‹ Volver</Text>
          </Pressable>
          <Text style={styles.navText}>Reclamo · {reclamo.caseNumber}</Text>
        </View>
      </SafeAreaView>

      <View style={styles.photoWrap}>
        <Image source={fotoSource(reclamo)} style={styles.photo} resizeMode="cover" />
      </View>

      <View style={styles.body}>
        <Text style={styles.category}>
          ● {categoryLabels[reclamo.category]} · Severidad {severityLabels[reclamo.severity].toLowerCase()}
        </Text>
        <Text style={styles.title}>{categoryLabels[reclamo.category]}</Text>
        <Text style={styles.address}>{reclamo.address ?? 'Dirección sin resolver'}</Text>
        <StatusStamp status={reclamo.status} />

        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Confirmaron</Text>
            <Text style={styles.statValue}>{reclamo.confirmaciones.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Barrio</Text>
            <Text style={styles.statValue}>{reclamo.neighborhood ?? '—'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Comuna</Text>
            <Text style={styles.statValue}>{reclamo.comuna ?? '—'}</Text>
          </View>
        </View>

        <MiniMapaReclamo
          reclamo={reclamo}
          style={styles.miniMapWrap}
          onPress={() => router.dismissTo({ pathname: '/mapa', params: { reclamoId: reclamo.id } })}
        />

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Área asignada</Text>
            <Text style={styles.metaValue}>{area?.nombre ?? 'Sin asignar'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Fecha estimada</Text>
            <Text style={styles.metaValue}>
              {reclamo.fechaEstimada ? formatFecha(reclamo.fechaEstimada) : 'Sin definir'}
            </Text>
          </View>
        </View>

        {reclamo.status === 'Rechazado' && reclamo.motivoRechazo && (
          <View style={styles.rechazadoBox}>
            <Text style={styles.rechazadoTitulo}>Motivo del rechazo</Text>
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

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!esFinal && (
          <View style={styles.actionsBox}>
            <Text style={styles.sectionTitle}>Acciones</Text>
            <View style={styles.actionsGrid}>
              {puedeTomar && <ActionButton label="Tomar" onPress={handleTomar} disabled={procesando} />}
              <ActionButton label="Asignar área" onPress={() => setAreaModalVisible(true)} disabled={procesando} />
              <ActionButton label="Fecha estimada" onPress={abrirModalFecha} disabled={procesando} />
              {puedePasarAReparacion && (
                <ActionButton label="Pasar a reparación" onPress={handlePasarAReparacion} disabled={procesando} />
              )}
              {puedeResolver && <ActionButton label="Resolver" onPress={handleResolverPress} disabled={procesando} />}
              <ActionButton
                label="Rechazar"
                onPress={() => setRechazoModalVisible(true)}
                disabled={procesando}
                destructivo
              />
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Notas públicas</Text>
        <View style={styles.notasBox}>
          {(reclamo.notas ?? []).length === 0 ? (
            <Text style={styles.notaVacia}>Todavía no hay notas.</Text>
          ) : (
            (reclamo.notas ?? []).map((nota, index) => (
              <View key={index} style={styles.notaRow}>
                <Text style={styles.notaFecha}>{formatDateTime(nota.fecha)}</Text>
                <Text style={styles.notaTexto}>{nota.texto}</Text>
              </View>
            ))
          )}
          <View style={styles.notaForm}>
            <TextInput
              style={styles.notaInput}
              value={notaTexto}
              onChangeText={setNotaTexto}
              placeholder="Agregar una nota pública…"
              placeholderTextColor={colors.concrete}
              multiline
            />
            <Pressable
              onPress={handleAgregarNota}
              disabled={procesando || !notaTexto.trim()}
              style={({ pressed }) => [
                styles.notaButton,
                (procesando || !notaTexto.trim()) && styles.notaButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.notaButtonText}>Agregar</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Línea de tiempo</Text>
        <View style={styles.timeline}>
          {reclamo.history.map((entry, index) => (
            <View key={index} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineTextWrap}>
                <Text style={styles.timelineLabel}>{entry.description}</Text>
                <Text style={styles.timelineFecha}>{formatDateTime(entry.createdAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Asignar área */}
      <SheetModal visible={areaModalVisible} onClose={() => setAreaModalVisible(false)} title="Asignar área">
          <ScrollView contentContainerStyle={styles.modalContent}>
            {areas.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleAsignarArea(item.id)}
                style={({ pressed }) => [
                  styles.modalRow,
                  reclamo.areaAsignada === item.id && styles.modalRowActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.modalRowText}>{item.nombre}</Text>
                <Text style={styles.modalRowMeta}>{item.plazoMaximoDias} días de plazo</Text>
              </Pressable>
            ))}
          </ScrollView>
      </SheetModal>

      {/* Fecha estimada */}
      <SheetModal visible={fechaModalVisible} onClose={() => setFechaModalVisible(false)} title="Fecha estimada" fill={false}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.fechaInput}
              value={fechaInput}
              onChangeText={setFechaInput}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.concrete}
              keyboardType="number-pad"
            />
            <View style={styles.fechaRapidaRow}>
              <Pressable style={styles.fechaRapidaChip} onPress={() => handleFechaRapida(3)}>
                <Text style={styles.fechaRapidaText}>En 3 días</Text>
              </Pressable>
              <Pressable style={styles.fechaRapidaChip} onPress={() => handleFechaRapida(7)}>
                <Text style={styles.fechaRapidaText}>En 1 semana</Text>
              </Pressable>
              <Pressable style={styles.fechaRapidaChip} onPress={() => handleFechaRapida(14)}>
                <Text style={styles.fechaRapidaText}>En 2 semanas</Text>
              </Pressable>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={handleGuardarFecha}
              disabled={procesando}
            >
              <Text style={styles.primaryButtonText}>Guardar</Text>
            </Pressable>
          </View>
      </SheetModal>

      {/* Rechazar */}
      <SheetModal visible={rechazoModalVisible} onClose={() => setRechazoModalVisible(false)} title="Rechazar reclamo" fill={false}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.fechaInput}
              value={motivoRechazo}
              onChangeText={setMotivoRechazo}
              placeholder="Motivo del rechazo…"
              placeholderTextColor={colors.concrete}
              multiline
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Pressable
              style={({ pressed }) => [styles.destructiveButton, pressed && styles.pressed]}
              onPress={handleRechazarConfirmado}
              disabled={procesando}
            >
              <Text style={styles.destructiveButtonText}>Rechazar</Text>
            </Pressable>
          </View>
      </SheetModal>
    </ScrollView>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  destructivo,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructivo?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionButton,
        destructivo && styles.actionButtonDestructivo,
        disabled && styles.actionButtonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.actionButtonText, destructivo && styles.actionButtonTextDestructivo]}>{label}</Text>
    </Pressable>
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
  navSafeArea: {
    backgroundColor: colors.chalk,
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
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  category: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.rust,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.asphalt,
  },
  address: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.concrete,
    marginBottom: spacing.xs,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
  },
  miniMapWrap: {
    marginTop: spacing.sm,
  },
  metaBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.concrete,
    padding: spacing.md,
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
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
    marginTop: spacing.sm,
  },
  beforeAfterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.rust,
  },
  actionsBox: {
    gap: spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.asphalt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButtonDestructivo: {
    borderColor: colors.rust,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.asphalt,
  },
  actionButtonTextDestructivo: {
    color: colors.rust,
  },
  notasBox: {
    gap: spacing.sm,
  },
  notaVacia: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.concrete,
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
  notaForm: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  notaInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    padding: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  notaButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notaButtonDisabled: {
    backgroundColor: colors.concreteLight,
  },
  notaButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.asphalt,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    backgroundColor: colors.yellow,
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
  },
  timelineFecha: {
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
  modalClose: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
  },
  modalContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalRowActive: {
    backgroundColor: colors.chalk2,
  },
  modalRowText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
  },
  modalRowMeta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
  },
  fechaInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
  },
  fechaRapidaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  fechaRapidaChip: {
    borderWidth: 1,
    borderColor: colors.asphalt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  fechaRapidaText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
  },
  primaryButton: {
    backgroundColor: colors.yellow,
    padding: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.asphalt,
  },
  destructiveButton: {
    backgroundColor: colors.rust,
    padding: spacing.md,
    alignItems: 'center',
  },
  destructiveButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.chalk,
  },
});
