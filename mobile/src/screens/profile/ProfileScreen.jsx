import React, {useCallback, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {Avatar} from '../../components/ui/Avatar';
import {Badge} from '../../components/ui/Badge';
import {Button} from '../../components/ui/Button';
import {Icon} from '../../components/ui/Icon';
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {useAuthStore} from '../../store/authStore';
import {useSavedStore} from '../../store/savedStore';
import {useThemeStore} from '../../store/themeStore';
import {useMyProperties} from '../../hooks/useProperties';
import {logout} from '../../lib/auth';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const ROLE_LABEL = {agent: 'Agent', admin: 'Admin', user: 'Member'};

export function ProfileScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const {user, reset} = useAuthStore();
  const savedCount = useSavedStore(s => s.items.length);
  const {data: mine} = useMyProperties('all');
  const [loading, setLoading] = useState(false);

  const myListings = mine?.items ?? [];
  const liveCount = myListings.filter(p => p.verificationStatus === 'verified').length;
  const isAgent = user?.role === 'agent';

  function confirmSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign out', style: 'destructive', onPress: doSignOut},
    ]);
  }

  async function doSignOut() {
    setLoading(true);
    try {
      await logout();
      reset();
    } catch (e) {
      Alert.alert('Error', e.message ?? 'Sign out failed.');
    } finally {
      setLoading(false);
    }
  }

  const soon = (what) => Alert.alert('Coming soon', `${what} is on its way.`);

  // Make the status bar translucent while this screen is focused so the gold
  // glow can bleed up behind it; restore the solid bar on blur.
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

  // Glow reacts to scroll: at rest it bleeds up into the status-bar area, then
  // gently fades + parallax-shifts away as the list scrolls — all native-driven
  // so it stays buttery smooth.
  const scrollY = useRef(new Animated.Value(0)).current;
  const goldOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [c.isDark ? 0.16 : 0.2, 0],
    extrapolate: 'clamp',
  });
  const coolOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [c.isDark ? 0.08 : 0.1, 0],
    extrapolate: 'clamp',
  });
  const glowShift = scrollY.interpolate({
    inputRange: [-160, 0, 240],
    outputRange: [60, 0, -50],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      {/* Ambient premium background — bleeds into the status bar, fades on scroll */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowGold,
          {opacity: goldOpacity, transform: [{translateY: glowShift}]},
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowCool,
          {opacity: coolOpacity, transform: [{translateY: glowShift}]},
        ]}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {y: scrollY}}}],
            {useNativeDriver: true},
          )}>
        {/* ---------- Hero ---------- */}
        <AnimatedEntrance>
          <View style={styles.hero}>
            <Pressable
              hitSlop={10}
              onPress={() => soon('Profile sharing')}
              style={({pressed}) => [styles.editBtn, pressed && styles.editBtnPressed]}>
              <Icon name="share-2" size={16} color={c.gold} />
            </Pressable>

            <Avatar uri={user?.avatarUrl} name={user?.fullName} size={96} ring />
            <Text style={styles.name}>{user?.fullName ?? 'No name'}</Text>
            <Text style={styles.email}>{user?.email}</Text>

            <View style={styles.badges}>
              <Badge label={ROLE_LABEL[user?.role] ?? 'Member'} tone="gold" />
              {user?.isVerified ? <Badge label="✓ Verified" tone="green" /> : null}
            </View>
            {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          </View>
        </AnimatedEntrance>

        {/* ---------- Stats ---------- */}
        <AnimatedEntrance delay={80} style={styles.stats}>
          <StatTile
            icon="building"
            value={myListings.length}
            label="Listings"
            onPress={() => navigation.navigate('MyProperties')}
          />
          <View style={styles.statDivider} />
          <StatTile
            icon="check"
            value={liveCount}
            label="Live"
            onPress={() => navigation.navigate('MyProperties')}
          />
          <View style={styles.statDivider} />
          <StatTile
            icon="heart"
            value={savedCount}
            label="Saved"
            onPress={() => navigation.navigate('Saved')}
          />
        </AnimatedEntrance>

        {/* ---------- Primary action ---------- */}
        <AnimatedEntrance delay={130}>
          <Button
            title="Post a Property"
            icon="＋"
            style={styles.postBtn}
            onPress={() => navigation.navigate('PostProperty')}
          />
        </AnimatedEntrance>

        {/* ---------- Account ---------- */}
        <AnimatedEntrance delay={180}>
          <SectionLabel>Account</SectionLabel>
          <View style={styles.card}>
            <MenuRow
              icon="building"
              label="My Properties"
              sub="Manage your listings"
              hint={`${myListings.length}`}
              onPress={() => navigation.navigate('MyProperties')}
            />
            <MenuRow
              icon="heart"
              label="Saved"
              sub="Properties you loved"
              hint={`${savedCount}`}
              onPress={() => navigation.navigate('Saved')}
            />
            {isAgent ? (
              <MenuRow
                icon="film"
                label="Create Reel"
                sub="Showcase a property"
                onPress={() => soon('Reel creation')}
              />
            ) : null}
            <MenuRow
              icon="user"
              label="Edit Profile"
              sub="Name, photo & bio"
              onPress={() => soon('Profile editing')}
              last
            />
          </View>
        </AnimatedEntrance>

        {/* ---------- Preferences ---------- */}
        <AnimatedEntrance delay={230}>
          <SectionLabel>Preferences</SectionLabel>
          <ThemeToggle />
          <View style={[styles.card, styles.cardSpaced]}>
            <MenuRow
              icon="bell"
              label="Notifications"
              sub="Alerts & updates"
              onPress={() => soon('Notification settings')}
            />
            <MenuRow
              icon="sliders"
              label="Settings"
              sub="Account & privacy"
              onPress={() => soon('Settings')}
              last
            />
          </View>
        </AnimatedEntrance>

        {/* ---------- Support ---------- */}
        <AnimatedEntrance delay={280}>
          <SectionLabel>Support</SectionLabel>
          <View style={styles.card}>
            <MenuRow
              icon="message-circle"
              label="Help & Support"
              sub="support@aurevia.app"
              onPress={() => Alert.alert('Support', 'support@aurevia.app')}
              last
            />
          </View>
        </AnimatedEntrance>

        <Button
          title="Sign out"
          variant="danger"
          loading={loading}
          onPress={confirmSignOut}
          style={styles.signout}
        />
          <Text style={styles.version}>AUREVIA · v1.0.0</Text>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** Premium segmented Light / Dark theme switcher with an animated slider. */
function ThemeToggle() {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const mode = useThemeStore(s => s.mode);
  const setMode = useThemeStore(s => s.setMode);
  const isDark = mode === 'dark';
  const slide = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const [trackW, setTrackW] = useState(0);

  function choose(next) {
    setMode(next);
    Animated.spring(slide, {
      toValue: next === 'dark' ? 1 : 0,
      useNativeDriver: true,
      speed: 16,
      bounciness: 7,
    }).start();
  }

  const pad = 4;
  const thumbW = trackW > 0 ? (trackW - pad * 2) / 2 : 0;
  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, thumbW],
  });

  return (
    <View style={styles.themeCard}>
      <View style={styles.themeRow}>
        <View style={styles.menuIconWrap}>
          <Icon name={isDark ? 'moon' : 'sun'} size={20} color={c.gold} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.themeTitle}>Appearance</Text>
          <Text style={styles.themeSub}>How AUREVIA looks on this device</Text>
        </View>
      </View>

      <View
        style={styles.segment}
        onLayout={e => setTrackW(e.nativeEvent.layout.width)}>
        {thumbW > 0 ? (
          <Animated.View
            style={[styles.segThumb, {width: thumbW, transform: [{translateX}]}]}
          />
        ) : null}
        <Pressable style={styles.segItem} onPress={() => choose('light')}>
          <Icon name="sun" size={17} color={!isDark ? c.onGold : c.textMuted} />
          <Text style={[styles.segText, {color: !isDark ? c.onGold : c.textMuted}]}>
            Light
          </Text>
        </Pressable>
        <Pressable style={styles.segItem} onPress={() => choose('dark')}>
          <Icon name="moon" size={17} color={isDark ? c.onGold : c.textMuted} />
          <Text style={[styles.segText, {color: isDark ? c.onGold : c.textMuted}]}>
            Dark
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SectionLabel({children}) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function StatTile({icon, value, label, onPress}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.stat, pressed && styles.statPressed]}>
      <Icon name={icon} size={18} color={c.gold} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function MenuRow({icon, label, sub, hint, onPress, last}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.menuRow,
        last && styles.menuRowLast,
        pressed && {backgroundColor: c.surfaceAlt},
      ]}>
      <View style={styles.menuIconWrap}>
        <Icon name={icon} size={20} color={c.gold} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
      </View>
      {hint ? (
        <View style={styles.hintPill}>
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}
      <Icon name="chevron-right" size={18} color={c.textDim} />
    </Pressable>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    safe: {flex: 1},
    scroll: {padding: spacing.md, paddingBottom: spacing.xxl},

    // Ambient background — opacity & translateY are animated from the component.
    // Positioned from the true screen top so the arc sits inside the status bar.
    glowGold: {
      position: 'absolute',
      top: -70,
      right: -60,
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: c.gold,
    },
    glowCool: {
      position: 'absolute',
      top: 210,
      left: -100,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: c.gold,
    },

    // Hero
    hero: {alignItems: 'center', paddingTop: spacing.sm},
    editBtn: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.borderSoft,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editBtnPressed: {backgroundColor: c.surfaceAlt, transform: [{scale: 0.94}]},
    name: {
      color: c.text,
      fontSize: 25,
      fontWeight: '700',
      fontFamily: 'serif',
      marginTop: spacing.md,
    },
    email: {color: c.textMuted, fontSize: 14, marginTop: 3},
    badges: {flexDirection: 'row', gap: 6, marginTop: spacing.md},
    bio: {
      color: c.textDim,
      textAlign: 'center',
      marginTop: spacing.md,
      lineHeight: 20,
      paddingHorizontal: spacing.md,
    },

    // Stats
    stats: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      paddingVertical: spacing.md,
      marginTop: spacing.xl,
    },
    stat: {flex: 1, alignItems: 'center', gap: 5, paddingVertical: spacing.xs, borderRadius: radius.md},
    statPressed: {opacity: 0.55},
    statDivider: {width: 1, backgroundColor: c.border, marginVertical: spacing.xs},
    statValue: {color: c.text, fontSize: 22, fontWeight: '800'},
    statLabel: {color: c.textMuted, fontSize: 12},

    postBtn: {marginTop: spacing.lg},

    // Section label
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

    // Cards
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      overflow: 'hidden',
    },
    cardSpaced: {marginTop: spacing.md},

    // Theme card
    themeCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      padding: spacing.md,
    },
    themeRow: {flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md},
    themeTitle: {color: c.text, fontSize: 16, fontWeight: '700'},
    themeSub: {color: c.textMuted, fontSize: 12.5, marginTop: 2},
    segment: {
      flexDirection: 'row',
      backgroundColor: c.bg,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      padding: 4,
      position: 'relative',
    },
    segThumb: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: 4,
      borderRadius: radius.pill,
      backgroundColor: c.gold,
    },
    segItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      height: 40,
      borderRadius: radius.pill,
    },
    segText: {fontSize: 14, fontWeight: '700', letterSpacing: 0.2},

    // Menu rows
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    menuRowLast: {borderBottomWidth: 0},
    menuIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.goldFaint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    menuTextWrap: {flex: 1},
    menuLabel: {color: c.text, fontSize: 15, fontWeight: '600'},
    menuSub: {color: c.textMuted, fontSize: 12.5, marginTop: 2},
    hintPill: {
      minWidth: 24,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    hintText: {color: c.textMuted, fontSize: 12, fontWeight: '700'},

    signout: {marginTop: spacing.xl},
    version: {
      color: c.textDim,
      textAlign: 'center',
      marginTop: spacing.lg,
      fontSize: 12,
      letterSpacing: 1,
    },
  });
