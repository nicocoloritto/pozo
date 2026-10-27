import type { Municipio } from '../types/municipio';
import { llamar } from './api';

export function listarMunicipios(): Promise<Municipio[]> {
  return llamar<Municipio[]>('/municipios');
}
