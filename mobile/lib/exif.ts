// Lee las coordenadas GPS que una foto trae en sus metadatos EXIF (el estándar que usan
// las cámaras para guardar fecha, modelo del teléfono y, si la ubicación estaba activada,
// dónde se sacó la foto).
//
// Detalle que importa en Argentina: EXIF guarda latitud y longitud siempre como números
// POSITIVOS y aparte una letra de referencia (N/S y E/W). Buenos Aires es Sur y Oeste, así
// que sin mirar esa letra una foto de CABA caería en el hemisferio equivocado
// (34.6, 58.4 en vez de -34.6, -58.4).

export type CoordenadasExif = { latitude: number; longitude: number };

// Acepta un número ya decimal (34.6) o el formato clásico de grados/minutos/segundos como
// texto: "34/1,36/1,30/1" (fracciones) o "34,36,30".
function aNumero(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== 'string') return null;

  const partes = valor
    .split(',')
    .map((parte) => parte.trim())
    .filter(Boolean);
  if (partes.length === 0 || partes.length > 3) return null;

  const numeros = partes.map((parte) => {
    const [numerador, denominador] = parte.split('/');
    const divisor = denominador === undefined ? 1 : Number(denominador);
    return divisor === 0 ? NaN : Number(numerador) / divisor;
  });
  if (numeros.some((n) => !Number.isFinite(n))) return null;

  // grados + minutos/60 + segundos/3600
  return numeros.reduce((acumulado, n, indice) => acumulado + n / 60 ** indice, 0);
}

// `letraNegativa` es 'S' para latitud y 'W' para longitud. Sin referencia, se respeta el
// signo que ya traiga el número.
function aGrados(valor: unknown, referencia: unknown, letraNegativa: 'S' | 'W'): number | null {
  const numero = aNumero(valor);
  if (numero === null) return null;

  const letra = typeof referencia === 'string' ? referencia.trim().charAt(0).toUpperCase() : '';
  return letra === letraNegativa ? -Math.abs(numero) : numero;
}

export function coordenadasDesdeExif(exif: Record<string, unknown> | null | undefined): CoordenadasExif | null {
  if (!exif) return null;

  const latitude = aGrados(exif.GPSLatitude, exif.GPSLatitudeRef, 'S');
  const longitude = aGrados(exif.GPSLongitude, exif.GPSLongitudeRef, 'W');
  if (latitude === null || longitude === null) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  // (0, 0) es lo que escriben algunos teléfonos cuando no tenían GPS: no es una ubicación.
  if (latitude === 0 && longitude === 0) return null;

  return { latitude, longitude };
}
