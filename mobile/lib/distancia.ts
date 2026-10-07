import type { Categoria, Reclamo } from '../types/reclamo';

const RADIO_TIERRA_METROS = 6371000;

// A partir de esta distancia, un reclamo de la misma categoría se considera "el mismo
// problema" y se avisa antes de publicar un duplicado.
export const RADIO_RECLAMO_CERCANO_METROS = 50;

type Coordenada = { latitude: number; longitude: number };

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

// Distancia en metros entre dos coordenadas (fórmula de Haversine). Función pura.
export function distanciaEnMetros(a: Coordenada, b: Coordenada): number {
  const dLat = aRadianes(b.latitude - a.latitude);
  const dLng = aRadianes(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.latitude)) * Math.cos(aRadianes(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_METROS * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Radio del listado "Cerca tuyo" (design/figma/02-mapa.png: "RADIO 500 m").
export const RADIO_CERCA_TUYO_METROS = 500;

export type ReclamoConDistancia = { reclamo: Reclamo; distanciaMetros: number };

// Reclamos activos (ni Resuelto ni Rechazado) dentro de `radioMetros` de `punto`, del más
// cercano al más lejano. Pasar Infinity como radio sirve para buscar el más cercano sin
// importar cuán lejos esté.
export function reclamosCercanos(
  reclamos: Reclamo[],
  punto: Coordenada,
  radioMetros: number = RADIO_CERCA_TUYO_METROS
): ReclamoConDistancia[] {
  return reclamos
    .filter((reclamo) => reclamo.status !== 'Resuelto' && reclamo.status !== 'Rechazado')
    .map((reclamo) => ({ reclamo, distanciaMetros: distanciaEnMetros(punto, reclamo) }))
    .filter((item) => item.distanciaMetros <= radioMetros)
    .sort((a, b) => a.distanciaMetros - b.distanciaMetros);
}

// "120 m" por debajo del kilómetro, "1,2 km" a partir de ahí.
export function formatearDistancia(metros: number): string {
  const redondeado = Math.round(metros);
  if (redondeado < 1000) return `${redondeado} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}

// El reclamo abierto (ni Resuelto ni Rechazado) de la misma categoría más cercano a
// `punto`, siempre que esté a menos de `radioMetros`. Si no hay, null.
export function encontrarReclamoCercano(
  reclamos: Reclamo[],
  punto: Coordenada & { category: Categoria },
  radioMetros: number = RADIO_RECLAMO_CERCANO_METROS
): { reclamo: Reclamo; distanciaMetros: number } | null {
  let mejor: { reclamo: Reclamo; distanciaMetros: number } | null = null;
  for (const reclamo of reclamos) {
    if (reclamo.category !== punto.category) continue;
    if (reclamo.status === 'Resuelto' || reclamo.status === 'Rechazado') continue;
    const distanciaMetros = distanciaEnMetros(punto, reclamo);
    if (distanciaMetros >= radioMetros) continue;
    if (!mejor || distanciaMetros < mejor.distanciaMetros) mejor = { reclamo, distanciaMetros };
  }
  return mejor;
}
