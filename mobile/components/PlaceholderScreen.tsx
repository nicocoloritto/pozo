import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type PlaceholderScreenProps = {
  title: string;
  subtitle?: string;
  dark?: boolean;
};

// Temporary body for screens that are not built yet. Delete it as each screen lands.
export default function PlaceholderScreen({ title, subtitle, dark = false }: PlaceholderScreenProps) {
  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.chalk,
  },
  containerDark: {
    backgroundColor: colors.asphalt,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.asphalt,
    textAlign: 'center',
  },
  titleDark: {
    color: colors.chalk,
  },
  subtitle: {
    fontSize: 13,
    color: colors.concrete,
    textAlign: 'center',
  },
});
