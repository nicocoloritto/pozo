import { Redirect } from 'expo-router';

// The app opens on the onboarding screen. Once there is a session, this is where
// we decide between onboarding and the tabs.
export default function Index() {
  return <Redirect href="/onboarding" />;
}
