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
import CategoryChip from '../../components/CategoryChip';
import PermissionNotice from '../../components/PermissionNotice';
import { categoryOrder } from '../../constants/categories';
import { severityLabels } from '../../constants/status';
import { addReport, generateCaseNumber } from '../../data/reports';
import type { Category, LocationSource, Severity } from '../../types/report';
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
export default function NewReport() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationDenied, setLocationDenied] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locatingPhoto, setLocatingPhoto] = useState(false);

  // Fetched as soon as the camera opens, so the "GPS FIJADO ±N m" chip is already
  // showing while the neighbor frames the photo (design/figma/04-nuevo-reclamo.png),
  // instead of only starting to look for a fix after the shutter is pressed.
  const [liveCoords, setLiveCoords] = useState<Coords | null>(null);
  const [locatingLive, setLocatingLive] = useState(false);

  const [category, setCategory] = useState<Category | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function resolveCurrentLocation(): Promise<Coords | null> {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setLocationDenied(true);
      return null;
    }
    setLocationDenied(false);
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
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
    const picture = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      exif: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setLocatingPhoto(true);

    const exifLat = asset.exif?.GPSLatitude;
    const exifLng = asset.exif?.GPSLongitude;
    if (typeof exifLat === 'number' && typeof exifLng === 'number') {
      // The photo already carries its own coordinates: no need for the current
      // location, and it stays truthful about where the picture was actually taken.
      setLocationSource('Exif');
      setCoords({ latitude: exifLat, longitude: exifLng, accuracy: null });
    } else {
      // No EXIF location (common: WhatsApp, some Android versions, iOS sharing).
      // Fall back to where the neighbor is standing right now, marked as such.
      setLocationSource('Manual');
      const found = await resolveCurrentLocation();
      setCoords(found);
    }
    setLocatingPhoto(false);
  }

  const canSubmit = Boolean(photoUri && coords && category && severity && !submitting);

  async function handleSubmit() {
    if (!canSubmit || !photoUri || !coords || !category || !severity) return;
    setSubmitting(true);
    const caseNumber = generateCaseNumber();
    const now = new Date().toISOString();
    addReport({
      id: caseNumber,
      caseNumber,
      category,
      severity,
      status: 'Reported',
      notes: notes.trim() || undefined,
      photoUrl: photoUri,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracyMeters: coords.accuracy ?? undefined,
      locationSource: locationSource ?? 'Manual',
      address: address ?? undefined,
      confirmations: 0,
      authorName: 'Vos',
      createdAt: now,
      history: [{ status: 'Reported', description: 'Ingresado', createdAt: now }],
    });
    router.replace({
      pathname: '/reports/published',
      params: { caseNumber, address: address ?? '', lat: String(coords.latitude), lng: String(coords.longitude) },
    });
  }

  if (!cameraPermission) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
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
          {(['Low', 'Medium', 'High'] as Severity[]).map((item) => (
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
          placeholderTextColor={colors.concrete}
          multiline
          maxLength={NOTES_MAX_LENGTH}
        />
        <Text style={styles.notesCount}>
          {notes.length}/{NOTES_MAX_LENGTH}
        </Text>
      </ScrollView>
    </View>
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
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  cancel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.concrete,
  },
  headerTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.concrete,
  },
  post: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    backgroundColor: colors.yellow,
    color: colors.asphalt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  postDisabled: {
    backgroundColor: colors.concreteLight,
    color: colors.concrete,
  },
  camera: {
    backgroundColor: colors.asphalt,
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
    borderColor: colors.yellow,
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
    backgroundColor: colors.concrete,
  },
  gpsDotOk: {
    backgroundColor: colors.green,
  },
  gpsChipText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.chalk,
  },
  hintBox: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.concreteLight,
  },
  hintRequired: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.rust,
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
    color: colors.concreteLight,
  },
  controlLabelActive: {
    color: colors.yellow,
  },
  shutterOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.chalk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.yellow,
  },
  retakeButton: {
    borderWidth: 1,
    borderColor: colors.yellow,
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
    color: colors.yellow,
  },
  geo: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.chalk2,
  },
  geoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    backgroundColor: colors.concrete,
  },
  geoDotOk: {
    backgroundColor: colors.green,
  },
  geoText: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
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
    color: colors.concrete,
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
    borderColor: colors.asphalt,
  },
  severitySelected: {
    backgroundColor: colors.yellow,
  },
  severityHigh: {
    backgroundColor: colors.rust,
    borderColor: colors.rust,
  },
  severityText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
  },
  severityTextOnDark: {
    color: colors.chalk,
  },
  textarea: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    padding: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.asphalt,
    height: 72,
    textAlignVertical: 'top',
  },
  notesCount: {
    alignSelf: 'flex-end',
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.concrete,
    marginTop: spacing.xs,
  },
});
