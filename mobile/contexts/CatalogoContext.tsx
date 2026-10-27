import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { mensajeDeError } from '../lib/mensajeDeError';
import { listarAreas } from '../services/areas';
import { listarMunicipios } from '../services/municipios';
import type { Area } from '../types/area';
import type { Municipio } from '../types/municipio';
import { useAuth } from './AuthContext';

type CatalogoContextValue = {
  areas: Area[];
  municipios: Municipio[];
  error: string | null;
  areaPorId: (areaId: string | undefined) => Area | undefined;
};

const CatalogoContext = createContext<CatalogoContextValue | null>(null);

// Áreas y municipios vienen de la API, que pide sesión: se cargan una vez al haber usuario y se
// vacían al cerrar sesión. Mientras no llegan quedan en [], así que las pantallas no necesitan
// esperar.
export function CatalogoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [areas, setAreas] = useState<Area[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAreas([]);
    setMunicipios([]);
    setError(null);
    if (!userId) return;

    // Si la sesión cambia mientras carga, la respuesta vieja se descarta.
    let vigente = true;
    Promise.all([listarAreas(), listarMunicipios()])
      .then(([nuevasAreas, nuevosMunicipios]) => {
        if (!vigente) return;
        setAreas(nuevasAreas);
        setMunicipios(nuevosMunicipios);
      })
      .catch((err) => {
        if (vigente) setError(mensajeDeError(err));
      });
    return () => {
      vigente = false;
    };
  }, [userId]);

  const value = useMemo<CatalogoContextValue>(
    () => ({
      areas,
      municipios,
      error,
      areaPorId: (areaId) => (areaId ? areas.find((area) => area.id === areaId) : undefined),
    }),
    [areas, municipios, error]
  );

  return <CatalogoContext.Provider value={value}>{children}</CatalogoContext.Provider>;
}

export function useCatalogo(): CatalogoContextValue {
  const context = useContext(CatalogoContext);
  if (!context) {
    throw new Error('useCatalogo debe usarse dentro de CatalogoProvider');
  }
  return context;
}
