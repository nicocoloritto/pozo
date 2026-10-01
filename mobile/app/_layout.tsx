import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { devLog } from '../lib/devLog';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Hard backstop for font loading: if useFonts never settles (loaded or errored), we
// still have to let the splash go away eventually. AuthContext has its own matching
// 5s backstop for the session/seed side; together they guarantee
// `fontsReady && authReady` becomes true no matter what.
const FONTS_SAFETY_TIMEOUT_MS = 5000;

const AUTH_ROUTES = ['login', 'register'];
// Todo lo que es del admin: el grupo de tabs "(admin)" (bandeja/tablero/perfil) y el
// detalle de gestión, que vive como ruta hermana (como reclamos/[id] para el vecino).
const ADMIN_ROUTE_SEGMENTS = ['(admin)', 'admin-reclamo'];

// Redirects based on session and role: logged out neighbors only get to see
// login/register; a vecino session only gets the vecino tabs/reclamos; an admin
// session only gets sus propias rutas — nunca las del otro rol, ni siquiera si se
// navega con un link directo, porque esto se re-evalúa en cada cambio de `segments`.
// Es un efecto que corre DESPUÉS de montado el navegador de abajo, nunca lo reemplaza.
function AuthGate() {
  const { user, authReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;

    const from = `/${segments.join('/')}`;
    // "/" (app/index.tsx) is only ever a brief handoff — it has no content of its own
    // since we removed onboarding, so it can never be a final destination either.
    const isIndexRoute = from === '/';
    const inAuthRoute = AUTH_ROUTES.includes(segments[0]);
    const inAdminRoute = ADMIN_ROUTE_SEGMENTS.includes(segments[0]);

    let to: string | null = null;
    if (!user) {
      if (!inAuthRoute) to = '/login';
    } else if (user.rol === 'admin') {
      if (!inAdminRoute) to = '/bandeja';
    } else if (inAuthRoute || inAdminRoute || isIndexRoute) {
      to = '/map';
    }

    if (to) {
      devLog('AuthGate:redirect', from, '->', to);
      router.replace(to);
    } else {
      devLog('AuthGate:queda en', from);
    }
  }, [user, authReady, segments, router]);

  return null;
}

function AppNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { authReady } = useAuth();

  useEffect(() => {
    if (!fontsReady || !authReady) return;
    devLog('splash:hideAsync', { fontsReady, authReady });
    SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, authReady]);

  // expo-router requires the root layout to always render the navigator on the very
  // first render — returning null/undefined (or anything else) in its place leaves the
  // router's internal state uninitialized, so even mounting the <Stack /> later never
  // recovers: the splash goes away but no screen appears. That's exactly what was
  // happening here while we waited on `authReady` before rendering <Stack />. The real
  // wait now lives only in AuthGate, as an effect that runs after this is mounted.
  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.chalk } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reclamos/[id]" />
        <Stack.Screen name="reclamos/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="reclamos/published" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="admin-reclamo/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ArchivoBlack_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  const [fontsTimedOut, setFontsTimedOut] = useState(false);

  useEffect(() => {
    if (fontsLoaded) devLog('fonts:loaded');
    if (fontError) devLog('fonts:error', fontError);
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Once fonts actually resolve there's nothing left to time out: re-running this
    // effect (dep change) clears the still-pending timeout from the previous run
    // before deciding not to schedule a new one.
    if (fontsLoaded || fontError) return;

    const timeout = setTimeout(() => {
      devLog('fonts:safety-timeout, se continúa igual');
      setFontsTimedOut(true);
    }, FONTS_SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [fontsLoaded, fontError]);

  const fontsReady = fontsLoaded || Boolean(fontError) || fontsTimedOut;

  // El layout raíz siempre renderiza el mismo árbol, con el <Stack /> de AppNavigator
  // montado desde el primer render: nunca "return null" ni un <View /> vacío mientras
  // cargan las fuentes o la sesión. El splash nativo (preventAutoHideAsync arriba) es
  // lo que tapa la pantalla hasta que todo esté listo, no un render condicional.
  return (
    <>
      <StatusBar style="auto" />
      <ErrorBoundary>
        <AuthProvider>
          <AppNavigator fontsReady={fontsReady} />
        </AuthProvider>
      </ErrorBoundary>
    </>
  );
}
