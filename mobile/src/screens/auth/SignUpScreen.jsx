import React, {useRef, useState} from 'react';
import {
  Animated,
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
import {register} from '../../lib/auth';
import {apiErrorMessage} from '../../lib/api';
import {useAuthStore} from '../../store/authStore';
import {colors, radius, spacing} from '../../theme';

export function SignUpScreen({navigation}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAuthStore(s => s.setUser);

  async function onSubmit() {
    setError('');
    if (!fullName || !email || !password) {
      setError('Naam, email aur password zaroori hain.');
      return;
    }
    if (password.length < 6) {
      setError('Password kam se kam 6 characters ka ho.');
      return;
    }
    setLoading(true);
    try {
      const user = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        phone: phone.trim(),
        agencyName: role === 'agent' ? agencyName.trim() : undefined,
      });
      setUser(user);
    } catch (e) {
      setError(apiErrorMessage(e, 'Sign up failed. Try again.'));
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Choose how you’ll use AUREVIA.</Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={90} style={styles.roleRow}>
            <RoleCard
              emoji="🔍"
              label="Buyer"
              desc="Explore reels, save & post homes"
              active={role === 'user'}
              onPress={() => setRole('user')}
            />
            <RoleCard
              emoji="🏛"
              label="Agent"
              desc="List properties & create reels"
              active={role === 'agent'}
              onPress={() => setRole('agent')}
            />
          </AnimatedEntrance>

          <AnimatedEntrance delay={180} style={styles.form}>
            <Input
              label="FULL NAME"
              icon="👤"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Aapka naam"
            />
            <Input
              label="EMAIL"
              icon="✉"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Input
              label="PHONE (optional)"
              icon="📞"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
            />
            {role === 'agent' ? (
              <Input
                label="AGENCY NAME (optional)"
                icon="🏢"
                value={agencyName}
                onChangeText={setAgencyName}
                placeholder="Your agency"
              />
            ) : null}
            <Input
              label="PASSWORD"
              icon="🔒"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min 6 characters"
              onSubmitEditing={onSubmit}
              returnKeyType="go"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title="Create Account" size="lg" onPress={onSubmit} loading={loading} style={styles.cta} />
            <Text style={styles.terms}>
              By continuing you agree to our Terms & Privacy Policy.
            </Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={280} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
              Sign in
            </Text>
          </AnimatedEntrance>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleCard({emoji, label, desc, active, onPress}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.roleWrap, {transform: [{scale}]}]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, {toValue: 0.97, useNativeDriver: true}).start()}
        onPressOut={() => Animated.spring(scale, {toValue: 1, useNativeDriver: true}).start()}
        style={[styles.roleCard, active && styles.roleCardActive]}>
        <View style={[styles.roleEmojiWrap, active && styles.roleEmojiActive]}>
          <Text style={styles.roleEmoji}>{emoji}</Text>
        </View>
        <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>{label}</Text>
        <Text style={styles.roleDesc}>{desc}</Text>
        {active ? <View style={styles.check}><Text style={styles.checkText}>✓</Text></View> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  glow: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.gold,
    opacity: 0.1,
  },
  scroll: {flexGrow: 1, padding: spacing.lg},
  title: {color: colors.text, fontSize: 28, fontWeight: '700', fontFamily: 'serif', marginTop: spacing.lg},
  subtitle: {color: colors.textMuted, marginTop: spacing.xs},
  roleRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg},
  roleWrap: {flex: 1},
  roleCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 128,
  },
  roleCardActive: {borderColor: colors.gold, backgroundColor: colors.surfaceAlt},
  roleEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white06,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  roleEmojiActive: {backgroundColor: colors.goldFaint},
  roleEmoji: {fontSize: 18},
  roleLabel: {color: colors.text, fontWeight: '700', fontSize: 16},
  roleLabelActive: {color: colors.gold},
  roleDesc: {color: colors.textMuted, fontSize: 12, marginTop: 3, lineHeight: 16},
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {color: colors.bgSoft, fontSize: 12, fontWeight: '800'},
  form: {marginTop: spacing.lg},
  error: {color: colors.danger, marginBottom: spacing.sm, fontSize: 13},
  cta: {marginTop: spacing.xs},
  terms: {color: colors.textMuted, fontSize: 11.5, textAlign: 'center', marginTop: spacing.md, lineHeight: 16},
  footer: {flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg},
  footerText: {color: colors.textMuted},
  link: {color: colors.gold, fontWeight: '700'},
});
