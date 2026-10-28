import type { Reclamo } from '../types/reclamo';

export type ReclamoErrorCode =
  | 'OWN_RECLAMO'
  | 'ALREADY_CONFIRMED'
  | 'NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'AREA_REQUIRED'
  | 'FOTO_REQUIRED'
  | 'MOTIVO_REQUIRED'
  | 'NOTA_VACIA'
  | 'RECLAMO_CERCANO'
  | 'INVALID_INPUT'
  | 'FORBIDDEN'
  | 'UNAUTHENTICATED'
  | 'NETWORK'
  | 'SERVER';

export class ReclamoError extends Error {
  code: ReclamoErrorCode;

  constructor(code: ReclamoErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

// El servidor no publicó porque ya hay un reclamo abierto de la misma categoría a menos de
// 50 m. Trae ese reclamo para ofrecer confirmarlo, y la foto ya subida para que "publicar
// igual" no la suba de nuevo.
export class ReclamoCercanoError extends ReclamoError {
  reclamo: Reclamo;
  photoUrl: string;

  constructor(message: string, reclamo: Reclamo, photoUrl: string) {
    super('RECLAMO_CERCANO', message);
    this.reclamo = reclamo;
    this.photoUrl = photoUrl;
  }
}
