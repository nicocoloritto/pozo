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
