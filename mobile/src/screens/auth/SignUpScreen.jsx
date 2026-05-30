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
import {Icon} from '../../components/ui/Icon';
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
          showsVerticalScrollIndicator={false}>
          <AnimatedEntrance style={styles.headerBlock}>
            <Logo width={148} align="left" />
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Choose how you’ll use AUREVIA.</Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={110} style={styles.roleRow}>
            <RoleCard
              icon="search"
              label="Buyer"
              desc="Explore reels, save & post homes"
              active={role === 'user'}
              onPress={() => setRole('user')}
            />
            <RoleCard
              icon="briefcase"
              label="Agent"
              desc="List properties & create reels"
              active={role === 'agent'}
              onPress={() => setRole('agent')}
            />
          </AnimatedEntrance>

          <AnimatedEntrance delay={200} style={styles.form}>
            <Input
              label="FULL NAME"
              icon="user"
              value={fullName}
              onChangeText={setFullName}
              textContentType="name"
              placeholder="Aapka naam"
            />
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
            />
            <Input
              label="PHONE (OPTIONAL)"
              icon="phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
            />
            {role === 'agent' ? (
              <Input
                label="AGENCY NAME (OPTIONAL)"
                icon="building"
                value={agencyName}
                onChangeText={setAgencyName}
                placeholder="Your agency"
              />
            ) : null}
            <Input
              label="PASSWORD"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              placeholder="Min 6 characters"
              onSubmitEditing={onSubmit}
              returnKeyType="go"
            />

            {error ? (
              <View style={styles.errorBox}>
                <Icon name="lock" size={15} color={colors.danger} />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <Button title="Create Account" size="lg" onPress={onSubmit} loading={loading} style={styles.cta} />
            <Text style={styles.terms}>
              By continuing you agree to our Terms & Privacy Policy.
            </Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={300} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable hitSlop={6} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign in</Text>
            </Pressable>
          </AnimatedEntrance>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleCard({icon, label, desc, active, onPress}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.roleWrap, {transform: [{scale}]}]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, {toValue: 0.97, useNativeDriver: true}).start()}
        onPressOut={() => Animated.spring(scale, {toValue: 1, useNativeDriver: true}).start()}
        style={[styles.roleCard, active && styles.roleCardActive]}>
        <View style={[styles.roleIconWrap, active && styles.roleIconActive]}>
          <Icon name={icon} size={20} color={active ? colors.gold : colors.textDim} />
        </View>
        <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>{label}</Text>
        <Text style={styles.roleDesc}>{desc}</Text>
        {active ? (
          <View style={styles.check}>
            <Icon name="check" size={13} color={colors.bgSoft} strokeWidth={2.6} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  glow: {
    position: 'absolute',
    top: -140,
    left: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.gold,
    opacity: 0.09,
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
  title: {color: colors.text, fontSize: 28, fontWeight: '700', fontFamily: 'serif', marginTop: spacing.lg},
  subtitle: {color: colors.textMuted, marginTop: spacing.xs, fontSize: 14},
  roleRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg},
  roleWrap: {flex: 1},
  roleCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 132,
  },
  roleCardActive: {borderColor: colors.gold, backgroundColor: colors.surfaceAlt},
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white06,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  roleIconActive: {backgroundColor: colors.goldFaint},
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
  form: {marginTop: spacing.lg},
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
  terms: {color: colors.textMuted, fontSize: 11.5, textAlign: 'center', marginTop: spacing.md, lineHeight: 16},
  footer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg},
  footerText: {color: colors.textMuted, fontSize: 14},
  link: {color: colors.gold, fontWeight: '700', fontSize: 14},
});
