import { useLocalSearchParams } from 'expo-router';
import PlaceholderScreen from '../../components/PlaceholderScreen';

// Screen 03 of the mockup.
export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <PlaceholderScreen title="Detalle de reclamo" subtitle={`#${id} · Pantalla 03 del mockup`} />;
}
