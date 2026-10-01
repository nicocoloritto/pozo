// A registered neighbor. See lib/dni.ts for where firstName/lastName/sex/documentNumber/
// birthDate come from (the PDF417 on the back of the DNI). `neighborhood` only exists on
// the seed test accounts (data/usuarios-vecinos.json); the DNI scan doesn't provide it.
export type Vecino = {
  id: string;
  rol: 'vecino';
  firstName: string;
  lastName: string;
  sex: string;
  documentNumber: string;
  birthDate: string;
  email: string;
  neighborhood?: string;
};

// Represents a municipality account (today only CABA). Admins never register from the
// app: they only exist as seed data in data/usuarios-admin.json.
export type Admin = {
  id: string;
  rol: 'admin';
  firstName: string;
  email: string;
  municipioId: string;
};

export type User = Vecino | Admin;
