import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressableScale from '../../components/PressableScale';
import ResetDatosButton from '../../components/ResetDatosButton';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, fontSizes, radii, shadows, spacing } from '../../theme';

// Enmascara el DNI dejando solo los últimos 3 dígitos visibles: **.***.123.
function enmascararDni(documentNumber: string): string {
  const digitos = documentNumber.replace(/\D/g, '');
  if (digitos.length <= 3) return documentNumber;
  const visibles = digitos.slice(-3);
  return `**.***.${visibles}`;
}

type DatoProps = { etiqueta: string; valor: string };

function Dato({ etiqueta, valor }: DatoProps) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, cerrarSesion } = useAuth();

  if (!user || user.rol !== 'vecino') return null;

  const iniciales = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarHalo}>
            <View style={styles.avatar} accessibilityElementsHidden>
              <Text style={styles.avatarText}>{iniciales}</Text>
            </View>
          </View>
          <Text style={styles.nombre}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          <View style={styles.card}>
            <Dato etiqueta="Nombre" valor={user.firstName} />
            <Dato etiqueta="Apellido" valor={user.lastName} />
            <Dato etiqueta="DNI" valor={enmascararDni(user.documentNumber)} />
            <Dato etiqueta="Fecha de nacimiento" valor={user.birthDate} />
            <Dato etiqueta="Email" valor={user.email} />
            <Dato etiqueta="Barrio" valor={user.neighborhood ?? 'Sin especificar'} />
          </View>
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={cerrarSesion}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </PressableScale>
        <ResetDatosButton />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    backgroundColor: colors.cobalt,
  },
  avatarHalo: {
    padding: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  nombre: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.surface,
  },
  email: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.surface,
  },
  body: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: fontSizes.lg,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  card: {
    gap: spacing.xs,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    ...shadows.card,
  },
  dato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  datoEtiqueta: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
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
    borderColor: colors.pink,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  logoutButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.pinkDeep,
  },
});
