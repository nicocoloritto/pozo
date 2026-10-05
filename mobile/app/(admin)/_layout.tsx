import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue, StyleSheet, View } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../../theme';

type TabIconProps = {
  focused: boolean;
  color: ColorValue;
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
};

// Same active-tab treatment as el vecino (icono relleno + punto amarillo): sin botón
// "+" — el admin no crea ni confirma reclamos, solo los gestiona.
function TabIcon({ focused, color, outline, filled }: TabIconProps) {
  return (
    <View style={styles.tabIconWrap}>
      <Ionicons name={focused ? filled : outline} size={22} color={color} />
      <View style={[styles.tabDot, focused && styles.tabDotActive]} />
    </View>
  );
}

export default function AdminTabsLayout() {
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
});
