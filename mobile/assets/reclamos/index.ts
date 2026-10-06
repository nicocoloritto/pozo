import type { ImageSourcePropType } from 'react-native';

// Fotos de los reclamos de prueba (data/reclamos.json, campos `photoKey` y
// `fotoResolucionKey`), empaquetadas con la app para que se vean sin internet.
//
// Los require tienen que ser estáticos (Metro los resuelve al compilar): por eso es un
// mapa a mano y no se arma el nombre del archivo con una variable. Cada línea está
// comentada hasta que el archivo exista en esta carpeta: al copiar una foto, se
// descomenta su línea. Mientras una clave no esté acá, lib/fotoReclamo.ts usa el
// `photoUrl` del JSON como respaldo. Fuente y autor: assets/reclamos/CREDITOS.md.
export const fotosReclamo: Record<string, ImageSourcePropType> = {
  // 'pozo-1': require('./pozo-1.jpg'),
  // 'pozo-2': require('./pozo-2.jpg'),
  // 'vereda-1': require('./vereda-1.jpg'),
  // 'semaforo-1': require('./semaforo-1.jpg'),
  // 'luminaria-1': require('./luminaria-1.jpg'),
  // 'luminaria-2': require('./luminaria-2.jpg'),
  // 'poste-1': require('./poste-1.jpg'),
  // 'arbol-1': require('./arbol-1.jpg'),
  // 'zanja-1': require('./zanja-1.jpg'),
  // 'corte-luz-1': require('./corte-luz-1.jpg'),
  // 'residuos-antes': require('./residuos-antes.jpg'),
  // 'residuos-despues': require('./residuos-despues.jpg'),
  // 'vereda-2': require('./vereda-2.jpg'),
  // 'semaforo-2': require('./semaforo-2.jpg'),
  // 'arbol-2': require('./arbol-2.jpg'),
  // 'pozo-3': require('./pozo-3.jpg'),
  // 'luminaria-3': require('./luminaria-3.jpg'),
  // 'luminaria-despues': require('./luminaria-despues.jpg'),
  // 'corte-luz-2': require('./corte-luz-2.jpg'),
};
