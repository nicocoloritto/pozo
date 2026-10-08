import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { colors, radii } from '../theme';

type ProgressBarProps = {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
};

export default function ProgressBar({
  value,
  color = colors.cobalt,
  trackColor = colors.surfaceAlt,
  height = 12,
}: ProgressBarProps) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const destino = Math.min(1, Math.max(0, value));
    progress.value = reducedMotion
      ? destino
      : withDelay(150, withTiming(destino, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [value, progress, reducedMotion]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}>
      <Animated.View style={[styles.fill, { borderRadius: height / 2, backgroundColor: color }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
