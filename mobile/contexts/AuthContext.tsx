import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { devLog } from '../lib/devLog';
import * as authService from '../services/auth';
import type { RegisterInput } from '../services/auth';
import * as reclamosService from '../services/reclamos';
import type { User } from '../types/user';

type AuthContextValue = {
  user: User | null;
  authReady: boolean;
  registrar: (input: RegisterInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// 5s hard cap: if the seed or AsyncStorage ever hangs, we still have to flip
// `authReady` so AuthGate can move on (to /login, since `user` stays null) instead of
// leaving the app stuck on a blank screen forever.
const AUTH_READY_TIMEOUT_MS = 5000;

// Holds the logged-in user for the app, backed by AsyncStorage (services/auth.ts) so a
// session survives a reload. `authReady` tells RootLayout when the seed data and the
// saved session (if any) finished loading, so AuthGate doesn't redirect to /login
// before we actually know there's one.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let settled = false;
    devLog('AuthProvider:bootstrap:start');

    const finish = (session: User | null, reason: string) => {
      if (settled) return;
      settled = true;
      devLog('AuthProvider:bootstrap:end', reason, session ? `${session.email} (${session.rol})` : 'sin sesión');
      setUser(session);
      setAuthReady(true);
    };

    const timeout = setTimeout(() => {
      console.warn('[auth] Carga de sesión demasiado lenta, se continúa sin sesión');
      finish(null, 'timeout');
    }, AUTH_READY_TIMEOUT_MS);

    // El seed de los JSON de prueba (usuarios-vecinos.json / usuarios-admin.json, con su
    // hasheo SHA-256) corre en segundo plano: no bloquea que la app arranque y muestre
    // login. Solo la lectura de la sesión guardada decide qué pantalla mostrar primero.
    authService.init().catch((err) => {
      console.warn('[auth] Falló el seed en segundo plano', err);
    });
    reclamosService.init().catch((err) => {
      console.warn('[reclamos] Falló el seed en segundo plano', err);
    });

    (async () => {
      let session: User | null = null;
      try {
        session = await authService.obtenerSesion();
      } catch (err) {
        // obtenerSesion() ya se traga sus propios errores, pero por si algo más se
        // escapa, nunca dejamos a authReady colgado.
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
      authReady,
      async registrar(input) {
        const created = await authService.registrar(input);
        await authService.guardarSesion(created);
        setUser(created);
      },
      async login(email, password) {
        const found = await authService.login(email, password);
        await authService.guardarSesion(found);
        setUser(found);
      },
      async cerrarSesion() {
        await authService.cerrarSesion();
        setUser(null);
      },
    }),
    [user, authReady]
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
