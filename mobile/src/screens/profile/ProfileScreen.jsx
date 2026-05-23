import React, {useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {ScreenContainer} from '../../components/ui/ScreenContainer';
import {Button} from '../../components/ui/Button';
import {useAuthStore} from '../../store/authStore';
import {logout} from '../../lib/auth';
import {colors, radius, spacing} from '../../theme';

export function ProfileScreen() {
  const {user, reset} = useAuthStore();
  const [loading, setLoading] = useState(false);

  async function onSignOut() {
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

  const initial = (user?.fullName ?? '?').charAt(0).toUpperCase();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{user?.fullName ?? 'No name'}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {user?.role === 'agent' ? 'Agent' : user?.role === 'admin' ? 'Admin' : 'Buyer'}
              {user?.isVerified ? ' • Verified' : ''}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.bio}>{user?.bio ?? 'No bio yet.'}</Text>

      <View style={styles.spacer} />
      <Button title="Sign out" variant="outline" onPress={onSignOut} loading={loading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {flexDirection: 'row', alignItems: 'center', marginTop: spacing.md},
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: '#fff', fontSize: 30, fontWeight: '800'},
  headerText: {marginLeft: spacing.md, flex: 1},
  name: {color: colors.text, fontSize: 20, fontWeight: '700'},
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {color: colors.accent, fontSize: 12, fontWeight: '600'},
  bio: {color: colors.textMuted, marginTop: spacing.lg},
  spacer: {flex: 1},
});
