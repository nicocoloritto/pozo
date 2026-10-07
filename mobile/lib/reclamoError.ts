export type ReclamoErrorCode =
  | 'OWN_RECLAMO'
  | 'ALREADY_CONFIRMED'
  | 'NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'AREA_REQUIRED'
  | 'FOTO_REQUIRED'
  | 'MOTIVO_REQUIRED'
  | 'NOTA_VACIA'
  | 'INVALID_INPUT';

export class ReclamoError extends Error {
  code: ReclamoErrorCode;

  constructor(code: ReclamoErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
