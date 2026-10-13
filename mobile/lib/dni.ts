// Parses the PDF417 barcode on the back of the Argentine DNI. Fields come separated by
// "@" in a fixed order: trámite, apellido, nombres, sexo, DNI, ejemplar, fecha de
// nacimiento, fecha de emisión. We keep only what the app needs — never el número de
// trámite ni el ejemplar.
export type ParsedDni = {
  lastName: string;
  firstName: string;
  sex: string;
  documentNumber: string;
  birthDate: string;
  issueDate: string;
};

export class DniParseError extends Error {}

// Solo los dígitos: el código de barras trae "30111222", pero el mismo DNI puede
// escribirse "30.111.222". Para comparar dos DNI hay que ignorar los puntos y espacios.
export function normalizarNumeroDni(valor: string): string {
  return valor.replace(/\D/g, '');
}

// Dos números de DNI son el mismo si tienen los mismos dígitos. Un valor sin dígitos no es
// igual a nada (ni a otro valor vacío): no es un DNI.
export function mismoDni(a: string, b: string): boolean {
  const normalizado = normalizarNumeroDni(a);
  return normalizado !== '' && normalizado === normalizarNumeroDni(b);
}

export function parseDniBarcode(raw: string): ParsedDni {
  const fields = raw.trim().split('@');
  if (fields.length < 8) {
    throw new DniParseError('El código no tiene el formato esperado del DNI.');
  }

  const [, lastName, firstName, sex, documentNumber, , birthDate, issueDate] = fields;
  if (!lastName || !firstName || !documentNumber) {
    throw new DniParseError('El código no tiene el formato esperado del DNI.');
  }

  return { lastName, firstName, sex, documentNumber, birthDate, issueDate };
}
