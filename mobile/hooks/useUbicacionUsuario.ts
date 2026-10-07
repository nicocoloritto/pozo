import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type CoordenadasUsuario = { latitude: number; longitude: number };

// 'noDisponible' cubre tanto "rechazó el permiso" como "no se pudo obtener el GPS": para la
// pantalla es lo mismo, no hay ubicación y se ofrece reintentar.
export type EstadoUbicacion = 'buscando' | 'lista' | 'noDisponible';

// Ubicación actual del usuario (expo-location, permiso "mientras se usa la app"). Pide el
// permiso si todavía no lo dio y no cierra nada si lo rechaza.
export function useUbicacionUsuario() {
  const [coords, setCoords] = useState<CoordenadasUsuario | null>(null);
  const [estado, setEstado] = useState<EstadoUbicacion>('buscando');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setEstado('buscando');

    (async () => {
      try {
        const permiso = await Location.requestForegroundPermissionsAsync();
        if (!permiso.granted) {
          if (!cancelado) setEstado('noDisponible');
          return;
        }
        const posicion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelado) return;
        setCoords({ latitude: posicion.coords.latitude, longitude: posicion.coords.longitude });
        setEstado('lista');
      } catch {
        if (!cancelado) setEstado('noDisponible');
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { coords, estado, reintentar };
}
