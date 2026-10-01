import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReclamoMarker from '../../components/ReclamoMarker';
import StatusStamp from '../../components/StatusStamp';
import { categoryLabels, categoryOrder } from '../../constants/categories';
import { statusLabels } from '../../constants/status';
import { ESTADOS_RECLAMO, obtenerReclamos } from '../../services/reclamos';
import type { Categoria, EstadoReclamo, Reclamo } from '../../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../../theme';

// Centro aproximado de CABA (Obelisco), usado cuando no hay permiso de ubicación.
const CABA_REGION: Region = {
  latitude: -34.6037,
  longitude: -58.3816,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [reclamos, setReclamos] = useState<Reclamo[] | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [selected, setSelected] = useState<Reclamo | null>(null);

  const [categoriaFiltro, setCategoriaFiltro] = useState<Set<Categoria>>(new Set());
  const [estadoFiltro, setEstadoFiltro] = useState<Set<EstadoReclamo>>(new Set());

  useEffect(() => {
    obtenerReclamos().then(setReclamos);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          if (!cancelled) setLocationDenied(true);
          return;
        }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) {
          setUserCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        }
      } catch {
        if (!cancelled) setLocationDenied(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const initialRegion: Region = userCoords
    ? { ...userCoords, latitudeDelta: 0.06, longitudeDelta: 0.06 }
    : CABA_REGION;

  const handleRecenter = useCallback(() => {
    if (!userCoords || !mapRef.current) return;
    mapRef.current.animateToRegion({ ...userCoords, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 400);
  }, [userCoords]);

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

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          // TODO(build de producción): Google Maps en Android necesita una API key
          // propia en app.json (android.config.googleMaps.apiKey) — ver comentario en
          // app.json. En Expo Go no hace falta (usa la key de desarrollo del propio
          // Expo Go). En iOS no se fuerza ningún provider: usa Apple Maps, que no
          // necesita key y sigue el modo claro/oscuro del sistema.
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          showsUserLocation={Boolean(userCoords)}
          onPress={() => setSelected(null)}
        >
          {reclamosFiltrados.map((reclamo) => (
            <Marker
              key={reclamo.id}
              coordinate={{ latitude: reclamo.latitude, longitude: reclamo.longitude }}
              onPress={() => setSelected(reclamo)}
              accessibilityLabel={`Reclamo: ${categoryLabels[reclamo.category]} en ${reclamo.address ?? 'ubicación sin resolver'}`}
            >
              <ReclamoMarker reclamo={reclamo} />
            </Marker>
          ))}
        </MapView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a mi ubicación"
          onPress={handleRecenter}
          style={({ pressed }) => [styles.locateButton, pressed && styles.pressed]}
        >
          <Ionicons name="locate" size={20} color={colors.asphalt} />
        </Pressable>

        {locationDenied && (
          <View style={styles.locationNotice}>
            <Text style={styles.locationNoticeText}>
              Sin tu ubicación, el mapa arranca centrado en CABA.
            </Text>
          </View>
        )}

        {reclamos === null && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Cargando reclamos…</Text>
          </View>
        )}
      </View>

      {selected && (
        <Pressable
          style={styles.selectedCard}
          onPress={() => router.push(`/reclamos/${selected.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Ver reclamo de ${categoryLabels[selected.category]}`}
        >
          <View style={styles.selectedPhotoWrap}>
            <ReclamoMarker reclamo={selected} size={44} />
          </View>
          <View style={styles.selectedBody}>
            <Text style={styles.selectedTitle} numberOfLines={1}>
              {categoryLabels[selected.category]}
            </Text>
            <Text style={styles.selectedAddress} numberOfLines={1}>
              {selected.address ?? 'Ubicación sin resolver'}
            </Text>
            <StatusStamp status={selected.status} />
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.concrete} />
        </Pressable>
      )}
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
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  locateButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chalk,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.asphalt,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pressed: {
    opacity: 0.7,
  },
  locationNotice: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(28,27,26,0.85)',
    padding: spacing.sm,
  },
  locationNoticeText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.chalk,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    backgroundColor: 'rgba(28,27,26,0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.chalk,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.chalk,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  selectedPhotoWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBody: {
    flex: 1,
    gap: 4,
  },
  selectedTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.asphalt,
  },
  selectedAddress: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.concrete,
  },
});
