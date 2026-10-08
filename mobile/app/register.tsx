import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PermissionNotice from '../components/PermissionNotice';
import { useAuth } from '../contexts/AuthContext';
import { DniParseError, parseDniBarcode } from '../lib/dni';
import type { ParsedDni } from '../lib/dni';
import { AuthError } from '../services/auth';
import { colors, fonts, fontSizes, spacing } from '../theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function Register() {
  const router = useRouter();
  const { registrar } = useAuth();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [dni, setDni] = useState<ParsedDni | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [offerLogin, setOfferLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleBarcodeScanned({ data }: BarcodeScanningResult) {
    if (scanned) return;
    setScanned(true);
    try {
      setDni(parseDniBarcode(data));
      setScanError(null);
    } catch (err) {
      setScanError(
        err instanceof DniParseError
          ? err.message
          : 'No se pudo leer el DNI. Probá escanear de nuevo.'
      );
    }
  }

  function handleRetry() {
    setScanned(false);
    setScanError(null);
  }

  const canSubmit =
    EMAIL_PATTERN.test(email) && password.length >= MIN_PASSWORD_LENGTH && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !dni) return;
    setSubmitting(true);
    setFormError(null);
    setOfferLogin(false);
    try {
      await registrar({
        firstName: dni.firstName,
        lastName: dni.lastName,
        sex: dni.sex,
        documentNumber: dni.documentNumber,
        birthDate: dni.birthDate,
        email: email.trim(),
        password,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        setFormError(err.message);
        setOfferLogin(err.code === 'EMAIL_TAKEN');
      } else {
        setFormError('No se pudo crear la cuenta. Probá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!dni) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scanHeader}>
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.cancel}>Cancelar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Escaneá tu DNI</Text>
          <View style={styles.headerSpacer} />
        </View>

        {!cameraPermission ? (
          <View style={styles.flex} />
        ) : !cameraPermission.granted ? (
          <PermissionNotice
            title="Sin acceso a la cámara"
            message="Necesitamos la cámara para leer el código del dorso de tu DNI y completar tus datos automáticamente. Sin este permiso no podés registrarte."
            onRetry={requestCameraPermission}
          />
        ) : (
          <View style={styles.camera}>
            <CameraView
              style={styles.preview}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['pdf417'] }}
              onBarcodeScanned={scanned && !scanError ? undefined : handleBarcodeScanned}
            >
              <View style={styles.hintBox}>
                <Text style={styles.hint}>ENCUADRÁ EL CÓDIGO DEL DORSO</Text>
              </View>
            </CameraView>

            {scanError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{scanError}</Text>
                <Pressable
                  style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                  onPress={handleRetry}
                >
                  <Text style={styles.retryText}>Volver a escanear</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.formHeader}>
          <Pressable onPress={() => setDni(null)}>
            <Text style={styles.cancel}>Volver</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Completá tu cuenta</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.dniBox}>
            <Text style={styles.dniRow}>
              {dni.firstName} {dni.lastName}
            </Text>
            <Text style={styles.dniRowSmall}>
              DNI {dni.documentNumber} · {dni.sex} · Nacimiento {dni.birthDate}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.lbl}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setFormError(null);
              }}
              placeholder="tu@email.com"
              placeholderTextColor={colors.inkSoft}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.lbl}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setFormError(null);
              }}
              placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
              placeholderTextColor={colors.inkSoft}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {formError && (
            <View style={styles.formErrorBox}>
              <Text style={styles.formErrorText}>{formError}</Text>
              {offerLogin && (
                <Pressable onPress={() => router.replace('/login')}>
                  <Text style={styles.link}>Ir a iniciar sesión</Text>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
          >
            <Text style={[styles.buttonText, !canSubmit && styles.buttonTextDisabled]}>
              {submitting ? 'Creando cuenta…' : 'Registrarme'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  flex: {
    flex: 1,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  headerSpacer: {
    width: 56,
  },
  cancel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  headerTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.bg,
  },
  camera: {
    flex: 1,
  },
  preview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBox: {
    position: 'absolute',
    bottom: spacing.xl,
    alignItems: 'center',
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  errorBox: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.inkRaised,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.coral,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.mango,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  retryText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.mango,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  dniBox: {
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.inkRaised,
    marginBottom: spacing.sm,
  },
  dniRow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.bg,
  },
  dniRowSmall: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  field: {
    gap: spacing.xs,
  },
  lbl: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  input: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  formErrorBox: {
    gap: spacing.xs,
  },
  formErrorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.coral,
  },
  link: {
    fontFamily: fonts.bodySemiBold,
    color: colors.mango,
  },
  button: {
    backgroundColor: colors.mango,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.inkRaised,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  buttonTextDisabled: {
    color: colors.inkSoft,
  },
});
