import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
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
  const [pendingMsg, setPendingMsg] = useState('');
  const [countdown, setCountdown] = useState(10);
  const setUser = useAuthStore(s => s.setUser);

  const goToLogin = () => navigation.navigate('Login');

  // Agent pending: har second countdown ghatao, 0 par Login par wapas.
  useEffect(() => {
    if (!pendingMsg) {
      return;
    }
    if (countdown <= 0) {
      goToLogin();
      return;
    }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMsg, countdown]);

  async function onSubmit() {
    setError('');
    if (!fullName || !email || !phone || !password) {
      setError('Name, email, phone and password are required.');
      return;
    }
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const result = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        phone: phone.trim(),
        agencyName: role === 'agent' ? agencyName.trim() : undefined,
      });
      if (result?.pendingVerification) {
        // Agent account approval pending — login na karo, message dikhao.
        setCountdown(10);
        setPendingMsg(
          result.message ||
            'Your account is pending admin verification. You can sign in once it is approved.',
        );
        return;
      }
      setUser(result);
    } catch (e) {
      setError(apiErrorMessage(e, 'Sign up failed. Try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (pendingMsg) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.glow} />
        <View style={styles.glowBottom} />
        <View style={styles.pendingWrap}>
          <AnimatedEntrance style={styles.overlayCard} offset={10}>
            <Pressable
              style={styles.closeBtn}
              hitSlop={10}
              onPress={goToLogin}>
              <Icon name="x" size={18} color={colors.textMuted} strokeWidth={2.2} />
            </Pressable>
            <View style={styles.overlayIcon}>
              <Icon name="check" size={30} color={colors.gold} strokeWidth={2.4} />
            </View>
            <Text style={styles.overlayTitle}>Account Created</Text>
            <Text style={styles.overlayText}>{pendingMsg}</Text>
            <Text style={styles.overlayHint}>
              Redirecting to sign in in {countdown}s
            </Text>
          </AnimatedEntrance>
        </View>
      </SafeAreaView>
    );
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
          showsVerticalScrollIndicator={false}>
          <AnimatedEntrance style={styles.headerBlock}>
            <View style={styles.brandRow}>
              <Logo width={132} align="left" />
            </View>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>JOIN AUREVIA</Text>
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Set up your profile to unlock a curated world of premium
              properties.
            </Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={110} style={styles.roleSection}>
            <Text style={styles.sectionLabel}>I'M JOINING AS</Text>
            <View style={styles.roleRow}>
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
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance delay={200} style={styles.card}>
            <Input
              compact
              containerStyle={styles.inputGap}
              label="FULL NAME"
              icon="user"
              value={fullName}
              onChangeText={setFullName}
              textContentType="name"
              placeholder="Your full name"
            />
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
            />
            <Input
              compact
              containerStyle={styles.inputGap}
              label="PHONE"
              icon="phone"
              value={phone}
              onChangeText={t => setPhone(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="10-digit mobile number"
            />
            {role === 'agent' ? (
              <Input
                compact
                containerStyle={styles.inputGap}
                label="AGENCY NAME (OPTIONAL)"
                icon="building"
                value={agencyName}
                onChangeText={setAgencyName}
                placeholder="Your agency"
              />
            ) : null}
            <Input
              compact
              containerStyle={styles.inputGap}
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

            <Button
              title="Create Account"
              size="lg"
              onPress={onSubmit}
              loading={loading}
              style={styles.cta}
            />
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
        onPressIn={() =>
          Animated.spring(scale, {toValue: 0.97, useNativeDriver: true}).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {toValue: 1, useNativeDriver: true}).start()
        }
        style={[styles.roleCard, active && styles.roleCardActive]}>
        <View style={styles.roleHead}>
          <View style={[styles.roleIconWrap, active && styles.roleIconActive]}>
            <Icon name={icon} size={18} color={active ? colors.gold : colors.textDim} />
          </View>
          <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>
            {label}
          </Text>
        </View>
        <Text style={styles.roleDesc}>{desc}</Text>
      </Pressable>
    </Animated.View>
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
  badgeDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold},
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
    maxWidth: '94%',
  },
  roleSection: {marginTop: spacing.lg},
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  roleRow: {flexDirection: 'row', gap: spacing.sm},
  roleWrap: {flex: 1},
  roleCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 96,
  },
  roleCardActive: {borderColor: colors.gold, backgroundColor: colors.surfaceAlt},
  roleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  roleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.white06,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconActive: {backgroundColor: colors.goldFaint},
  roleLabel: {color: colors.text, fontWeight: '700', fontSize: 15},
  roleLabelActive: {color: colors.gold},
  roleDesc: {color: colors.textMuted, fontSize: 12, lineHeight: 16},
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  inputGap: {marginBottom: spacing.sm + 4},
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
  terms: {
    color: colors.textMuted,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {color: colors.textMuted, fontSize: 14},
  link: {color: colors.gold, fontWeight: '700', fontSize: 14},
  pendingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white06,
    zIndex: 2,
  },
  overlayIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: 'rgba(201,161,74,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  overlayTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'serif',
    marginBottom: spacing.sm,
  },
  overlayText: {
    color: colors.textDim,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  overlayHint: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.md,
  },
});
