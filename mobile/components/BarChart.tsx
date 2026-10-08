import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, fonts, spacing } from '../theme';

export type BarChartDatum = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarChartDatum[];
  color?: string;
  height?: number;
};

// Gráfico de barras simple con react-native-svg (sin librerías de charts): usado para
// reclamos por categoría y la evolución mensual en Estadísticas.
export default function BarChart({ data, color = colors.cobalt, height = 140 }: BarChartProps) {
  const [width, setWidth] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const gap = 8;
  const barWidth = width > 0 ? (width - gap * (data.length - 1)) / data.length : 0;

  return (
    <View onLayout={handleLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {data.map((d, index) => {
            const barHeight = Math.max(2, (d.value / max) * (height - 20));
            const x = index * (barWidth + gap);
            const y = height - 20 - barHeight;
            return (
              <Rect key={d.label} x={x} y={y} width={barWidth} height={barHeight} fill={color} rx={8} />
            );
          })}
        </Svg>
      )}
      <View style={styles.labelsRow}>
        {data.map((d) => (
          <Text key={d.label} style={[styles.label, { width: barWidth || undefined, flex: width ? undefined : 1 }]} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xs,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    textAlign: 'center',
    color: colors.inkSoft,
  },
});
