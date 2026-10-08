import { useEffect, useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Path, TextPath } from 'react-native-svg';
import { fonts } from '../theme';

type RubberStampProps = {
  size?: number;
  color: string;
  curvedText: string;
  centerLines: string[];
};

export default function RubberStamp({ size = 140, color, curvedText, centerLines }: RubberStampProps) {
  const pathId = `stamp-path-${useId()}`;
  const caida = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    caida.value = reducedMotion ? 1 : withDelay(250, withSpring(1, { damping: 9, stiffness: 140 }));
  }, [caida, reducedMotion]);

  const caidaStyle = useAnimatedStyle(() => ({
    opacity: caida.value,
    transform: [{ scale: 1.8 - caida.value * 0.8 }, { rotate: `${-24 + caida.value * 14}deg` }],
  }));
  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const arc = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`;

  return (
    <Animated.View style={[{ width: size, height: size }, caidaStyle]}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray="6 5"
          fill="none"
        />
        <Path id={pathId} d={arc} fill="none" stroke="none" />
        <TextPath href={`#${pathId}`} fill={color} fontSize={size * 0.085} fontFamily={fonts.bodySemiBold}>
          {curvedText}
        </TextPath>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {centerLines.map((line, index) => (
          <Text
            key={line + index}
            style={[
              styles.centerText,
              { color, fontSize: index === 0 ? size * 0.12 : size * 0.07 },
              index === 0 && styles.centerTextBold,
            ]}
          >
            {line}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  centerText: {
    fontFamily: fonts.bodySemiBold,
    textAlign: 'center',
  },
  centerTextBold: {
    fontFamily: fonts.display,
  },
});
