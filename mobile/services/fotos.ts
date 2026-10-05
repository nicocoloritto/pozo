import { Directory, File, Paths } from 'expo-file-system';
import { devLog } from '../lib/devLog';

// Las fotos que saca el vecino con la cámara (o elige de la galería) quedan en una
// carpeta temporal que el sistema puede borrar en cualquier momento. Al publicar se
// copian a esta carpeta permanente de la app, y el reclamo guarda la ruta de la copia.
//
// TODO: cuando exista el backend, acá se sube la foto al servidor y se guarda su URL.
const CARPETA = 'reclamos-fotos';

function carpeta(): Directory {
  return new Directory(Paths.document, CARPETA);
}

function extensionDe(uri: string): string {
  const limpio = uri.split('?')[0];
  const punto = limpio.lastIndexOf('.');
  const ext = punto >= 0 ? limpio.slice(punto + 1).toLowerCase() : '';
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'jpg';
}

// Copia la foto a la carpeta permanente y devuelve la ruta nueva. Tira un error si no se
// pudo copiar: el que llama decide qué mostrarle a la persona.
export async function guardarFotoPermanente(origenUri: string): Promise<string> {
  const dir = carpeta();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });

  const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionDe(origenUri)}`;
  const destino = new File(dir, nombre);
  await new File(origenUri).copy(destino);
  devLog('fotos.guardarFotoPermanente', origenUri, '->', destino.uri);
  return destino.uri;
}

// Borra una foto guardada (por ejemplo, si el reclamo no llegó a publicarse). Nunca tira.
export function borrarFotoPermanente(uri: string): void {
  try {
    const archivo = new File(resolverUriFoto(uri));
    if (archivo.exists) archivo.delete();
  } catch (err) {
    console.warn('[fotos] No se pudo borrar la foto', err);
  }
}

// Borra todas las fotos guardadas. Solo para "Restablecer datos de prueba" (__DEV__).
// Nunca tira.
export function borrarTodasLasFotos(): void {
  try {
    const dir = carpeta();
    if (dir.exists) dir.delete();
  } catch (err) {
    console.warn('[fotos] No se pudieron borrar las fotos guardadas', err);
  }
}

// En iOS la ruta absoluta de la carpeta de documentos puede cambiar cuando la app se
// actualiza o se reinstala (el contenedor cambia de identificador), aunque los archivos
// se conservan. Por eso, si la ruta guardada apunta a nuestra carpeta, se arma de nuevo a
// partir del nombre del archivo. Cualquier otra ruta (galería, https) queda igual.
export function resolverUriFoto(uri: string): string {
  const marca = `/${CARPETA}/`;
  const i = uri.indexOf(marca);
  if (!uri.startsWith('file://') || i < 0) return uri;
  return new File(carpeta(), uri.slice(i + marca.length)).uri;
}
