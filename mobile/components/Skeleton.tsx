import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { DimensionValue } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { colors, radii } from '../theme';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  style?: object;
};

export default function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.65);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      style={[styles.base, { width, height, opacity }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.line,
    borderRadius: radii.sm,
  },
});
