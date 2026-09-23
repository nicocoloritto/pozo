import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

// Center "+" button of the tab bar (see the mockup). It opens the new report screen
// instead of navigating to a tab, so `new` has no content of its own.
function NewReportButton() {
  const router = useRouter();

  return (
    <View style={styles.fabSlot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo reclamo"
        onPress={() => router.push('/reports/new')}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.asphalt,
        tabBarInactiveTintColor: colors.concrete,
        tabBarStyle: { backgroundColor: colors.chalk },
        tabBarLabelStyle: { fontSize: 10, textTransform: 'uppercase' },
      }}
    >
      <Tabs.Screen name="map" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="neighborhood" options={{ title: 'Barrio' }} />
      <Tabs.Screen name="new" options={{ title: '', tabBarButton: () => <NewReportButton /> }} />
      <Tabs.Screen name="mine" options={{ title: 'Mis' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabSlot: {
    flex: 1,
    alignItems: 'center',
  },
  fab: {
    width: 44,
    height: 44,
    marginTop: -14,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: colors.chalk,
    backgroundColor: colors.rust,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: {
    opacity: 0.7,
  },
  fabText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.chalk,
  },
});
