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
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {login} from '../../lib/auth';
import {apiErrorMessage} from '../../lib/api';
import {useAuthStore} from '../../store/authStore';
import {colors, spacing} from '../../theme';

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
    <SafeAreaView style={styles.root}>
      <View style={styles.glow} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AnimatedEntrance>
            <Logo width={150} align="left" />
          </AnimatedEntrance>

          <AnimatedEntrance delay={90}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue exploring premium properties.
            </Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={180} style={styles.form}>
            <Input
              label="EMAIL"
              icon="✉"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              returnKeyType="next"
            />
            <Input
              label="PASSWORD"
              icon="🔒"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
            />

            <Pressable hitSlop={8} style={styles.forgot}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title="Sign In" size="lg" onPress={onSubmit} loading={loading} style={styles.cta} />
          </AnimatedEntrance>

          <AnimatedEntrance delay={280} style={styles.footer}>
            <Text style={styles.footerText}>New to AUREVIA? </Text>
            <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
              Create account
            </Text>
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
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.gold,
    opacity: 0.12,
  },
  scroll: {flexGrow: 1, padding: spacing.lg, justifyContent: 'center'},
  title: {color: colors.text, fontSize: 32, fontWeight: '700', fontFamily: 'serif', marginTop: spacing.xl},
  subtitle: {color: colors.textMuted, marginTop: spacing.xs, fontSize: 14.5, lineHeight: 20},
  form: {marginTop: spacing.xl},
  forgot: {alignSelf: 'flex-end', marginTop: 2, marginBottom: spacing.md},
  forgotText: {color: colors.gold, fontSize: 13, fontWeight: '600'},
  error: {color: colors.danger, marginBottom: spacing.sm, fontSize: 13},
  cta: {marginTop: spacing.xs},
  footer: {flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl},
  footerText: {color: colors.textMuted},
  link: {color: colors.gold, fontWeight: '700'},
});
