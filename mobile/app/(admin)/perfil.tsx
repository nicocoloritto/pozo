import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import municipios from '../../data/municipios.json';
import ResetDatosButton from '../../components/ResetDatosButton';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, fontSizes, spacing } from '../../theme';

type DatoProps = { etiqueta: string; valor: string };

function Dato({ etiqueta, valor }: DatoProps) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

export default function PerfilAdminScreen() {
  const { user, cerrarSesion } = useAuth();

  if (!user || user.rol !== 'admin') return null;

  const municipio = municipios.find((item) => item.id === user.municipioId);
  const iniciales = user.firstName.slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarText}>{iniciales}</Text>
        </View>
        <Text style={styles.nombre}>{user.firstName}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Datos</Text>
        <View style={styles.card}>
          <Dato etiqueta="Admin" valor={user.firstName} />
          <Dato etiqueta="Email" valor={user.email} />
          <Dato etiqueta="Municipio" valor={municipio?.nombre ?? user.municipioId} />
          <Dato etiqueta="Sigla" valor={municipio?.sigla ?? '—'} />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        onPress={cerrarSesion}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
      >
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </Pressable>
      <ResetDatosButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xl,
    backgroundColor: colors.ink,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.mango,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  nombre: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.bg,
  },
  email: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginBottom: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inkSoft,
  },
  dato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  datoEtiqueta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  datoValor: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  logoutButton: {
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.coral,
    padding: spacing.md,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  logoutButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.coral,
  },
});
