import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import PressableScale from './PressableScale';
import { categoryIcons, categoryLabels, categoryTints } from '../constants/categories';
import type { Categoria } from '../types/reclamo';
import { colors, fonts, fontSizes, radii, spacing } from '../theme';

type CategoryChipProps = {
  category: Categoria;
  selected?: boolean;
  onPress?: () => void;
  // Sin etiqueta debajo: para tarjetas, donde el nombre ya está en el título.
  compact?: boolean;
};

// Ícono de categoría en un cuadrado redondeado con el color de su familia. Con
// `onPress` funciona como selector (Nuevo reclamo): al elegirlo se llena del tono vivo
// y salta con un resorte.
export default function CategoryChip({ category, selected = false, onPress, compact = false }: CategoryChipProps) {
  const tint = categoryTints[category];
  const pop = useSharedValue(1);

  useEffect(() => {
    if (!selected) return;
    pop.value = 0.85;
    pop.value = withSpring(1, { damping: 8, stiffness: 260 });
  }, [selected, pop]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const tile = (
    <Animated.View
      style={[
        styles.tile,
        compact && styles.tileCompact,
        { backgroundColor: selected ? tint.base : tint.soft },
        popStyle,
      ]}
    >
      <Ionicons name={categoryIcons[category]} size={compact ? 20 : 24} color={selected ? colors.surface : tint.deep} />
    </Animated.View>
  );

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {onPress ? (
        <PressableScale
          onPress={onPress}
          pressedScale={0.88}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={categoryLabels[category]}
        >
          {tile}
        </PressableScale>
      ) : (
        tile
      )}
      {!compact && (
        <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
          {categoryLabels[category]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 76,
  },
  containerCompact: {
    width: undefined,
  },
  tile: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCompact: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs + 1,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  labelSelected: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
});
