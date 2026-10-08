import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PermissionNotice from '../components/PermissionNotice';
import PressableScale from '../components/PressableScale';
import { useAuth } from '../contexts/AuthContext';
import { DniParseError, parseDniBarcode } from '../lib/dni';
import type { ParsedDni } from '../lib/dni';
import { AuthError } from '../services/auth';
import { colors, fonts, fontSizes, radii, shadows, spacing } from '../theme';

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

        <View style={styles.steps}>
          <View style={[styles.step, styles.stepActive]} />
          <View style={styles.step} />
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
          <View style={styles.cameraStage}>
            <CameraView
              style={styles.preview}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['pdf417'] }}
              onBarcodeScanned={scanned && !scanError ? undefined : handleBarcodeScanned}
            >
              <View style={styles.scanFrame} />
              <View style={styles.hintBox}>
                <Text style={styles.hint}>Encuadrá el código del dorso</Text>
              </View>
            </CameraView>

            {scanError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{scanError}</Text>
                <PressableScale
                  style={styles.retryButton}
                  onPress={handleRetry}
                  accessibilityRole="button"
                >
                  <Text style={styles.retryText}>Volver a escanear</Text>
                </PressableScale>
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

        <View style={styles.steps}>
          <View style={styles.stepDone} />
          <View style={[styles.step, styles.stepActive]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
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

            <PressableScale
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={[styles.button, !canSubmit && styles.buttonDisabled]}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, !canSubmit && styles.buttonTextDisabled]}>
                {submitting ? 'Creando cuenta…' : 'Registrarme'}
              </Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cobalt,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.surface,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: fontSizes.lg,
    color: colors.surface,
  },
  steps: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  step: {
    flex: 1,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  stepActive: {
    backgroundColor: colors.lime,
  },
  stepDone: {
    flex: 1,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  cameraStage: {
    flex: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    ...shadows.float,
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
    backgroundColor: 'rgba(23,32,42,0.76)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  hint: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.surface,
  },
  scanFrame: {
    width: '84%',
    height: 180,
    borderWidth: 2,
    borderColor: colors.lime,
    borderRadius: radii.lg,
  },
  errorBox: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.pinkSoft,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.pinkDeep,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.pink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  retryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.surface,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: spacing.md,
  },
  formCard: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.surface,
    ...shadows.float,
  },
  dniBox: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.limeSoft,
    marginBottom: spacing.sm,
  },
  dniRow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  dniRowSmall: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.limeDeep,
  },
  field: {
    gap: spacing.xs,
  },
  lbl: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
  },
  input: {
    minHeight: 56,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  formErrorBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.pinkSoft,
  },
  formErrorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.pinkDeep,
  },
  link: {
    fontFamily: fonts.bodySemiBold,
    color: colors.cobalt,
  },
  button: {
    minHeight: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.cobalt,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.line,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.surface,
  },
  buttonTextDisabled: {
    color: colors.inkSoft,
  },
});
