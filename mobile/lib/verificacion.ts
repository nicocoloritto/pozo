import { VOTOS_YA_NO_ESTA_PARA_AVISO } from '../types/reclamo';
import type { Reclamo, TipoVoto } from '../types/reclamo';

export type ResumenVerificacion = {
  sigue: number;
  yaNoEsta: number;
  miVoto: TipoVoto | null;
  posiblementeResuelto: boolean;
};

// Función pura: cuenta los votos "¿Sigue ahí?" de un reclamo y dice qué votó el vecino.
export function resumenVerificacion(
  reclamo: Pick<Reclamo, 'confirmaciones' | 'votosYaNoEsta'>,
  vecinoId: string | null
): ResumenVerificacion {
  const yaNoEstaIds = reclamo.votosYaNoEsta ?? [];
  const sigue = reclamo.confirmaciones.length;
  const yaNoEsta = yaNoEstaIds.length;
  const miVoto: TipoVoto | null =
    vecinoId === null ? null : reclamo.confirmaciones.includes(vecinoId) ? 'sigue' : yaNoEstaIds.includes(vecinoId) ? 'yaNoEsta' : null;
  return {
    sigue,
    yaNoEsta,
    miVoto,
    posiblementeResuelto: yaNoEsta >= VOTOS_YA_NO_ESTA_PARA_AVISO && yaNoEsta > sigue,
  };
}

// "hace 5 min", "hace 3 h", "hace 2 días". `ahora` es parámetro para poder testearla.
export function haceCuanto(iso: string, ahora: number = Date.now()): string {
  const minutos = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 60000));
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
}
