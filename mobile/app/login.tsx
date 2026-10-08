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
import { useAuth } from '../contexts/AuthContext';
import { AuthError } from '../services/auth';
import { colors, fonts, fontSizes, spacing } from '../theme';

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
        <View style={styles.content}>
          <Text style={styles.logo}>
            POZO<Text style={styles.logoDot}>.</Text>
          </Text>
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

          <Pressable
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
          >
            <Text style={[styles.buttonText, !canSubmit && styles.buttonTextDisabled]}>
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push('/register')} style={styles.footer}>
            <Text style={styles.footerText}>
              ¿No tenés cuenta? <Text style={styles.link}>Crear cuenta</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  logo: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.bg,
  },
  logoDot: {
    color: colors.mango,
  },
  headline: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
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
  errorBox: {
    gap: spacing.xs,
  },
  errorText: {
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
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
});
