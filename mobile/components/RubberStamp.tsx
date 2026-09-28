import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, TextPath } from 'react-native-svg';
import { fonts } from '../theme';

type RubberStampProps = {
  size?: number;
  color: string;
  curvedText: string;
  centerLines: string[];
};

// The "sello" motif from design/figma/03-detalle.png and 04c-reclamo-publicado.png: a
// dashed circle with text curving along the top and a bold label centered inside.
// Uses react-native-svg's TextPath, which is the only way to bend text along an arc
// in React Native — there's no CSS text-on-a-path equivalent.
export default function RubberStamp({ size = 140, color, curvedText, centerLines }: RubberStampProps) {
  const pathId = `stamp-path-${useId()}`;
  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  // Half-circle arc from 9 o'clock to 3 o'clock, going over the top — this is what the
  // curved text follows.
  const arc = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`;

  return (
    <View style={{ width: size, height: size }}>
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
        <TextPath href={`#${pathId}`} fill={color} fontSize={size * 0.085} fontFamily={fonts.monoSemiBold}>
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
    </View>
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
    fontFamily: fonts.mono,
    textAlign: 'center',
  },
  centerTextBold: {
    fontFamily: fonts.display,
  },
});
