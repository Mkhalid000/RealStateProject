import React, {useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Icon} from '../../components/ui/Icon';
import {EmptyState} from '../../components/ui/EmptyState';
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const img = id =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=200&q=70`;

/** Static demo notifications until the backend feed is wired in. */
const SEED = [
  {
    id: '1',
    type: 'property',
    title: 'Listing approved',
    body: 'Your property “Luxury 4BHK Villa — Jubilee Hills” is now live.',
    time: '2m ago',
    unread: true,
    image: img('1600596542815-ffad4c1539a9'),
  },
  {
    id: '2',
    type: 'reel',
    title: 'New reel posted',
    body: 'Aurevia Luxury Estates shared a new reel of a sea-facing penthouse.',
    time: '1h ago',
    unread: true,
    image: img('1600607687939-ce8a6c25118c'),
  },
  {
    id: '3',
    type: 'property',
    title: 'Property under review',
    body: '“2BHK Apartment — Bandra West” was submitted and is pending verification.',
    time: '3h ago',
    unread: true,
    image: img('1600585154340-be6161a56a0c'),
  },
  {
    id: '4',
    type: 'saved',
    title: 'Price drop on a saved home',
    body: 'A property you saved dropped by 8%. Check it out before it’s gone.',
    time: 'Yesterday',
    unread: false,
    image: img('1600566753086-00f18fb6b3ea'),
  },
  {
    id: '5',
    type: 'reel',
    title: 'Trending reel',
    body: 'A villa tour you might like is trending in Hyderabad right now.',
    time: '2d ago',
    unread: false,
    image: img('1613490493576-7fde63acd811'),
  },
  {
    id: '6',
    type: 'system',
    title: 'Welcome to AUREVIA',
    body: 'Discover, save and post premium properties — all in one place.',
    time: '5d ago',
    unread: false,
    image: null,
  },
];

const META = {
  property: {icon: 'home'},
  reel: {icon: 'film'},
  saved: {icon: 'heart'},
  system: {icon: 'sparkles'},
};

export function NotificationsScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [items, setItems] = useState(SEED);

  const unreadCount = items.filter(n => n.unread).length;
  const markAllRead = () => setItems(list => list.map(n => ({...n, unread: false})));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* header */}
      <View style={styles.header}>
        <Pressable
          style={styles.iconBtn}
          hitSlop={8}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={22} color={c.text} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          ) : null}
        </View>
        {unreadCount > 0 ? (
          <Pressable hitSlop={8} onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all</Text>
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications"
          subtitle="You’re all caught up. New updates will show up here."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}>
          {items.map((n, i) => {
            const meta = META[n.type] || META.system;
            return (
              <AnimatedEntrance key={n.id} delay={Math.min(i, 8) * 45}>
                <Pressable
                  style={[styles.row, n.unread && styles.rowUnread]}
                  onPress={() =>
                    setItems(list =>
                      list.map(x => (x.id === n.id ? {...x, unread: false} : x)),
                    )
                  }>
                  <View style={styles.thumbWrap}>
                    {n.image ? (
                      <Image source={{uri: n.image}} style={styles.thumb} />
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
                        {n.title}
                      </Text>
                      {n.unread ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={styles.rowText} numberOfLines={2}>
                      {n.body}
                    </Text>
                    <Text style={styles.rowTime}>{n.time}</Text>
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
    thumb: {
      width: 54,
      height: 54,
      borderRadius: 12,
      backgroundColor: c.surface2,
    },
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
