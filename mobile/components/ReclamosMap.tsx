import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import Supercluster from 'supercluster';
import { categoryLabels } from '../constants/categories';
import { estaVencido } from '../lib/prioridad';
import { AREAS } from '../services/areas';
import { CATEGORIAS_PELIGROSAS } from '../types/reclamo';
import type { Reclamo } from '../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../theme';
import ReclamoMarker from './ReclamoMarker';
import StatusStamp from './StatusStamp';

// Centro aproximado de CABA (Obelisco), usado cuando no hay permiso de ubicación.
const CABA_REGION: Region = {
  latitude: -34.6037,
  longitude: -58.3816,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

// Interruptor de diagnóstico: en false no se agrupa nada y se dibujan todos los reclamos
// como marcadores sueltos (igual que antes del clustering). Sirve para comprobar si el
// agrupado tiene algo que ver con que el mapa no se mueva.
const CLUSTERING_ACTIVO = true;

// Zoom más alto al que supercluster todavía agrupa. Si un grupo sigue junto pasado este
// zoom (mismo punto exacto, o tan cerca que el mapa no los separa), se muestra una lista.
const MAX_ZOOM = 19;
// supercluster trabaja con tiles de 512 px: lo usamos para pasar de región a zoom y volver.
const TILE_SIZE = 512;

type PuntoProps = { id: string; vencido: number; peligroso: number };

function regionAZoom(region: Region, anchoPx: number): number {
  return Math.log2((360 * anchoPx) / (TILE_SIZE * region.longitudeDelta));
}

function zoomARegion(zoom: number, anchoPx: number, altoPx: number, latitude: number, longitude: number): Region {
  const longitudeDelta = (360 * anchoPx) / (TILE_SIZE * 2 ** zoom);
  return { latitude, longitude, longitudeDelta, latitudeDelta: (longitudeDelta * altoPx) / anchoPx };
}

type Tarjeta = { tipo: 'uno'; reclamo: Reclamo } | { tipo: 'lista'; reclamos: Reclamo[] };

type Props = {
  reclamos: Reclamo[];
  loading?: boolean;
  // Mapa del municipio: marca los reclamos vencidos y los de categoría peligrosa.
  modoMunicipio?: boolean;
  // Vecino: al conseguir la ubicación por primera vez, centra el mapa ahí (una sola vez,
  // y solo si la persona todavía no movió el mapa).
  centrarEnUsuario?: boolean;
  onOpenReclamo: (reclamo: Reclamo) => void;
  // Id de un reclamo a mostrar: el mapa se centra en él con un zoom donde queda separado
  // de los demás (aunque estuviera dentro de un grupo) y abre su tarjeta. Cuando lo usa,
  // llama a onEnfocado para que la pantalla limpie el parámetro y no se repita solo.
  enfocarId?: string | null;
  onEnfocado?: () => void;
};

// Mapa compartido por el vecino (app/(tabs)/map.tsx) y el municipio (app/(admin)/mapa.tsx).
//
// Gestos: el MapView NUNCA recibe `region` (sería un mapa controlado y pelearía con los
// dedos), solo `initialRegion`. La región que informa onRegionChangeComplete se guarda en
// un estado aparte, ya "asentada" (con una pausa y solo si cambió de verdad), y sirve
// únicamente para calcular los grupos. animateToRegion se usa para el botón "mi
// ubicación", el primer centrado en el usuario, el zoom al tocar un grupo y el enfoque de
// un reclamo. Lo que flota sobre el mapa son botones y avisos chicos, cada uno posicionado
// por su cuenta: no hay ninguna View a pantalla completa encima que pueda quedarse con los
// toques. Las props de gestos no se tocan (los valores por defecto de react-native-maps
// ya permiten desplazar, hacer zoom, rotar e inclinar).
export default function ReclamosMap({
  reclamos,
  loading = false,
  modoMunicipio = false,
  centrarEnUsuario = false,
  onOpenReclamo,
  enfocarId,
  onEnfocado,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const movidoPorUsuario = useRef(false);

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  // Región asentada: solo se usa para calcular grupos, nunca se le pasa al MapView.
  const [region, setRegion] = useState<Region>(CABA_REGION);
  const regionAsentada = useRef<Region | null>(null);
  const asentarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [size, setSize] = useState({ width: 360, height: 600 });
  const [tarjeta, setTarjeta] = useState<Tarjeta | null>(null);
  const [mapaListo, setMapaListo] = useState(false);

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

  useEffect(() => {
    if (!userCoords || !centrarEnUsuario || movidoPorUsuario.current) return;
    mapRef.current?.animateToRegion({ ...userCoords, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 400);
  }, [userCoords, centrarEnUsuario]);

  const handleRecenter = useCallback(() => {
    if (!userCoords) return;
    mapRef.current?.animateToRegion({ ...userCoords, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 400);
  }, [userCoords]);

  const reclamosPorId = useMemo(() => new Map(reclamos.map((r) => [r.id, r])), [reclamos]);

  // Se guarda la región solo si cambió lo suficiente como para que los grupos sean
  // distintos: otro nivel de zoom, o el centro corrido más de un cuarto de pantalla (el
  // margen de 70% de getClusters cubre ese desplazamiento). Y se espera 250 ms después del
  // último movimiento, así no se recalculan ni se re-renderizan los marcadores mientras la
  // persona sigue moviendo el mapa.
  const asentarRegion = useCallback((nueva: Region) => {
    if (asentarTimer.current) clearTimeout(asentarTimer.current);
    asentarTimer.current = setTimeout(() => {
      const previa = regionAsentada.current;
      const cambioZoom = previa ? Math.floor(Math.log2(360 / nueva.longitudeDelta)) !== Math.floor(Math.log2(360 / previa.longitudeDelta)) : true;
      const seMovio =
        previa !== null &&
        (Math.abs(nueva.latitude - previa.latitude) > previa.latitudeDelta * 0.25 ||
          Math.abs(nueva.longitude - previa.longitude) > previa.longitudeDelta * 0.25);
      if (previa === null || cambioZoom || seMovio) {
        regionAsentada.current = nueva;
        setRegion(nueva);
      }
    }, 250);
  }, []);

  useEffect(
    () => () => {
      if (asentarTimer.current) clearTimeout(asentarTimer.current);
    },
    []
  );

  const index = useMemo(() => {
    const sc = new Supercluster<PuntoProps, { vencido: number; peligroso: number }>({
      radius: 60,
      maxZoom: MAX_ZOOM,
      minPoints: 2,
      map: (p) => ({ vencido: p.vencido, peligroso: p.peligroso }),
      reduce: (acc, p) => {
        acc.vencido += p.vencido;
        acc.peligroso += p.peligroso;
      },
    });
    sc.load(
      reclamos.map((r) => ({
        type: 'Feature' as const,
        properties: {
          id: r.id,
          vencido: modoMunicipio && estaVencido(r, AREAS) ? 1 : 0,
          peligroso: modoMunicipio && CATEGORIAS_PELIGROSAS.includes(r.category) ? 1 : 0,
        },
        geometry: { type: 'Point' as const, coordinates: [r.longitude, r.latitude] },
      }))
    );
    return sc;
  }, [reclamos, modoMunicipio]);

  // Zoom mínimo (desde 15, para no alejarse de más) en el que el reclamo es un marcador
  // individual y no parte de un grupo. Si comparte punto exacto con otro reclamo no se
  // separa nunca: se queda en el zoom máximo.
  const zoomParaSepararlo = useCallback(
    (reclamo: Reclamo): number => {
      const bbox: [number, number, number, number] = [
        reclamo.longitude - 0.02,
        reclamo.latitude - 0.02,
        reclamo.longitude + 0.02,
        reclamo.latitude + 0.02,
      ];
      for (let zoom = 15; zoom <= MAX_ZOOM + 1; zoom++) {
        const suelto = index
          .getClusters(bbox, zoom)
          .some((f) => !('cluster' in f.properties && f.properties.cluster) && (f.properties as PuntoProps).id === reclamo.id);
        if (suelto) return zoom;
      }
      return MAX_ZOOM;
    },
    [index]
  );

  // Último enfocarId que ya se atendió. Mientras el padre siga pasando el mismo id no se lo
  // vuelve a atender (este efecto corre cada vez que cambian reclamosPorId o el índice, y
  // sin esta guarda llevaría el mapa de vuelta al reclamo todo el tiempo). Se resetea
  // cuando enfocarId queda vacío, así un pedido nuevo del mismo reclamo sí funciona.
  const enfocadoAtendido = useRef<string | null>(null);

  useEffect(() => {
    if (!enfocarId) {
      enfocadoAtendido.current = null;
      return;
    }
    if (!mapaListo || enfocadoAtendido.current === enfocarId) return;
    const reclamo = reclamosPorId.get(enfocarId);
    // Si todavía no cargaron los reclamos (o el filtro lo oculta) se espera: este efecto
    // vuelve a correr cuando cambia reclamosPorId.
    if (!reclamo) return;
    enfocadoAtendido.current = enfocarId;
    movidoPorUsuario.current = true; // que el primer GPS no lo mueva de lugar
    const zoom = Math.min(zoomParaSepararlo(reclamo) + 0.2, MAX_ZOOM + 0.9);
    mapRef.current?.animateToRegion(
      zoomARegion(zoom, size.width, size.height, reclamo.latitude, reclamo.longitude),
      400
    );
    setTarjeta({ tipo: 'uno', reclamo });
    onEnfocado?.();
    // size y onEnfocado no entran a propósito: es un efecto de una sola vez por pedido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enfocarId, mapaListo, reclamosPorId, zoomParaSepararlo]);

  const items = useMemo(() => {
    // Sin agrupar: pedir el zoom donde nada se agrupa devuelve todos los puntos sueltos.
    if (!CLUSTERING_ACTIVO) return index.getClusters([-180, -85, 180, 85], MAX_ZOOM + 1);
    const zoom = Math.max(0, Math.min(MAX_ZOOM + 1, Math.floor(regionAZoom(region, size.width))));
    // Un margen alrededor de lo visible para que no aparezcan "de golpe" al desplazar.
    const dLon = region.longitudeDelta * 0.7;
    const dLat = region.latitudeDelta * 0.7;
    const bbox: [number, number, number, number] = [
      Math.max(-180, region.longitude - dLon),
      Math.max(-85, region.latitude - dLat),
      Math.min(180, region.longitude + dLon),
      Math.min(85, region.latitude + dLat),
    ];
    return index.getClusters(bbox, zoom);
  }, [index, region, size.width]);

  // Lo último que necesitan los handlers de los marcadores: así los handlers son estables
  // (no cambian en cada render) y los marcadores no se re-renderizan por su culpa.
  const ultimo = useRef({ index, reclamosPorId, size });
  ultimo.current = { index, reclamosPorId, size };

  const handleMarkerPress = useCallback((tipo: 'cluster' | 'reclamo', refId: string, latitude: number, longitude: number) => {
    const { index: idx, reclamosPorId: porId, size: tam } = ultimo.current;

    if (tipo === 'reclamo') {
      const reclamo = porId.get(refId);
      if (reclamo) setTarjeta({ tipo: 'uno', reclamo });
      return;
    }

    const clusterId = Number(refId);
    const zoomSeparacion = idx.getClusterExpansionZoom(clusterId);
    if (zoomSeparacion > MAX_ZOOM) {
      // No se separan ni con el zoom máximo: lista para elegir cuál abrir.
      const grupo = idx
        .getLeaves(clusterId, Infinity)
        .map((hoja) => porId.get(hoja.properties.id))
        .filter((r): r is Reclamo => Boolean(r));
      setTarjeta({ tipo: 'lista', reclamos: grupo });
      return;
    }
    setTarjeta(null);
    const destino = zoomARegion(Math.min(zoomSeparacion + 0.2, MAX_ZOOM + 0.9), tam.width, tam.height, latitude, longitude);
    mapRef.current?.animateToRegion(destino, 350);
  }, []);

  return (
    <View style={styles.container}>
      <View
        style={styles.mapWrap}
        onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      >
        <MapView
          ref={mapRef}
          style={styles.map}
          // TODO(build de producción): Google Maps en Android necesita una API key
          // propia en app.json (android.config.googleMaps.apiKey) — ver comentario en
          // app.json. En Expo Go no hace falta (usa la key de desarrollo del propio
          // Expo Go). En iOS no se fuerza ningún provider: usa Apple Maps, que no
          // necesita key y sigue el modo claro/oscuro del sistema.
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={CABA_REGION}
          showsUserLocation={Boolean(userCoords)}
          onMapReady={() => setMapaListo(true)}
          onPress={() => setTarjeta(null)}
          onRegionChangeComplete={(nueva, details) => {
            if (details?.isGesture) movidoPorUsuario.current = true;
            asentarRegion(nueva);
          }}
        >
          {items.map((item) => {
            const [longitude, latitude] = item.geometry.coordinates;
            if ('cluster' in item.properties && item.properties.cluster) {
              const { cluster_id, point_count, vencido, peligroso } = item.properties;
              return (
                <PinMarker
                  key={`c-${cluster_id}`}
                  tipo="cluster"
                  refId={String(cluster_id)}
                  latitude={latitude}
                  longitude={longitude}
                  version={`${point_count}-${vencido}-${peligroso}`}
                  label={`Grupo de ${point_count} reclamos`}
                  onPressMarker={handleMarkerPress}
                >
                  <ClusterBubble count={point_count} vencido={vencido > 0} peligroso={peligroso > 0} />
                </PinMarker>
              );
            }
            const { id, vencido, peligroso } = item.properties as PuntoProps;
            const reclamo = reclamosPorId.get(id);
            if (!reclamo) return null;
            return (
              <PinMarker
                key={reclamo.id}
                tipo="reclamo"
                refId={reclamo.id}
                latitude={latitude}
                longitude={longitude}
                version={`${reclamo.status}-${reclamo.category}-${vencido}-${peligroso}`}
                label={`Reclamo: ${categoryLabels[reclamo.category]} en ${reclamo.address ?? 'ubicación sin resolver'}`}
                onPressMarker={handleMarkerPress}
              >
                <View style={styles.pinPad}>
                  <ReclamoMarker reclamo={reclamo} />
                  {vencido > 0 && (
                    <View style={[styles.badge, styles.badgeVencido]}>
                      <Ionicons name="alarm" size={11} color={colors.chalk} />
                    </View>
                  )}
                  {peligroso > 0 && (
                    <View style={[styles.badge, styles.badgePeligroso]}>
                      <Ionicons name="warning" size={11} color={colors.asphalt} />
                    </View>
                  )}
                </View>
              </PinMarker>
            );
          })}
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
          <View style={styles.locationNotice} pointerEvents="none">
            <Text style={styles.locationNoticeText}>Sin tu ubicación, el mapa arranca centrado en CABA.</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <Text style={styles.loadingText}>Cargando reclamos…</Text>
          </View>
        )}
      </View>

      {tarjeta?.tipo === 'uno' && (
        <Pressable
          style={styles.selectedCard}
          onPress={() => onOpenReclamo(tarjeta.reclamo)}
          accessibilityRole="button"
          accessibilityLabel={`Ver reclamo de ${categoryLabels[tarjeta.reclamo.category]}`}
        >
          <FilaReclamo reclamo={tarjeta.reclamo} />
        </Pressable>
      )}

      {tarjeta?.tipo === 'lista' && (
        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{tarjeta.reclamos.length} reclamos en este punto</Text>
            <Pressable onPress={() => setTarjeta(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar lista">
              <Ionicons name="close" size={20} color={colors.asphalt} />
            </Pressable>
          </View>
          <ScrollView style={styles.listScroll}>
            {tarjeta.reclamos.map((reclamo) => (
              <Pressable
                key={reclamo.id}
                style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
                onPress={() => onOpenReclamo(reclamo)}
                accessibilityRole="button"
                accessibilityLabel={`Ver reclamo de ${categoryLabels[reclamo.category]}`}
              >
                <FilaReclamo reclamo={reclamo} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function FilaReclamo({ reclamo }: { reclamo: Reclamo }) {
  return (
    <>
      <View style={styles.selectedPhotoWrap}>
        <ReclamoMarker reclamo={reclamo} size={44} />
      </View>
      <View style={styles.selectedBody}>
        <Text style={styles.selectedTitle} numberOfLines={1}>
          {categoryLabels[reclamo.category]}
        </Text>
        <Text style={styles.selectedAddress} numberOfLines={1}>
          {reclamo.address ?? 'Ubicación sin resolver'}
        </Text>
        <StatusStamp status={reclamo.status} />
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.concrete} />
    </>
  );
}

function ClusterBubble({ count, vencido, peligroso }: { count: number; vencido: boolean; peligroso: boolean }) {
  return (
    <View style={styles.pinPad}>
      <View style={[styles.cluster, vencido && styles.clusterVencido]}>
        <Text style={styles.clusterText}>{count}</Text>
      </View>
      {peligroso && (
        <View style={[styles.badge, styles.badgePeligroso]}>
          <Ionicons name="warning" size={11} color={colors.asphalt} />
        </View>
      )}
    </View>
  );
}

type PinMarkerProps = {
  tipo: 'cluster' | 'reclamo';
  refId: string;
  latitude: number;
  longitude: number;
  // Cambia cuando el dibujo del marcador cambia: ahí se vuelve a "fotografiar" la vista.
  version: string;
  label: string;
  onPressMarker: (tipo: 'cluster' | 'reclamo', refId: string, latitude: number, longitude: number) => void;
  children: ReactNode;
};

// tracksViewChanges en true solo hasta que la vista del marcador (íconos de fuente /
// SVG) termina de dibujarse; después en false. Con true permanente, cada marcador se
// vuelve a rasterizar todo el tiempo y el mapa se traba, sobre todo en iOS.
//
// memo con comparación propia: `children` es un elemento nuevo en cada render del mapa,
// pero si `version` no cambió el dibujo es idéntico. Así, al recalcular los grupos, solo
// se tocan los marcadores que aparecen, desaparecen o cambian de verdad.
const PinMarker = memo(
  function PinMarker({ tipo, refId, latitude, longitude, version, label, onPressMarker, children }: PinMarkerProps) {
    const [tracks, setTracks] = useState(true);
    const coordinate = useMemo(() => ({ latitude, longitude }), [latitude, longitude]);

    useEffect(() => {
      setTracks(true);
      // Respaldo por si onLayout nunca dispara.
      const timeout = setTimeout(() => setTracks(false), 1000);
      return () => clearTimeout(timeout);
    }, [version]);

    return (
      <Marker
        coordinate={coordinate}
        tracksViewChanges={tracks}
        // Tanto el rombo como el círculo de grupo son simétricos: su centro es el punto del
        // reclamo. Sin esto, en Google Maps (Android) el ancla por defecto es el borde
        // inferior y el marcador queda dibujado más arriba de su ubicación real. Apple Maps
        // (iOS) ignora `anchor` y ya centra la vista.
        anchor={ANCLA_CENTRO}
        // En iOS, tocar un marcador también dispara el onPress del MapView, que cierra la
        // tarjeta que este mismo toque acaba de abrir. stopPropagation lo evita (Android
        // no propaga el evento, así que no le cambia nada).
        stopPropagation
        onPress={() => onPressMarker(tipo, refId, latitude, longitude)}
        accessibilityLabel={label}
      >
        <View onLayout={() => setTimeout(() => setTracks(false), 150)}>{children}</View>
      </Marker>
    );
  },
  (a, b) =>
    a.tipo === b.tipo &&
    a.refId === b.refId &&
    a.latitude === b.latitude &&
    a.longitude === b.longitude &&
    a.version === b.version &&
    a.label === b.label &&
    a.onPressMarker === b.onPressMarker
);

const ANCLA_CENTRO = { x: 0.5, y: 0.5 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.chalk,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  pinPad: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.chalk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeVencido: {
    top: 0,
    right: 0,
    backgroundColor: colors.rust,
  },
  badgePeligroso: {
    top: 0,
    left: 0,
    backgroundColor: colors.yellow,
  },
  cluster: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 6,
    backgroundColor: colors.asphalt,
    borderWidth: 3,
    borderColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterVencido: {
    borderColor: colors.rust,
  },
  clusterText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.sm,
    color: colors.chalk,
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
  listCard: {
    backgroundColor: colors.chalk,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    maxHeight: 280,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  listTitle: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
  },
  listScroll: {
    flexGrow: 0,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
});
