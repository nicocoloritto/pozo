import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { devLog } from '../lib/devLog';
import { alSesionVencida } from '../services/api';
import * as authService from '../services/auth';
import type { RegisterInput } from '../services/auth';
import type { User } from '../types/user';

type AuthContextValue = {
  user: User | null;
  isHydrated: boolean;
  registrar: (input: RegisterInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  eliminarCuenta: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// 5s hard cap: if AsyncStorage ever hangs, we still have to flip `isHydrated` so AuthGate can
// move on (to /login, since `user` stays null) instead of leaving the app stuck on a blank
// screen forever.
const HYDRATION_TIMEOUT_MS = 5000;

// Holds the logged-in user for the app. El token y una copia del usuario se guardan en
// AsyncStorage (services/auth.ts) para que la sesión sobreviva a cerrar la app.
//
//   1. Al montar, se LEE la sesión guardada y recién ahí se marca `isHydrated = true`: la app
//      ya sabe si hay sesión o no, sin esperar a la red.
//   2. En segundo plano se le pregunta al servidor si la sesión sigue vigente. Si dice que no
//      (token vencido, cuenta borrada), se cierra la sesión y AuthGate manda al login.
//   3. Después se guarda en cada cambio (registrar / login / cerrarSesion).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let settled = false;
    devLog('AuthProvider:bootstrap:start');

    const finish = (session: User | null, reason: string) => {
      if (settled) return;
      settled = true;
      devLog('AuthProvider:bootstrap:end', reason, session ? `${session.email} (${session.rol})` : 'sin sesión');
      setUser(session);
      setIsHydrated(true);
    };

    const timeout = setTimeout(() => {
      console.warn('[auth] Carga de sesión demasiado lenta, se continúa sin sesión');
      finish(null, 'timeout');
    }, HYDRATION_TIMEOUT_MS);

    alSesionVencida(() => setUser(null));

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
      if (session) {
        const vigente = await authService.verificarSesion();
        if (vigente) setUser((actual) => (actual && actual.id === vigente.id ? vigente : actual));
      }
    })();

    return () => {
      settled = true;
      clearTimeout(timeout);
      alSesionVencida(null);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isHydrated,
      async registrar(input) {
        setUser(await authService.registrar(input));
      },
      async login(email, password) {
        setUser(await authService.login(email, password));
      },
      async cerrarSesion() {
        await authService.cerrarSesion();
        setUser(null);
      },
      async eliminarCuenta() {
        await authService.eliminarCuenta();
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
