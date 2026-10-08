import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, radii, shadows, spacing } from '../../theme';

type TabIconProps = {
  focused: boolean;
  color: ColorValue;
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
};

function TabIcon({ focused, color, outline, filled }: TabIconProps) {
  return (
    <View style={styles.tabIconWrap}>
      <Ionicons name={focused ? filled : outline} size={22} color={color} />
      <View style={[styles.tabDot, focused && styles.tabDotActive]} />
    </View>
  );
}

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cobalt,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: [styles.tabBar, { bottom: Math.max(insets.bottom, spacing.md) }],
        tabBarLabelStyle: styles.tabBarLabel,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="bandeja"
        options={{
          title: 'Bandeja',
          tabBarAccessibilityLabel: 'Bandeja',
          tabBarIcon: (props) => <TabIcon {...props} outline="file-tray-full-outline" filled="file-tray-full" />,
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarAccessibilityLabel: 'Mapa',
          tabBarIcon: (props) => <TabIcon {...props} outline="map-outline" filled="map" />,
        }}
      />
      <Tabs.Screen
        name="tablero"
        options={{
          title: 'Tablero',
          tabBarAccessibilityLabel: 'Tablero',
          tabBarIcon: (props) => <TabIcon {...props} outline="stats-chart-outline" filled="stats-chart" />,
        }}
      />
      <Tabs.Screen
        name="perfil"
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
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    height: 68,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderRadius: radii.xl,
    borderTopWidth: 0,
    backgroundColor: colors.surface,
    ...shadows.float,
  },
  tabBarLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
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
    backgroundColor: colors.cobalt,
  },
});
