import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryIcons, categoryLabels } from '../constants/categories';
import type { Categoria } from '../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../theme';

type CategoryChipProps = {
  category: Categoria;
  selected?: boolean;
  onPress?: () => void;
};

// Road-sign rombo used both as a picker (Nuevo reclamo, design/figma/04) and as a
// read-only badge (report cards, detail screen). Pass `onPress` to make it a picker.
export default function CategoryChip({ category, selected = false, onPress }: CategoryChipProps) {
  const content = (
    <View style={[styles.rombo, selected && styles.romboSelected]}>
      <Ionicons
        name={categoryIcons[category]}
        size={22}
        color={selected ? colors.ink : colors.mango}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={categoryLabels[category]}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      <Text style={styles.label} numberOfLines={1}>
        {categoryLabels[category]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 72,
  },
  rombo: {
    width: 56,
    height: 56,
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.mango,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  romboSelected: {
    backgroundColor: colors.mango,
    borderColor: colors.mango,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
