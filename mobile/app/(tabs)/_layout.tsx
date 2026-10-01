import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { ColorValue, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../../theme';

type TabIconProps = {
  focused: boolean;
  color: ColorValue;
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
};

// The active tab gets a filled icon plus a small yellow underline dot — relying only
// on a tint color swap is too subtle to read as "selected" at a glance.
function TabIcon({ focused, color, outline, filled }: TabIconProps) {
  return (
    <View style={styles.tabIconWrap}>
      <Ionicons name={focused ? filled : outline} size={22} color={color} />
      <View style={[styles.tabDot, focused && styles.tabDotActive]} />
    </View>
  );
}

// Center "+" button of the tab bar (see design/pozo-pantallas-hifi.html). It opens
// Nuevo reclamo instead of navigating to a tab, so `new` has no content of its own.
function NewReclamoButton() {
  const router = useRouter();

  return (
    <View style={styles.fabSlot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo reclamo"
        onPress={() => router.push('/reclamos/new')}
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
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.concrete,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarAccessibilityLabel: 'Mapa',
          tabBarIcon: (props) => <TabIcon {...props} outline="map-outline" filled="map" />,
        }}
      />
      <Tabs.Screen
        name="mine"
        options={{
          title: 'Mis reclamos',
          tabBarAccessibilityLabel: 'Mis reclamos',
          tabBarIcon: (props) => (
            <TabIcon {...props} outline="document-text-outline" filled="document-text" />
          ),
        }}
      />
      <Tabs.Screen
        name="new"
        options={{ title: '', tabBarButton: () => <NewReclamoButton /> }}
      />
      <Tabs.Screen
        name="estadisticas"
        options={{
          title: 'Estadísticas',
          tabBarAccessibilityLabel: 'Estadísticas',
          tabBarIcon: (props) => <TabIcon {...props} outline="stats-chart-outline" filled="stats-chart" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Perfil',
          tabBarIcon: (props) => <TabIcon {...props} outline="person-outline" filled="person" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.asphalt,
    borderTopColor: colors.asphalt2,
    height: 64,
    paddingTop: spacing.xs,
  },
  tabBarLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
  },
  tabIconWrap: {
    alignItems: 'center',
    gap: 3,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabDotActive: {
    backgroundColor: colors.yellow,
  },
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
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.chalk,
  },
});
