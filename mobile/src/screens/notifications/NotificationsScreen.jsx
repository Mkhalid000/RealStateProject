import React from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Icon} from '../../components/ui/Icon';
import {Loader} from '../../components/ui/Loader';
import {EmptyState} from '../../components/ui/EmptyState';
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {
  useMarkAllRead,
  useNotifications,
} from '../../hooks/useNotifications';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const META = {
  property_status: {icon: 'home'},
  new_property: {icon: 'home'},
  new_reel: {icon: 'film'},
  like: {icon: 'heart'},
  comment: {icon: 'message-circle'},
  follow: {icon: 'user'},
  message: {icon: 'message-circle'},
  system: {icon: 'sparkles'},
};

/** Build a human title/body from a stored notification. */
function present(n) {
  const p = n.payload || {};
  const title = p.title || 'Property';
  switch (n.type) {
    case 'property_status': {
      if (p.status === 'verified') {
        return {head: 'Listing approved', body: `“${title}” is now live.`};
      }
      if (p.status === 'rejected') {
        return {
          head: 'Listing rejected',
          body: `“${title}” wasn’t approved. Review & resubmit.`,
        };
      }
      return {
        head: 'Listing submitted',
        body: `“${title}” is pending admin verification.`,
      };
    }
    case 'new_property':
      return {
        head: 'New property listed',
        body: p.actorName
          ? `${p.actorName} just listed “${title}”.`
          : `A new property “${title}” was listed.`,
      };
    case 'new_reel':
      return p.self
        ? {head: 'Reel posted', body: 'Your reel is now live.'}
        : {head: 'New reel posted', body: 'A new property reel was shared.'};
    case 'like':
      return {head: 'New like', body: 'Someone liked your reel.'};
    case 'comment':
      return {head: 'New comment', body: 'Someone commented on your reel.'};
    case 'follow':
      return {head: 'New follower', body: 'You have a new follower.'};
    case 'message':
      return {head: 'New message', body: 'You have a new message.'};
    default:
      return {head: 'AUREVIA', body: 'You have a new notification.'};
  }
}

function timeAgo(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const {data: items = [], isLoading, isError, refetch, isRefetching} =
    useNotifications();
  const markAll = useMarkAllRead();

  const unreadCount = items.filter(n => !n.readAt).length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} hitSlop={8} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={22} color={c.text} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          ) : null}
        </View>
        {unreadCount > 0 ? (
          <Pressable hitSlop={8} onPress={() => markAll.mutate()}>
            <Text style={styles.markAll}>Mark all</Text>
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {isLoading ? (
        <Loader fullscreen />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🔔"
          title={isError ? 'Couldn’t load' : 'No notifications'}
          subtitle={
            isError
              ? 'Check your connection and try again.'
              : 'You’re all caught up. New updates will show here.'
          }
          actionLabel={isError ? 'Retry' : undefined}
          onAction={isError ? refetch : undefined}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={c.gold}
              colors={[c.gold]}
            />
          }>
          {items.map((n, i) => {
            const meta = META[n.type] || META.system;
            const {head, body} = present(n);
            const image = n.payload?.image || null;
            const unread = !n.readAt;
            return (
              <AnimatedEntrance key={n.id} delay={Math.min(i, 8) * 40}>
                <Pressable
                  style={[styles.row, unread && styles.rowUnread]}
                  onPress={() => {
                    if (n.payload?.propertyId) {
                      navigation.navigate('PropertyDetail', {id: n.payload.propertyId});
                    }
                  }}>
                  <View style={styles.thumbWrap}>
                    {image ? (
                      <Image source={{uri: image}} style={styles.thumb} />
                    ) : (
                      <View style={[styles.thumb, styles.thumbFallback]}>
                        <Icon name={meta.icon} size={20} color={c.gold} />
                      </View>
                    )}
                    <View style={styles.typeBadge}>
                      <Icon name={meta.icon} size={11} color={c.onGold} />
                    </View>
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {head}
                      </Text>
                      {unread ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={styles.rowText} numberOfLines={2}>
                      {body}
                    </Text>
                    <Text style={styles.rowTime}>{timeAgo(n.createdAt)}</Text>
                  </View>
                </Pressable>
              </AnimatedEntrance>
            );
          })}
          <Text style={styles.endText}>That’s everything</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {flex: 1, alignItems: 'center'},
    headerTitle: {color: c.text, fontSize: 18, fontWeight: '700', fontFamily: 'serif'},
    headerSub: {color: c.gold, fontSize: 11.5, fontWeight: '600', marginTop: 1},
    markAll: {color: c.gold, fontSize: 13, fontWeight: '700'},
    list: {padding: spacing.md, paddingBottom: spacing.xxl},
    row: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    rowUnread: {
      borderColor: c.goldGlow,
      backgroundColor: c.isDark ? c.surfaceAlt : c.surface,
    },
    thumbWrap: {width: 54, height: 54},
    thumb: {width: 54, height: 54, borderRadius: 12, backgroundColor: c.surface2},
    thumbFallback: {
      backgroundColor: c.goldFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeBadge: {
      position: 'absolute',
      bottom: -3,
      right: -3,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.isDark ? c.surfaceAlt : c.surface,
    },
    rowBody: {flex: 1},
    rowTop: {flexDirection: 'row', alignItems: 'center', gap: 8},
    rowTitle: {color: c.text, fontSize: 14.5, fontWeight: '700', flex: 1},
    unreadDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: c.gold},
    rowText: {color: c.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3},
    rowTime: {color: c.textMuted, fontSize: 11, marginTop: 6, opacity: 0.8},
    endText: {
      color: c.textMuted,
      fontSize: 12,
      textAlign: 'center',
      marginTop: spacing.md,
      letterSpacing: 0.3,
    },
  });
