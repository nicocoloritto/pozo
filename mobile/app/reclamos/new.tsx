import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryChip from '../../components/CategoryChip';
import PermissionNotice from '../../components/PermissionNotice';
import SheetModal from '../../components/SheetModal';
import StatusStamp from '../../components/StatusStamp';
import { categoryLabels, categoryOrder } from '../../constants/categories';
import { severityLabels } from '../../constants/status';
import { useAuth } from '../../contexts/AuthContext';
import { encontrarReclamoCercano } from '../../lib/distancia';
import { coordenadasDesdeExif } from '../../lib/exif';
import { fotoSource } from '../../lib/fotoReclamo';
import { obtenerBarrioPorCoordenadas } from '../../services/estadisticas';
import { borrarFotoPermanente, guardarFotoPermanente } from '../../services/fotos';
import { confirmarReclamo, obtenerReclamos, publicarReclamo, ReclamoError } from '../../services/reclamos';
import type { Categoria, OrigenUbicacion, Reclamo, Severidad } from '../../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../../theme';

type Coords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

const NOTES_MAX_LENGTH = 280;

// Screen 04 of the mockup (design/figma/04-nuevo-reclamo.png), plus the permission
// handling of 04b. See docs/diseno-funcional.md for the "foto + coordenadas = evidencia"
// rule and the locationSource field this screen fills in.
export default function NewReclamo() {
  const router = useRouter();
  const { user } = useAuth();
  const cameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationDenied, setLocationDenied] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<OrigenUbicacion | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locatingPhoto, setLocatingPhoto] = useState(false);

  // Fetched as soon as the camera opens, so the "GPS FIJADO ±N m" chip is already
  // showing while the neighbor frames the photo (design/pozo-pantallas-hifi.html),
  // instead of only starting to look for a fix after the shutter is pressed.
  const [liveCoords, setLiveCoords] = useState<Coords | null>(null);
  const [locatingLive, setLocatingLive] = useState(false);

  const [category, setCategory] = useState<Categoria | null>(null);
  const [severity, setSeverity] = useState<Severidad | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Reclamo abierto de la misma categoría a menos de 50 m: se avisa antes de publicar.
  const [cercano, setCercano] = useState<Reclamo | null>(null);
  const [confirmandoCercano, setConfirmandoCercano] = useState(false);
  const [errorCercano, setErrorCercano] = useState<string | null>(null);
  // Mensaje de error de la acción en curso (foto, ubicación o guardado). Nunca borra lo que
  // la persona ya cargó: foto, categoría, severidad y notas quedan como estaban.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function resolveCurrentLocation(): Promise<Coords | null> {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setLocationDenied(true);
      return null;
    }
    setLocationDenied(false);
    let position: Location.LocationObject;
    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch {
      setErrorMsg('No pudimos obtener tu ubicación. Revisá que el GPS esté activado y reintentá.');
      return null;
    }
    const found: Coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
    try {
      const [place] = await Location.reverseGeocodeAsync(found);
      if (place) {
        const street = [place.street, place.streetNumber].filter(Boolean).join(' ');
        setAddress([street, place.district || place.city].filter(Boolean).join(', '));
      }
    } catch {
      // Reverse geocoding is best-effort: an offline device or missing service
      // still lets the report be created with raw coordinates only.
      setAddress(null);
    }
    return found;
  }

  // Pre-fetch the GPS fix as soon as the camera is usable, so the chip in the
  // viewfinder can already say "GPS FIJADO" instead of only searching after the shot.
  useEffect(() => {
    if (!cameraPermission?.granted || photoUri) return;
    let cancelled = false;
    setLocatingLive(true);
    resolveCurrentLocation().then((found) => {
      if (!cancelled) {
        setLiveCoords(found);
        setLocatingLive(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraPermission?.granted]);

  function handleRetakePhoto() {
    setPhotoUri(null);
    setCoords(null);
    setLocationSource(null);
    setAddress(null);
    // Refresh the GPS fix too: time passed since the first shot, so the old one
    // could be stale by the time the new photo is taken.
    setLocatingLive(true);
    resolveCurrentLocation().then((found) => {
      setLiveCoords(found);
      setLocatingLive(false);
    });
  }

  async function handleTakePhoto() {
    setErrorMsg(null);
    let picture: Awaited<ReturnType<CameraView['takePictureAsync']>> | undefined;
    try {
      picture = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    } catch {
      setErrorMsg('No pudimos sacar la foto. Probá de nuevo.');
      return;
    }
    if (!picture) return;
    setPhotoUri(picture.uri);
    setLocationSource('Device');

    if (liveCoords) {
      // Already resolved while framing the shot: use it as-is, no need to wait again.
      setCoords(liveCoords);
      return;
    }
    setLocatingPhoto(true);
    const found = await resolveCurrentLocation();
    setCoords(found);
    setLocatingPhoto(false);
  }

  async function handlePickFromGallery() {
    setErrorMsg(null);
    let result: ImagePicker.ImagePickerResult;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMsg('Sin permiso para ver tus fotos. Podés activarlo desde los ajustes del teléfono.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        exif: true,
        quality: 0.7,
      });
    } catch {
      setErrorMsg('No pudimos abrir la galería. Probá de nuevo.');
      return;
    }
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setLocatingPhoto(true);

    // El EXIF guarda latitud/longitud sin signo más una letra N/S y E/W: coordenadasDesdeExif
    // aplica el hemisferio (en CABA, Sur y Oeste) y descarta valores imposibles.
    const exifCoords = coordenadasDesdeExif(asset.exif);
    if (exifCoords) {
      // The photo already carries its own coordinates: no need for the current
      // location, and it stays truthful about where the picture was actually taken.
      setLocationSource('Exif');
      setCoords({ ...exifCoords, accuracy: null });
    } else {
      // No EXIF location (common: WhatsApp, some Android versions, iOS sharing).
      // Fall back to where the neighbor is standing right now, marked as such.
      setLocationSource('Manual');
      const found = await resolveCurrentLocation();
      setCoords(found);
    }
    setLocatingPhoto(false);
  }

  const canSubmit = Boolean(
    photoUri && coords && category && severity && user?.rol === 'vecino' && !submitting
  );

  // Antes de publicar se busca un reclamo parecido cerca. Si hay, se muestra la tarjeta
  // de aviso y la publicación espera a que la persona elija; si no, se publica directo.
  async function handleSubmit() {
    if (!canSubmit || !coords || !category) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const hallado = encontrarReclamoCercano(await obtenerReclamos(), {
        category,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (hallado) {
        setErrorCercano(null);
        setCercano(hallado.reclamo);
        setSubmitting(false);
        return;
      }
    } catch {
      // Si no se puede revisar si hay uno cerca, no se bloquea la publicación.
    }
    await publicar();
  }

  async function handleConfirmarCercano() {
    if (!cercano || !user) return;
    setConfirmandoCercano(true);
    setErrorCercano(null);
    try {
      await confirmarReclamo(cercano.id, user.id);
      router.replace(`/reclamos/${cercano.id}`);
    } catch (err) {
      if (err instanceof ReclamoError && err.code === 'ALREADY_CONFIRMED') {
        // Ya lo había confirmado: lo llevamos igual a su Detalle.
        router.replace(`/reclamos/${cercano.id}`);
      } else {
        setErrorCercano(err instanceof ReclamoError ? err.message : 'No pudimos confirmar el reclamo. Probá de nuevo.');
      }
    } finally {
      setConfirmandoCercano(false);
    }
  }

  async function handlePublicarIgual() {
    setCercano(null);
    setSubmitting(true);
    await publicar();
  }

  // Pasos: copiar la foto a la carpeta permanente → resolver el barrio → guardar el reclamo
  // (autor = usuario de la sesión, estado Reportado y primer cambio del historial los pone
  // services/reclamos.ts). Si algo falla se muestra el motivo y se queda en esta pantalla
  // con todo lo cargado, para poder reintentar.
  async function publicar() {
    if (!photoUri || !coords || !category || !severity || !user || user.rol !== 'vecino') {
      setSubmitting(false);
      return;
    }
    setErrorMsg(null);

    let fotoGuardada: string;
    try {
      fotoGuardada = await guardarFotoPermanente(photoUri);
    } catch (err) {
      console.warn('[nuevo-reclamo] No se pudo copiar la foto', err);
      setErrorMsg('No pudimos guardar la foto en el teléfono. Revisá que tengas espacio y probá de nuevo.');
      setSubmitting(false);
      return;
    }

    try {
      // El barrio (y por lo tanto el municipio) se resuelven a partir de las
      // coordenadas reales del reclamo, no del barrio del perfil del vecino: puede
      // estar reportando un problema en un barrio distinto al suyo.
      const barrio = await obtenerBarrioPorCoordenadas(coords.latitude, coords.longitude);
      const reclamo = await publicarReclamo({
        autorId: user.id,
        municipioId: barrio?.municipioId ?? 'caba',
        category,
        severity,
        notes: notes.trim() || undefined,
        photoUrl: fotoGuardada,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: coords.accuracy ?? undefined,
        locationSource: locationSource ?? 'Manual',
        address: address ?? undefined,
        neighborhood: barrio?.nombre ?? user.neighborhood,
        comuna: barrio?.comuna,
      });
      router.replace({
        pathname: '/reclamos/published',
        params: {
          caseNumber: reclamo.caseNumber,
          address: address ?? '',
          lat: String(coords.latitude),
          lng: String(coords.longitude),
        },
      });
    } catch (err) {
      console.warn('[nuevo-reclamo] No se pudo publicar', err);
      // La copia ya no sirve: se borra para no dejar fotos huérfanas.
      borrarFotoPermanente(fotoGuardada);
      // Una validación del servicio dice exactamente qué falta; cualquier otro error es
      // genérico (storage lleno, etc.).
      setErrorMsg(
        err instanceof ReclamoError && err.code === 'INVALID_INPUT'
          ? err.message
          : 'No pudimos guardar el reclamo. Tus datos siguen acá: probá publicar de nuevo.'
      );
      setSubmitting(false);
    }
  }

  if (!cameraPermission) {
    return <SafeAreaView style={styles.container} edges={['top', 'bottom']} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancelar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Nuevo reclamo</Text>
        <Pressable disabled={!canSubmit} onPress={handleSubmit}>
          <Text style={[styles.post, !canSubmit && styles.postDisabled]}>
            {submitting ? 'Publicando…' : 'Publicar'}
          </Text>
        </Pressable>
      </View>

      {!cameraPermission.granted ? (
        <PermissionNotice
          title="Sin acceso a la cámara"
          message="La foto es obligatoria para reportar un reclamo: sin cámara no vas a poder generar el expediente. Podés elegir una foto de la galería mientras tanto."
          onRetry={requestCameraPermission}
        />
      ) : (
        <View style={styles.camera}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <CameraView ref={cameraRef} style={styles.preview} facing="back" enableTorch={torchOn}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              <View style={styles.gpsChip}>
                <View style={[styles.gpsDot, liveCoords && styles.gpsDotOk]} />
                <Text style={styles.gpsChipText}>
                  {locatingLive
                    ? 'Buscando GPS…'
                    : liveCoords
                      ? `GPS fijado ${liveCoords.accuracy ? `±${Math.round(liveCoords.accuracy)} m` : ''}`
                      : 'Sin ubicación'}
                </Text>
              </View>

              <View style={styles.hintBox}>
                <Text style={styles.hint}>ENCUADRÁ EL PROBLEMA</Text>
                <Text style={styles.hintRequired}>LA FOTO ES OBLIGATORIA</Text>
              </View>
            </CameraView>
          )}

          <View style={styles.controls}>
            <Pressable onPress={handlePickFromGallery}>
              <Text style={styles.controlLabel}>Galería</Text>
            </Pressable>
            {photoUri ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Repetir foto"
                onPress={handleRetakePhoto}
                style={({ pressed }) => [styles.retakeButton, pressed && styles.pressed]}
              >
                <Text style={styles.retakeText}>Repetir foto</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sacar foto"
                onPress={handleTakePhoto}
                style={styles.shutterOuter}
              >
                <View style={styles.shutterInner} />
              </Pressable>
            )}
            <Pressable onPress={() => setTorchOn((prev) => !prev)}>
              <Text style={[styles.controlLabel, torchOn && styles.controlLabelActive]}>Flash</Text>
            </Pressable>
          </View>
        </View>
      )}

      {locationDenied && (
        <PermissionNotice
          title="Sin acceso a la ubicación"
          message="Sin coordenadas no se puede generar el expediente: el reclamo necesita saber dónde está el problema. Podés reintentar cuando actives el permiso."
          onRetry={() => photoUri && resolveCurrentLocation().then(setCoords)}
        />
      )}

      {photoUri && !locationDenied && (
        <View style={styles.geo}>
          <View style={[styles.geoDot, coords && styles.geoDotOk]} />
          <Text style={styles.geoText}>
            {locatingPhoto
              ? 'Detectando ubicación…'
              : coords
                ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}${
                    coords.accuracy ? ` · ±${Math.round(coords.accuracy)} m` : ''
                  }${address ? `\n${address}` : ''}${
                    locationSource === 'Exif'
                      ? ' · de la foto'
                      : locationSource === 'Manual'
                        ? ' · ubicación actual (sin GPS en la foto)'
                        : ''
                  }`
                : 'Ubicación no disponible'}
          </Text>
        </View>
      )}

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          {photoUri && !coords && !locatingPhoto && !locationDenied && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reintentar ubicación"
              onPress={async () => {
                setErrorMsg(null);
                setLocatingPhoto(true);
                setCoords(await resolveCurrentLocation());
                setLocatingPhoto(false);
              }}
            >
              <Text style={styles.errorRetry}>Reintentar ubicación</Text>
            </Pressable>
          )}
        </View>
      )}

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        <Text style={styles.lbl}>2 · Categoría</Text>
        <View style={styles.categoryGrid}>
          {categoryOrder.map((item) => (
            <CategoryChip
              key={item}
              category={item}
              selected={category === item}
              onPress={() => setCategory(item)}
            />
          ))}
        </View>

        <Text style={styles.lbl}>
          3 · Severidad{severity ? ` — ${severityLabels[severity].toUpperCase()}` : ''}
        </Text>
        <View style={styles.severityRow}>
          {(['Low', 'Medium', 'High'] as Severidad[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setSeverity(item)}
              style={[
                styles.severityButton,
                severity === item && item === 'High' && styles.severityHigh,
                severity === item && item !== 'High' && styles.severitySelected,
              ]}
            >
              <Text
                style={[
                  styles.severityText,
                  severity === item && item === 'High' && styles.severityTextOnDark,
                ]}
              >
                {severityLabels[item].toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.lbl}>Notas (opcional)</Text>
        <TextInput
          style={styles.textarea}
          value={notes}
          onChangeText={(text) => setNotes(text.slice(0, NOTES_MAX_LENGTH))}
          placeholder="Contanos algo más del problema…"
          placeholderTextColor={colors.inkSoft}
          multiline
          maxLength={NOTES_MAX_LENGTH}
        />
        <Text style={styles.notesCount}>
          {notes.length}/{NOTES_MAX_LENGTH}
        </Text>
      </ScrollView>

      <SheetModal
        visible={cercano !== null}
        onClose={() => setCercano(null)}
        title="Ya hay un reclamo parecido acá cerca"
        fill={false}
      >
        {cercano && (
          <View style={styles.nearbyBody}>
            <View style={styles.nearbyCard}>
              <Image source={fotoSource(cercano)} style={styles.nearbyPhoto} resizeMode="cover" />
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyTitle}>{categoryLabels[cercano.category]}</Text>
                <Text style={styles.nearbyAddress} numberOfLines={2}>
                  {cercano.address ?? 'Ubicación sin resolver'}
                </Text>
                <StatusStamp status={cercano.status} />
              </View>
            </View>

            {cercano.autorId === user?.id ? (
              <Text style={styles.nearbyText}>Ya reportaste este problema vos. No hace falta que lo cargues de nuevo.</Text>
            ) : (
              <Text style={styles.nearbyText}>
                Si es el mismo problema, confirmalo: con más confirmaciones el municipio lo atiende antes.
              </Text>
            )}
            {errorCercano && <Text style={styles.nearbyError}>{errorCercano}</Text>}

            {cercano.autorId === user?.id ? (
              <Pressable
                style={({ pressed }) => [styles.nearbyPrimary, pressed && styles.pressed]}
                onPress={() => router.replace(`/reclamos/${cercano.id}`)}
                accessibilityRole="button"
                accessibilityLabel="Ver mi reclamo"
              >
                <Text style={styles.nearbyPrimaryText}>Ver mi reclamo</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.nearbyPrimary, pressed && styles.pressed]}
                onPress={handleConfirmarCercano}
                disabled={confirmandoCercano}
                accessibilityRole="button"
                accessibilityLabel="Confirmar ese reclamo"
              >
                <Text style={styles.nearbyPrimaryText}>{confirmandoCercano ? 'Confirmando…' : 'Confirmar ese'}</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.nearbySecondary, pressed && styles.pressed]}
              onPress={handlePublicarIgual}
              disabled={confirmandoCercano}
              accessibilityRole="button"
              accessibilityLabel="Es otro problema, publicar igual"
            >
              <Text style={styles.nearbySecondaryText}>Es otro problema, publicar igual</Text>
            </Pressable>
          </View>
        )}
      </SheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: colors.surfaceAlt,
    borderLeftWidth: 3,
    borderLeftColor: colors.coral,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.coral,
  },
  errorRetry: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  nearbyBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  nearbyCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
  },
  nearbyPhoto: {
    width: 84,
    height: 84,
    backgroundColor: colors.inkMuted,
  },
  nearbyInfo: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  nearbyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  nearbyAddress: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
  },
  nearbyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  nearbyError: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.coral,
  },
  nearbyPrimary: {
    backgroundColor: colors.mango,
    padding: spacing.md,
    alignItems: 'center',
  },
  nearbyPrimaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  nearbySecondary: {
    borderWidth: 1,
    borderColor: colors.ink,
    padding: spacing.md,
    alignItems: 'center',
  },
  nearbySecondaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  cancel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  headerTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
  },
  post: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    backgroundColor: colors.mango,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  postDisabled: {
    backgroundColor: colors.inkMuted,
    color: colors.inkSoft,
  },
  camera: {
    backgroundColor: colors.ink,
  },
  preview: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.mango,
  },
  cornerTopLeft: {
    top: 14,
    left: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 14,
    right: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  gpsChip: {
    position: 'absolute',
    top: 14,
    left: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.inkSoft,
  },
  gpsDotOk: {
    backgroundColor: colors.mint,
  },
  gpsChipText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.bg,
  },
  hintBox: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  hintRequired: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.coral,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: spacing.lg,
  },
  controlLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  controlLabelActive: {
    color: colors.mango,
  },
  shutterOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mango,
  },
  retakeButton: {
    borderWidth: 1,
    borderColor: colors.mango,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  retakeText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.mango,
  },
  geo: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceAlt,
  },
  geoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    backgroundColor: colors.inkSoft,
  },
  geoDotOk: {
    backgroundColor: colors.mint,
  },
  geoText: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.ink,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
  },
  lbl: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  severityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  severityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  severitySelected: {
    backgroundColor: colors.mango,
  },
  severityHigh: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  severityText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    color: colors.ink,
  },
  severityTextOnDark: {
    color: colors.bg,
  },
  textarea: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    padding: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
    height: 72,
    textAlignVertical: 'top',
  },
  notesCount: {
    alignSelf: 'flex-end',
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
    marginTop: spacing.xs,
  },
});
