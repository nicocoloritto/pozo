import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from '../../components/PressableScale';
import { colors, fonts, fontSizes, radii, shadows, spacing } from '../../theme';

type TabIconProps = {
  focused: boolean;
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
};

const SPRING = { damping: 14, stiffness: 220 };

function TabIcon({ focused, outline, filled }: TabIconProps) {
  const progress = useSharedValue(focused ? 1 : 0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    progress.value = reducedMotion ? (focused ? 1 : 0) : withSpring(focused ? 1 : 0, SPRING);
  }, [focused, progress, reducedMotion]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <View style={styles.tabIconWrap}>
      <Animated.View style={[styles.tabPill, pillStyle]} />
      <Ionicons name={focused ? filled : outline} size={22} color={focused ? colors.cobalt : colors.inkMuted} />
    </View>
  );
}

function NewReclamoButton() {
  const router = useRouter();

  return (
    <View style={styles.fabSlot}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Nuevo reclamo"
        onPress={() => router.push('/reclamos/new')}
        pressedScale={0.88}
        style={styles.fab}
      >
        <Ionicons name="add" size={30} color={colors.surface} />
      </PressableScale>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cobalt,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: [styles.tabBar, { bottom: Math.max(insets.bottom, spacing.md) }],
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarAccessibilityLabel: 'Mapa',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} outline="map-outline" filled="map" />,
        }}
      />
      <Tabs.Screen
        name="mine"
        options={{
          title: 'Míos',
          tabBarAccessibilityLabel: 'Mis reclamos',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} outline="document-text-outline" filled="document-text" />
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
          title: 'Barrio',
          tabBarAccessibilityLabel: 'Estadísticas',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} outline="stats-chart-outline" filled="stats-chart" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} outline="person-outline" filled="person" />,
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
  tabBarItem: {
    gap: 2,
  },
  tabBarLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs - 1,
  },
  tabIconWrap: {
    width: 52,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.pill,
    backgroundColor: colors.cobaltSoft,
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    marginTop: -22,
    borderRadius: 29,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.cobalt,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.float,
  },
});
