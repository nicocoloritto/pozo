import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { devLog } from '../lib/devLog';
import * as authService from '../services/auth';
import type { RegisterInput } from '../services/auth';
import * as reclamosService from '../services/reclamos';
import type { User } from '../types/user';

type AuthContextValue = {
  user: User | null;
  isHydrated: boolean;
  registrar: (input: RegisterInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  restablecerDatosDePrueba: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// 5s hard cap: if the seed or AsyncStorage ever hangs, we still have to flip
// `isHydrated` so AuthGate can move on (to /login, since `user` stays null) instead of
// leaving the app stuck on a blank screen forever.
const HYDRATION_TIMEOUT_MS = 5000;

// Holds the logged-in user for the app, backed by AsyncStorage (services/auth.ts) so a
// session survives a reload.
//
// Flujo del storage (patrón de la clase de AsyncStorage):
//   1. Al montar, se LEE la sesión guardada (AsyncStorage solo devuelve texto).
//   2. Se PARSEA el JSON a un User (services/auth.ts → obtenerSesion).
//   3. Recién ahí se marca `isHydrated = true`: la app ya sabe si hay sesión o no.
//   4. Después se GUARDA en cada cambio (registrar / login / cerrarSesion). Nada se
//      escribe antes de hidratar, para no pisar con "sin sesión" lo que había guardado.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  // Se resuelve cuando termina la hidratación: las acciones que escriben la esperan
  // antes de tocar el storage.
  const hydration = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null);
  if (!hydration.current) {
    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
      resolve = res;
    });
    hydration.current = { promise, resolve };
  }
  // registrar/login leen y reescriben la lista entera de usuarios: si corrieran mientras
  // el seed todavía está hasheando, su guardado se pisaría con el del seed (o el login no
  // encontraría a los usuarios de prueba). Por eso esperan a que el seed termine.
  const seed = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let settled = false;
    devLog('AuthProvider:bootstrap:start');

    const finish = (session: User | null, reason: string) => {
      if (settled) return;
      settled = true;
      devLog('AuthProvider:bootstrap:end', reason, session ? `${session.email} (${session.rol})` : 'sin sesión');
      setUser(session);
      setIsHydrated(true);
      hydration.current?.resolve();
    };

    const timeout = setTimeout(() => {
      console.warn('[auth] Carga de sesión demasiado lenta, se continúa sin sesión');
      finish(null, 'timeout');
    }, HYDRATION_TIMEOUT_MS);

    // El seed de los JSON de prueba (usuarios-vecinos.json / usuarios-admin.json, con su
    // hasheo SHA-256) corre en segundo plano: no bloquea que la app arranque y muestre
    // login. Solo la lectura de la sesión guardada decide qué pantalla mostrar primero.
    seed.current = Promise.all([
      authService.init().catch((err) => {
        console.warn('[auth] Falló el seed en segundo plano', err);
      }),
      reclamosService.init().catch((err) => {
        console.warn('[reclamos] Falló el seed en segundo plano', err);
      }),
    ]).then(() => undefined);

    (async () => {
      let session: User | null = null;
      try {
        session = await authService.obtenerSesion();
      } catch (err) {
        // obtenerSesion() ya se traga sus propios errores, pero por si algo más se
        // escapa, nunca dejamos a isHydrated colgado.
        console.warn('[auth] Error inesperado leyendo la sesión', err);
      } finally {
        clearTimeout(timeout);
        finish(session, 'ok');
      }
    })();

    return () => {
      settled = true;
      clearTimeout(timeout);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isHydrated,
      async registrar(input) {
        await hydration.current?.promise;
        await seed.current;
        const created = await authService.registrar(input);
        await authService.guardarSesion(created);
        setUser(created);
      },
      async login(email, password) {
        await hydration.current?.promise;
        await seed.current;
        const found = await authService.login(email, password);
        await authService.guardarSesion(found);
        setUser(found);
      },
      async cerrarSesion() {
        await hydration.current?.promise;
        await authService.cerrarSesion();
        setUser(null);
      },
      // Solo se usa desde el botón de desarrollo del Perfil (__DEV__).
      async restablecerDatosDePrueba() {
        await hydration.current?.promise;
        await authService.resetear();
        await reclamosService.resetear();
        await authService.init();
        await reclamosService.init();
        setUser(null);
      },
    }),
    [user, isHydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
