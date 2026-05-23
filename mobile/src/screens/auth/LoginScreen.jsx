import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View} from 'react-native';
import {ScreenContainer} from '../../components/ui/ScreenContainer';
import {Input} from '../../components/ui/Input';
import {Button} from '../../components/ui/Button';
import {login} from '../../lib/auth';
import {apiErrorMessage} from '../../lib/api';
import {useAuthStore} from '../../store/authStore';
import {colors, spacing} from '../../theme';

export function LoginScreen({navigation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore(s => s.setUser);

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Email aur password dono daalein.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      setUser(user); // RootNavigator switch ho jayega.
    } catch (e) {
      Alert.alert('Login failed', apiErrorMessage(e, 'Try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.flex}>
          <Text style={styles.brand}>RealReels</Text>
          <Text style={styles.subtitle}>Properties, reel ki tarah explore karo.</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            <Button title="Login" onPress={onSubmit} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Account nahi hai? </Text>
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('SignUp')}>
              Sign up
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  brand: {color: colors.text, fontSize: 34, fontWeight: '800', marginTop: spacing.xl},
  subtitle: {color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl},
  form: {marginTop: spacing.lg},
  footer: {flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg},
  footerText: {color: colors.textMuted},
  link: {color: colors.primary, fontWeight: '600'},
});
