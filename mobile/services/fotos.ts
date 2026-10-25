import { llamar } from './api';

// Las fotos viven en el servidor: al publicar un reclamo (o resolverlo) se sube la imagen y
// el reclamo guarda la URL que devuelve. Una URL que ya es de internet se usa tal cual.

function esLocal(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
}

function extensionDe(uri: string): string {
  const limpio = uri.split('?')[0];
  const punto = limpio.lastIndexOf('.');
  const ext = punto >= 0 ? limpio.slice(punto + 1).toLowerCase() : '';
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'jpg';
}

function tipoMime(extension: string): string {
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic' || extension === 'heif') return 'image/heic';
  return 'image/jpeg';
}

// Sube la foto y devuelve su URL. Tira ApiError si no se pudo (sin conexión, archivo muy
// pesado…): el que llama decide qué mostrarle a la persona.
export async function subirFoto(uri: string): Promise<string> {
  if (!esLocal(uri)) return uri;

  const extension = extensionDe(uri);
  const formData = new FormData();
  // React Native acepta { uri, name, type } como archivo; los tipos de la web no lo conocen.
  formData.append('foto', { uri, name: `foto.${extension}`, type: tipoMime(extension) } as unknown as Blob);
  const { url } = await llamar<{ url: string }>('/fotos', { metodo: 'POST', formData });
  return url;
}

// Las fotos de los reclamos ya son URLs del servidor: no hay nada que resolver.
export function resolverUriFoto(uri: string): string {
  return uri;
}
