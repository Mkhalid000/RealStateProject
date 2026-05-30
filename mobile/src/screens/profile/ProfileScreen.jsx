import React, {useState} from 'react';
import {
  Alert,
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
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {useAuthStore} from '../../store/authStore';
import {useSavedStore} from '../../store/savedStore';
import {useMyProperties} from '../../hooks/useProperties';
import {logout} from '../../lib/auth';
import {colors, radius, spacing} from '../../theme';

const ROLE_LABEL = {agent: 'Agent', admin: 'Admin', user: 'Member'};

export function ProfileScreen({navigation}) {
  const {user, reset} = useAuthStore();
  const savedCount = useSavedStore(s => s.items.length);
  const {data: mine} = useMyProperties('all');
  const [loading, setLoading] = useState(false);

  const myListings = mine?.items ?? [];
  const liveCount = myListings.filter(p => p.verificationStatus === 'verified').length;

  function confirmSignOut() {
    Alert.alert('Sign out', 'Aap sure ho?', [
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

        <AnimatedEntrance delay={150}>
          <Button
            title="Post a Property"
            icon="＋"
            style={styles.postBtn}
            onPress={() => navigation.navigate('PostProperty')}
          />
        </AnimatedEntrance>

        <AnimatedEntrance delay={210} style={styles.menu}>
          <MenuRow icon="🏠" label="My Properties" hint={`${myListings.length}`} onPress={() => navigation.navigate('MyProperties')} />
          <MenuRow icon="♥" label="Saved" hint={`${savedCount}`} onPress={() => navigation.navigate('Saved')} />
          {user?.role === 'agent' ? (
            <MenuRow icon="🎬" label="Create Reel" onPress={() => Alert.alert('Coming soon', 'Reel creation jald aa raha hai.')} />
          ) : null}
          <MenuRow icon="✏️" label="Edit Profile" onPress={() => Alert.alert('Coming soon', 'Profile editing jald aa raha hai.')} />
          <MenuRow icon="⚙️" label="Settings" onPress={() => Alert.alert('Coming soon', 'Settings jald aa rahe hain.')} />
          <MenuRow icon="❓" label="Help & Support" onPress={() => Alert.alert('Support', 'support@aurevia.app')} />
        </AnimatedEntrance>

        <Button title="Sign out" variant="danger" loading={loading} onPress={confirmSignOut} style={styles.signout} />
        <Text style={styles.version}>AUREVIA · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({value, label}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({icon, label, hint, onPress}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.menuRow, pressed && {backgroundColor: colors.surfaceAlt}]}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      {hint ? <Text style={styles.menuHint}>{hint}</Text> : null}
      <Text style={styles.menuChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  scroll: {padding: spacing.lg, paddingBottom: spacing.xxl},
  headerGlow: {position: 'absolute', top: -60, alignSelf: 'center', width: 240, height: 240, borderRadius: 120, backgroundColor: colors.gold, opacity: 0.1},
  header: {alignItems: 'center', paddingTop: spacing.sm},
  name: {color: colors.text, fontSize: 24, fontWeight: '700', fontFamily: 'serif', marginTop: spacing.md},
  email: {color: colors.textMuted, fontSize: 14, marginTop: 2},
  badges: {flexDirection: 'row', gap: 6, marginTop: spacing.sm},
  bio: {color: colors.textDim, textAlign: 'center', marginTop: spacing.md, lineHeight: 20},
  stats: {flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSoft, paddingVertical: spacing.md, marginTop: spacing.xl},
  stat: {flex: 1, alignItems: 'center'},
  statDivider: {width: 1, backgroundColor: colors.border},
  statValue: {color: colors.gold, fontSize: 22, fontWeight: '800'},
  statLabel: {color: colors.textMuted, fontSize: 12, marginTop: 2},
  postBtn: {marginTop: spacing.lg},
  menu: {marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden'},
  menuRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, height: 56, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
  menuIcon: {fontSize: 18, width: 30},
  menuLabel: {flex: 1, color: colors.text, fontSize: 15, fontWeight: '500'},
  menuHint: {color: colors.textMuted, fontSize: 14, marginRight: spacing.sm},
  menuChevron: {color: colors.textMuted, fontSize: 22},
  signout: {marginTop: spacing.xl},
  version: {color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, fontSize: 12},
});
