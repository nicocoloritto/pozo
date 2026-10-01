import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { DimensionValue } from 'react-native';
import { colors } from '../theme';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  style?: object;
};

// Shimmer placeholder for list rows and cards while data loads. Plain `Animated` +
// `useNativeDriver: true` (only `opacity`), no reanimated needed for something this
// simple.
export default function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

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
    backgroundColor: colors.concreteLight,
  },
});
