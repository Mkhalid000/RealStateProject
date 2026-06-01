import React, {useCallback, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {Input} from '../../components/ui/Input';
import {Button} from '../../components/ui/Button';
import {Icon} from '../../components/ui/Icon';
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {useAuthStore} from '../../store/authStore';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const SUPPORT_EMAIL = 'support@aurevia.app';
const SUPPORT_PHONE = '+12025550147';
const SUPPORT_WHATSAPP = '12025550147';

const CHANNELS = [
  {
    key: 'email',
    icon: 'mail',
    label: 'Email us',
    value: SUPPORT_EMAIL,
    url: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    key: 'call',
    icon: 'phone',
    label: 'Call support',
    value: '+1 (202) 555-0147',
    url: `tel:${SUPPORT_PHONE}`,
  },
  {
    key: 'whatsapp',
    icon: 'message-circle',
    label: 'WhatsApp',
    value: 'Chat with us',
    url: `https://wa.me/${SUPPORT_WHATSAPP}`,
  },
];

const FAQS = [
  {
    q: 'How do I list a property?',
    a: 'Open your Profile and tap “Post a Property”. Fill in the details, add photos, and submit — our team reviews every listing before it goes live.',
  },
  {
    q: 'Why is my listing “Under review”?',
    a: 'Every new listing is checked by our team to keep AUREVIA high-quality and scam-free. Reviews usually finish within 24 hours.',
  },
  {
    q: 'How do I become a verified agent?',
    a: 'Sign up with an Agent account. An administrator verifies your details, after which you can sign in and start posting and creating reels.',
  },
  {
    q: 'How do I save properties?',
    a: 'Tap the heart on any property card or detail screen. Saved homes appear under Profile → Saved on every device you sign in to.',
  },
  {
    q: 'How do I change my profile photo?',
    a: 'Go to Profile and tap the small edit badge on your avatar to pick and upload a new photo instantly.',
  },
];

export function HelpSupportScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const {user} = useAuthStore();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(c.isDark ? 'light-content' : 'dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent');
      }
      return () => {
        if (Platform.OS === 'android') {
          StatusBar.setTranslucent(false);
          StatusBar.setBackgroundColor(c.bg);
        }
      };
    }, [c.isDark, c.bg]),
  );

  async function openChannel(url) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unavailable', 'Could not open this app on your device.');
    }
  }

  async function submit() {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Incomplete', 'Please add a subject and a message.');
      return;
    }
    setSending(true);
    // Free-tier: hand the request off to the user's mail app, pre-filled.
    const body = `${message.trim()}\n\n— ${user?.fullName ?? 'A user'}${
      user?.email ? ` (${user.email})` : ''
    }`;
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject.trim(),
    )}&body=${encodeURIComponent(body)}`;
    try {
      await Linking.openURL(url);
      setSubject('');
      setMessage('');
      Alert.alert('Almost there', 'We’ve opened your mail app to send the message.');
    } catch {
      Alert.alert(
        'No mail app',
        `Please email us directly at ${SUPPORT_EMAIL}.`,
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            hitSlop={10}
            onPress={() => navigation.goBack()}
            style={({pressed}) => [styles.backBtn, pressed && styles.backBtnPressed]}>
            <Icon name="chevron-left" size={22} color={c.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.backBtn} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}>
            {/* Intro */}
            <AnimatedEntrance>
              <View style={styles.intro}>
                <View style={styles.introIcon}>
                  <Icon name="sparkles" size={26} color={c.gold} />
                </View>
                <Text style={styles.introTitle}>How can we help?</Text>
                <Text style={styles.introSub}>
                  We’re here for you. Reach out through any channel below or send
                  us a message — we typically reply within a few hours.
                </Text>
              </View>
            </AnimatedEntrance>

            {/* Contact channels */}
            <AnimatedEntrance delay={80}>
              <SectionLabel>Get in touch</SectionLabel>
              <View style={styles.card}>
                {CHANNELS.map((ch, i) => (
                  <ChannelRow
                    key={ch.key}
                    {...ch}
                    last={i === CHANNELS.length - 1}
                    onPress={() => openChannel(ch.url)}
                  />
                ))}
              </View>
            </AnimatedEntrance>

            {/* FAQ */}
            <AnimatedEntrance delay={140}>
              <SectionLabel>Frequently asked</SectionLabel>
              <View style={styles.card}>
                {FAQS.map((f, i) => (
                  <FaqRow key={f.q} {...f} last={i === FAQS.length - 1} />
                ))}
              </View>
            </AnimatedEntrance>

            {/* Contact form */}
            <AnimatedEntrance delay={200}>
              <SectionLabel>Send us a message</SectionLabel>
              <View style={styles.formCard}>
                <Input
                  label="SUBJECT"
                  icon="tag"
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="What’s it about?"
                />
                <Input
                  label="MESSAGE"
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe your issue or question…"
                  multiline
                  style={styles.messageInput}
                />
                <Button
                  title="Send Message"
                  icon="➤"
                  loading={sending}
                  onPress={submit}
                  style={styles.sendBtn}
                />
                <Text style={styles.formHint}>
                  Or email us directly at {SUPPORT_EMAIL}
                </Text>
              </View>
            </AnimatedEntrance>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function SectionLabel({children}) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function ChannelRow({icon, label, value, last, onPress}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.channelRow,
        last && styles.rowLast,
        pressed && {backgroundColor: c.surfaceAlt},
      ]}>
      <View style={styles.channelIcon}>
        <Icon name={icon} size={20} color={c.gold} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.channelLabel}>{label}</Text>
        <Text style={styles.channelValue}>{value}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={c.textDim} />
    </Pressable>
  );
}

function FaqRow({q, a, last}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;

  function toggle() {
    Animated.timing(rotate, {
      toValue: open ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setOpen(o => !o);
  }

  const spin = rotate.interpolate({inputRange: [0, 1], outputRange: ['0deg', '180deg']});

  return (
    <View style={[styles.faqRow, last && styles.rowLast]}>
      <Pressable onPress={toggle} style={styles.faqHead}>
        <Text style={styles.faqQ}>{q}</Text>
        <Animated.View style={{transform: [{rotate: spin}]}}>
          <Icon name="chevron-down" size={18} color={c.textMuted} />
        </Animated.View>
      </Pressable>
      {open ? <Text style={styles.faqA}>{a}</Text> : null}
    </View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    safe: {flex: 1},
    flex: {flex: 1},
    glow: {
      position: 'absolute',
      top: -80,
      alignSelf: 'center',
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: c.gold,
      opacity: c.isDark ? 0.1 : 0.14,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },
    backBtnPressed: {backgroundColor: c.surfaceAlt},
    headerTitle: {color: c.text, fontSize: 17, fontWeight: '700'},

    scroll: {padding: spacing.md, paddingBottom: spacing.xxl},

    // Intro
    intro: {alignItems: 'center', paddingTop: spacing.sm, paddingHorizontal: spacing.sm},
    introIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.goldFaint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    introTitle: {
      color: c.text,
      fontSize: 24,
      fontWeight: '700',
      fontFamily: 'serif',
    },
    introSub: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
      marginTop: spacing.sm,
    },

    sectionLabel: {
      color: c.textDim,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },

    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      overflow: 'hidden',
    },
    rowLast: {borderBottomWidth: 0},

    // Channel rows
    channelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    channelIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.goldFaint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    channelLabel: {color: c.text, fontSize: 15, fontWeight: '600'},
    channelValue: {color: c.textMuted, fontSize: 12.5, marginTop: 2},

    // FAQ
    faqRow: {
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    faqHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    faqQ: {flex: 1, color: c.text, fontSize: 14.5, fontWeight: '600', lineHeight: 20},
    faqA: {
      color: c.textMuted,
      fontSize: 13.5,
      lineHeight: 20,
      paddingBottom: spacing.md,
      paddingRight: spacing.md,
    },

    // Form
    formCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      padding: spacing.md,
    },
    messageInput: {minHeight: 96},
    sendBtn: {marginTop: spacing.xs},
    formHint: {
      color: c.textMuted,
      fontSize: 12,
      textAlign: 'center',
      marginTop: spacing.md,
    },
  });
