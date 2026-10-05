import type { ImageSourcePropType } from 'react-native';
import { fotosReclamo } from '../assets/reclamos';
import { resolverUriFoto } from '../services/fotos';
import type { Reclamo } from '../types/reclamo';

// Los reclamos de prueba traen `photoKey` (foto empaquetada con la app); los que publica
// el vecino traen `photoUrl` (URI de la cámara o galería). Las pantallas usan siempre esto.
export function fotoSource(reclamo: Pick<Reclamo, 'photoUrl' | 'photoKey'>): ImageSourcePropType {
  if (reclamo.photoKey && fotosReclamo[reclamo.photoKey]) return fotosReclamo[reclamo.photoKey];
  return { uri: resolverUriFoto(reclamo.photoUrl) };
}

// Misma idea para la foto de resolución (después de la reparación).
export function fotoResolucionSource(
  reclamo: Pick<Reclamo, 'fotoResolucion' | 'fotoResolucionKey'>
): ImageSourcePropType | null {
  if (reclamo.fotoResolucionKey && fotosReclamo[reclamo.fotoResolucionKey]) {
    return fotosReclamo[reclamo.fotoResolucionKey];
  }
  return reclamo.fotoResolucion ? { uri: resolverUriFoto(reclamo.fotoResolucion) } : null;
}
