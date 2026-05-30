import React, {useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Input} from '../../components/ui/Input';
import {Button} from '../../components/ui/Button';
import {Logo} from '../../components/ui/Logo';
import {Icon} from '../../components/ui/Icon';
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {login} from '../../lib/auth';
import {apiErrorMessage} from '../../lib/api';
import {useAuthStore} from '../../store/authStore';
import {colors, radius, spacing} from '../../theme';

export function LoginScreen({navigation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAuthStore(s => s.setUser);

  async function onSubmit() {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      setUser(user); // RootNavigator switch ho jayega.
    } catch (e) {
      setError(apiErrorMessage(e, 'Login failed. Try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.glow} />
      <View style={styles.glowBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <AnimatedEntrance style={styles.headerBlock}>
            <View style={styles.brandRow}>
              <Logo width={132} align="left" />
            </View>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>MEMBER ACCESS</Text>
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue exploring an exclusive collection of premium
              residences.
            </Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={120} style={styles.card}>
            <Input
              compact
              containerStyle={styles.inputGap}
              label="EMAIL ADDRESS"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              returnKeyType="next"
            />
            <Input
              compact
              containerStyle={styles.inputGap}
              label="PASSWORD"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              placeholder="Enter your password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
            />

            <Pressable hitSlop={8} style={styles.forgot}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {error ? (
              <View style={styles.errorBox}>
                <Icon name="lock" size={15} color={colors.danger} />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="Sign In"
              size="lg"
              onPress={onSubmit}
              loading={loading}
              style={styles.cta}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>SECURE LOGIN</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.trustRow}>
              <Icon name="lock" size={13} color={colors.textMuted} />
              <Text style={styles.trustText}>
                Your data is protected with end-to-end encryption.
              </Text>
            </View>
          </AnimatedEntrance>

          <View style={styles.spacer} />

          <AnimatedEntrance delay={220} style={styles.footer}>
            <Text style={styles.footerText}>New to AUREVIA? </Text>
            <Pressable hitSlop={6} onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
          </AnimatedEntrance>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  glow: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.gold,
    opacity: 0.12,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -160,
    left: -110,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.gold,
    opacity: 0.06,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerBlock: {marginTop: spacing.lg},
  brandRow: {marginBottom: spacing.lg},
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    backgroundColor: 'rgba(201,161,74,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,161,74,0.28)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  badgeText: {
    color: colors.goldLight,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    fontFamily: 'serif',
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '92%',
  },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  inputGap: {marginBottom: spacing.sm + 4},
  forgot: {alignSelf: 'flex-end', marginTop: 2, marginBottom: spacing.md},
  forgotText: {color: colors.gold, fontSize: 13, fontWeight: '600'},
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,107,107,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,107,107,0.3)',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  error: {color: colors.danger, fontSize: 11.5, lineHeight: 16, flex: 1},
  cta: {marginTop: spacing.xs},
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  divider: {flex: 1, height: 1, backgroundColor: colors.border},
  dividerText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: spacing.md,
  },
  trustText: {color: colors.textMuted, fontSize: 12, lineHeight: 17},
  spacer: {flex: 1, minHeight: spacing.md},
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  footerText: {color: colors.textMuted, fontSize: 14},
  link: {color: colors.gold, fontWeight: '700', fontSize: 14},
});
