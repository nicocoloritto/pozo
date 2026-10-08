import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResetDatosButton from '../../components/ResetDatosButton';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, fontSizes, spacing } from '../../theme';

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
      <View style={styles.header}>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarText}>{iniciales}</Text>
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
