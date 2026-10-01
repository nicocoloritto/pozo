import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

// "/" never has content of its own (there's no onboarding anymore): it only exists so
// expo-router has an initial route to land on, and immediately hands off based on
// session and role. AuthGate (app/_layout.tsx) backs this up for any other screen that
// ends up at "/", but this is the fast path for the very first render.
export default function Index() {
  const { user, authReady } = useAuth();

  if (!authReady) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.rol === 'admin') return <Redirect href="/bandeja" />;
  return <Redirect href="/map" />;
}
