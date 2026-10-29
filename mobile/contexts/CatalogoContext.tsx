import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { mensajeDeError } from '../lib/mensajeDeError';
import { listarAreas } from '../services/areas';
import { obtenerBarrios } from '../services/estadisticas';
import { listarMunicipios } from '../services/municipios';
import type { Area } from '../types/area';
import type { Barrio } from '../types/estadisticas';
import type { Municipio } from '../types/municipio';
import { useAuth } from './AuthContext';

type CatalogoContextValue = {
  areas: Area[];
  municipios: Municipio[];
  barrios: Barrio[];
  error: string | null;
  areaPorId: (areaId: string | undefined) => Area | undefined;
};

const CatalogoContext = createContext<CatalogoContextValue | null>(null);

// Áreas, municipios y barrios vienen de la API, que pide sesión: se cargan una vez al haber usuario y se
// vacían al cerrar sesión. Mientras no llegan quedan en [], así que las pantallas no necesitan
// esperar.
export function CatalogoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [areas, setAreas] = useState<Area[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAreas([]);
    setMunicipios([]);
    setBarrios([]);
    setError(null);
    if (!userId) return;

    // Si la sesión cambia mientras carga, la respuesta vieja se descarta. Cada parte se guarda
    // apenas llega: si una falla (los barrios, por ejemplo), las que sí llegaron se conservan y
    // `error` avisa que el catálogo quedó incompleto.
    let vigente = true;
    (async () => {
      let falla: unknown = null;
      const [resAreas, resMunicipios] = await Promise.allSettled([listarAreas(), listarMunicipios()]);
      if (!vigente) return;
      if (resAreas.status === 'fulfilled') setAreas(resAreas.value);
      else falla = resAreas.reason;

      if (resMunicipios.status === 'fulfilled') {
        setMunicipios(resMunicipios.value);
        const resBarrios = await Promise.allSettled(resMunicipios.value.map((m) => obtenerBarrios(m.id)));
        if (!vigente) return;
        setBarrios(resBarrios.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])));
        const rechazado = resBarrios.find((r) => r.status === 'rejected');
        if (rechazado) falla = rechazado.reason;
      } else {
        falla = resMunicipios.reason;
      }
      if (falla) setError(mensajeDeError(falla));
    })();
    return () => {
      vigente = false;
    };
  }, [userId]);

  const value = useMemo<CatalogoContextValue>(
    () => ({
      areas,
      municipios,
      barrios,
      error,
      areaPorId: (areaId) => (areaId ? areas.find((area) => area.id === areaId) : undefined),
    }),
    [areas, municipios, barrios, error]
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
