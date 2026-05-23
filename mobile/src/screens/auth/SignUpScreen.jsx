import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {ScreenContainer} from '../../components/ui/ScreenContainer';
import {Input} from '../../components/ui/Input';
import {Button} from '../../components/ui/Button';
import {register} from '../../lib/auth';
import {apiErrorMessage} from '../../lib/api';
import {useAuthStore} from '../../store/authStore';
import {colors, radius, spacing} from '../../theme';

export function SignUpScreen({navigation}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore(s => s.setUser);

  async function onSubmit() {
    if (!fullName || !email || !password) {
      Alert.alert('Missing info', 'Saari fields bharein.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password kam se kam 6 characters ka ho.');
      return;
    }
    setLoading(true);
    try {
      const user = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
      });
      setUser(user); // signup ke baad seedha logged-in.
    } catch (e) {
      Alert.alert('Sign up failed', apiErrorMessage(e, 'Try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Create account</Text>

          <View style={styles.roleRow}>
            <RoleCard
              label="I'm a buyer"
              desc="Reels dekho, agents follow karo"
              active={role === 'user'}
              onPress={() => setRole('user')}
            />
            <RoleCard
              label="I'm an agent"
              desc="Reels + properties list karo"
              active={role === 'agent'}
              onPress={() => setRole('agent')}
            />
          </View>

          <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Aapka naam" />
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
            placeholder="Min 6 characters"
          />
          <Button title="Sign up" onPress={onSubmit} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pehle se account hai? </Text>
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
              Login
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function RoleCard({label, desc, active, onPress}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.roleCard, active && styles.roleCardActive]}>
      <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>{label}</Text>
      <Text style={styles.roleDesc}>{desc}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  title: {color: colors.text, fontSize: 28, fontWeight: '800', marginVertical: spacing.lg},
  roleRow: {flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg},
  roleCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleCardActive: {borderColor: colors.primary, backgroundColor: colors.surfaceAlt},
  roleLabel: {color: colors.text, fontWeight: '700', marginBottom: spacing.xs},
  roleLabelActive: {color: colors.primary},
  roleDesc: {color: colors.textMuted, fontSize: 12},
  footer: {flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg},
  footerText: {color: colors.textMuted},
  link: {color: colors.primary, fontWeight: '600'},
});
