import type { Area } from '../types/area';
import { llamar } from './api';

export function listarAreas(): Promise<Area[]> {
  return llamar<Area[]>('/areas');
}
