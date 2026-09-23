import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { ColorValue, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes } from '../../theme';

type TabIconProps = {
  focused: boolean;
  color: ColorValue;
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
};

function TabIcon({ focused, color, outline, filled }: TabIconProps) {
  return <Ionicons name={focused ? filled : outline} size={22} color={color} />;
}

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
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.concrete,
        tabBarStyle: { backgroundColor: colors.asphalt, borderTopColor: colors.asphalt2 },
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: (props) => <TabIcon {...props} outline="map-outline" filled="map" />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: (props) => (
            <TabIcon {...props} outline="podium-outline" filled="podium" />
          ),
        }}
      />
      <Tabs.Screen name="new" options={{ title: '', tabBarButton: () => <NewReportButton /> }} />
      <Tabs.Screen
        name="mine"
        options={{
          title: 'Mis',
          tabBarIcon: (props) => (
            <TabIcon {...props} outline="document-text-outline" filled="document-text" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: (props) => <TabIcon {...props} outline="person-outline" filled="person" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
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
