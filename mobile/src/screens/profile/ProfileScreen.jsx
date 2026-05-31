import React, {useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
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

  function confirmSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
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

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <AnimatedEntrance>
          <View style={styles.headerGlow} />
          <View style={styles.header}>
            <Avatar uri={user?.avatarUrl} name={user?.fullName} size={88} ring />
            <Text style={styles.name}>{user?.fullName ?? 'No name'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.badges}>
              <Badge label={ROLE_LABEL[user?.role] ?? 'Member'} tone="gold" />
              {user?.isVerified ? <Badge label="✓ Verified" tone="green" /> : null}
            </View>
            {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={90} style={styles.stats}>
          <Stat value={myListings.length} label="Listings" />
          <View style={styles.statDivider} />
          <Stat value={liveCount} label="Live" />
          <View style={styles.statDivider} />
          <Stat value={savedCount} label="Saved" />
        </AnimatedEntrance>

        <AnimatedEntrance delay={130}>
          <ThemeToggle />
        </AnimatedEntrance>

        <AnimatedEntrance delay={170}>
          <Button
            title="Post a Property"
            icon="＋"
            style={styles.postBtn}
            onPress={() => navigation.navigate('PostProperty')}
          />
        </AnimatedEntrance>

        <AnimatedEntrance delay={220} style={styles.menu}>
          <MenuRow icon="🏠" label="My Properties" hint={`${myListings.length}`} onPress={() => navigation.navigate('MyProperties')} />
          <MenuRow icon="♥" label="Saved" hint={`${savedCount}`} onPress={() => navigation.navigate('Saved')} />
          {user?.role === 'agent' ? (
            <MenuRow icon="🎬" label="Create Reel" onPress={() => Alert.alert('Coming soon', 'Reel creation is on its way.')} />
          ) : null}
          <MenuRow icon="✏️" label="Edit Profile" onPress={() => Alert.alert('Coming soon', 'Profile editing is on its way.')} />
          <MenuRow icon="⚙️" label="Settings" onPress={() => Alert.alert('Coming soon', 'Settings are on their way.')} />
          <MenuRow icon="❓" label="Help & Support" onPress={() => Alert.alert('Support', 'support@aurevia.app')} last />
        </AnimatedEntrance>

        <Button title="Sign out" variant="danger" loading={loading} onPress={confirmSignOut} style={styles.signout} />
        <Text style={styles.version}>AUREVIA · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
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
      <View style={styles.themeHead}>
        <Text style={styles.themeTitle}>Appearance</Text>
        <Text style={styles.themeSub}>Choose how AUREVIA looks on this device</Text>
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

function Stat({value, label}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({icon, label, hint, onPress, last}) {
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
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      {hint ? <Text style={styles.menuHint}>{hint}</Text> : null}
      <Text style={styles.menuChevron}>›</Text>
    </Pressable>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    scroll: {padding: spacing.lg, paddingBottom: spacing.xxl},
    headerGlow: {position: 'absolute', top: -60, alignSelf: 'center', width: 240, height: 240, borderRadius: 120, backgroundColor: c.gold, opacity: c.isDark ? 0.1 : 0.16},
    header: {alignItems: 'center', paddingTop: spacing.sm},
    name: {color: c.text, fontSize: 24, fontWeight: '700', fontFamily: 'serif', marginTop: spacing.md},
    email: {color: c.textMuted, fontSize: 14, marginTop: 2},
    badges: {flexDirection: 'row', gap: 6, marginTop: spacing.sm},
    bio: {color: c.textDim, textAlign: 'center', marginTop: spacing.md, lineHeight: 20},
    stats: {flexDirection: 'row', backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderSoft, paddingVertical: spacing.md, marginTop: spacing.xl},
    stat: {flex: 1, alignItems: 'center'},
    statDivider: {width: 1, backgroundColor: c.border},
    statValue: {color: c.gold, fontSize: 22, fontWeight: '800'},
    statLabel: {color: c.textMuted, fontSize: 12, marginTop: 2},
    themeCard: {
      marginTop: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      padding: spacing.md,
    },
    themeHead: {marginBottom: spacing.md},
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
    postBtn: {marginTop: spacing.lg},
    menu: {marginTop: spacing.lg, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderSoft, overflow: 'hidden'},
    menuRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, height: 56, borderBottomWidth: 1, borderBottomColor: c.borderSoft},
    menuRowLast: {borderBottomWidth: 0},
    menuIcon: {fontSize: 18, width: 30},
    menuLabel: {flex: 1, color: c.text, fontSize: 15, fontWeight: '500'},
    menuHint: {color: c.textMuted, fontSize: 14, marginRight: spacing.sm},
    menuChevron: {color: c.textMuted, fontSize: 22},
    signout: {marginTop: spacing.xl},
    version: {color: c.textMuted, textAlign: 'center', marginTop: spacing.lg, fontSize: 12},
  });
