import React from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {Avatar} from '../../components/ui/Avatar';
import {Loader} from '../../components/ui/Loader';
import {EmptyState} from '../../components/ui/EmptyState';
import {Icon} from '../../components/ui/Icon';
import {useAuthStore} from '../../store/authStore';
import {fetchConversations} from '../../lib/messages';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

export function InboxScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const me = useAuthStore(s => s.user);

  const {data, isLoading, refetch, isRefetching} = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    refetchInterval: 15000,
  });

  const convs = Array.isArray(data) ? data : [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={({pressed}) => [styles.backBtn, pressed && {opacity: 0.7}]}>
          <Icon name="chevron-left" size={22} color={c.text} />
        </Pressable>
        <Text style={styles.title}>Messages</Text>
        <View style={{width: 40}} />
      </View>

      {isLoading ? (
        <Loader fullscreen size={48} label="Loading…" />
      ) : (
        <FlatList
          data={convs}
          keyExtractor={c => c.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({item}) => {
            // Resolve who is "the other person" based on current user's id
            const other = item.userId === me?.id ? item.agent : item.user;
            return (
              <Pressable
                style={({pressed}) => [styles.row, pressed && {backgroundColor: c.surfaceAlt}]}
                onPress={() =>
                  navigation.navigate('Chat', {
                    conversationId: item.id,
                    agentId: item.agentId,
                    recipient: other,
                  })
                }>
                <Avatar uri={other?.avatarUrl} name={other?.fullName} size={50} />
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowName, item.unreadCount > 0 && styles.rowNameUnread]}>
                      {other?.fullName ?? 'User'}
                    </Text>
                    <Text style={[styles.rowTime, item.unreadCount > 0 && styles.rowTimeUnread]}>
                      {formatDate(item.lastMessageAt)}
                    </Text>
                  </View>
                  <View style={styles.rowBottom}>
                    <Text
                      style={[styles.rowLast, item.unreadCount > 0 && styles.rowLastUnread]}
                      numberOfLines={1}>
                      {item.lastMessage ?? 'No messages yet'}
                    </Text>
                    {item.unreadCount > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {item.unreadCount > 9 ? '9+' : item.unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="💬"
              title="No conversations yet"
              subtitle="Start a chat from any agent profile."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  if (diff < 604800000) return d.toLocaleDateString([], {weekday: 'short'});
  return d.toLocaleDateString([], {month: 'short', day: 'numeric'});
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
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {flex: 1, textAlign: 'center', color: c.text, fontSize: 18, fontWeight: '700', fontFamily: 'serif'},
    list: {flexGrow: 1},
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    rowBody: {flex: 1},
    rowTop: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3},
    rowName: {color: c.text, fontSize: 15, fontWeight: '600'},
    rowNameUnread: {fontWeight: '800'},
    rowTime: {color: c.textDim, fontSize: 11.5},
    rowTimeUnread: {color: c.success, fontWeight: '700'},
    rowBottom: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
    rowLast: {flex: 1, color: c.textMuted, fontSize: 13},
    rowLastUnread: {color: c.text, fontWeight: '600'},
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.success,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    unreadBadgeText: {color: '#fff', fontSize: 11, fontWeight: '800'},
  });
