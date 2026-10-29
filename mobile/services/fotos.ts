import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { llamar } from './api';

// Las fotos viven en el servidor: al publicar un reclamo (o resolverlo) se sube la imagen y
// el reclamo guarda la URL que devuelve. Una URL que ya es de internet se usa tal cual.

function esLocal(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
}

// La cámara saca fotos de varios MB: se achican antes de subirlas para no pasar el límite del
// servidor ni el tiempo de espera.
const LADO_MAXIMO_PX = 1600;
const CALIDAD_JPEG = 0.7;
const TIMEOUT_SUBIDA_MS = 60000;

// Lado más largo de hasta LADO_MAXIMO_PX (sin agrandar las fotos más chicas) y siempre JPEG.
async function achicarFoto(uri: string): Promise<string> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const achicada =
    Math.max(original.width, original.height) > LADO_MAXIMO_PX
      ? await ImageManipulator.manipulate(original)
          .resize(original.width >= original.height ? { width: LADO_MAXIMO_PX } : { height: LADO_MAXIMO_PX })
          .renderAsync()
      : original;
  const { uri: resultado } = await achicada.saveAsync({ compress: CALIDAD_JPEG, format: SaveFormat.JPEG });
  return resultado;
}

// Sube la foto y devuelve su URL. Tira ApiError si no se pudo (sin conexión, archivo muy
// pesado…): el que llama decide qué mostrarle a la persona.
export async function subirFoto(uri: string): Promise<string> {
  if (!esLocal(uri)) return uri;

  const { url } = await llamar<{ url: string }>('/fotos', {
    metodo: 'POST',
    archivo: { uri: await achicarFoto(uri), campo: 'foto', mimeType: 'image/jpeg' },
    timeoutMs: TIMEOUT_SUBIDA_MS,
  });
  return url;
}

// Las fotos de los reclamos ya son URLs del servidor: no hay nada que resolver.
export function resolverUriFoto(uri: string): string {
  return uri;
}
