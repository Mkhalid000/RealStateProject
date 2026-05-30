import React, {useState} from 'react';
import {
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
      setError('Email aur password dono daalein.');
      return;
    }
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

      <Pressable style={styles.back} hitSlop={10} onPress={() => navigation.goBack()}>
        <Icon name="chevron-left" size={22} color={colors.text} />
      </Pressable>

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
            <Logo width={148} align="left" />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue exploring premium properties.
            </Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={120} style={styles.form}>
            <Input
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

            <Button title="Sign In" size="lg" onPress={onSubmit} loading={loading} style={styles.cta} />
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
    top: -140,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.gold,
    opacity: 0.1,
  },
  back: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.md,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scroll: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg},
  headerBlock: {marginTop: 72},
  title: {color: colors.text, fontSize: 34, fontWeight: '700', fontFamily: 'serif', marginTop: spacing.xl},
  subtitle: {color: colors.textMuted, marginTop: spacing.xs, fontSize: 14.5, lineHeight: 21},
  form: {marginTop: spacing.xl},
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
  error: {color: colors.danger, fontSize: 13, flex: 1},
  cta: {marginTop: spacing.xs},
  spacer: {flex: 1, minHeight: spacing.xl},
  footer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: spacing.lg},
  footerText: {color: colors.textMuted, fontSize: 14},
  link: {color: colors.gold, fontWeight: '700', fontSize: 14},
});
