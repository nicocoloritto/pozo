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
import PressableScale from '../components/PressableScale';
import { useAuth } from '../contexts/AuthContext';
import { AuthError } from '../services/auth';
import { colors, fonts, fontSizes, radii, shadows, spacing } from '../theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [offerRegister, setOfferRegister] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = EMAIL_PATTERN.test(email) && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setOfferRegister(false);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
        setOfferRegister(err.code === 'EMAIL_NOT_FOUND');
      } else {
        setError('No se pudo iniciar sesión. Probá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <View style={styles.brandOrb} />
            <Text style={styles.logo}>
              POZO<Text style={styles.logoDot}>.</Text>
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.headline}>Ingresar</Text>

            <View style={styles.field}>
              <Text style={styles.lbl}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
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
                  setError(null);
                }}
                placeholder="••••••"
                placeholderTextColor={colors.inkSoft}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                {offerRegister && (
                  <Pressable onPress={() => router.push('/register')}>
                    <Text style={styles.link}>Crear cuenta</Text>
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
                {submitting ? 'Ingresando…' : 'Ingresar'}
              </Text>
            </PressableScale>

            <Pressable onPress={() => router.push('/register')} style={styles.footer}>
              <Text style={styles.footerText}>
                ¿No tenés cuenta? <Text style={styles.link}>Crear cuenta</Text>
              </Text>
            </Pressable>
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
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: spacing.xl,
  },
  brandBlock: {
    flex: 1,
    minHeight: 220,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  brandOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -42,
    top: 4,
    backgroundColor: colors.mandarin,
  },
  logo: {
    fontFamily: fonts.display,
    fontSize: 54,
    color: colors.surface,
  },
  logoDot: {
    color: colors.lime,
  },
  formCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.surface,
    ...shadows.float,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.ink,
    marginBottom: spacing.xs,
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
  errorBox: {
    gap: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.pinkSoft,
    padding: spacing.md,
  },
  errorText: {
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
    color: colors.inkMuted,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
  },
});
