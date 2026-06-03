import React from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {usePropertiesByAgent} from '../../hooks/useProperties';
import {Avatar} from '../../components/ui/Avatar';
import {Badge} from '../../components/ui/Badge';
import {Icon} from '../../components/ui/Icon';
import {PropertyCard} from '../../components/PropertyCard';
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {EmptyState} from '../../components/ui/EmptyState';
import {Loader} from '../../components/ui/Loader';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

export function AgentProfileScreen({route, navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const {agent} = route.params || {};
  const {data, isLoading} = usePropertiesByAgent(agent?.id);

  const listings = data?.items ?? [];
  const phone = agent?.phone;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({pressed}) => [styles.iconBtn, pressed && {opacity: 0.7}]}>
            <Icon name="chevron-left" size={22} color={c.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Agent Profile</Text>
          <View style={{width: 40}} />
        </View>
      </SafeAreaView>

      <FlatList
        data={listings}
        keyExtractor={p => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <AnimatedEntrance>
            {/* Agent hero card */}
            <View style={styles.heroCard}>
              <Avatar uri={agent?.avatarUrl} name={agent?.fullName} size={80} ring />
              <Text style={styles.agentName}>{agent?.fullName}</Text>
              {agent?.isVerified ? (
                <View style={styles.verifiedRow}>
                  <Icon name="check-circle" size={13} color={c.success} />
                  <Text style={styles.verifiedText}>Verified Agent</Text>
                </View>
              ) : null}
              {agent?.bio ? <Text style={styles.bio}>{agent.bio}</Text> : null}

              {/* Stats */}
              <View style={styles.stats}>
                <StatItem value={listings.length} label="Listings" />
                <View style={styles.statDiv} />
                <StatItem value={listings.filter(p => p.verificationStatus === 'verified').length} label="Live" />
              </View>

              {/* Contact buttons */}
              {phone ? (
                <View style={styles.contactRow}>
                  <Pressable
                    style={styles.contactBtn}
                    onPress={() => Linking.openURL(`tel:${phone}`)}>
                    <Icon name="phone" size={16} color={c.gold} />
                    <Text style={styles.contactBtnText}>Call</Text>
                  </Pressable>
                  <Pressable
                    style={styles.contactBtn}
                    onPress={() => Linking.openURL(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`)}>
                    <Icon name="message-circle" size={16} color={c.gold} />
                    <Text style={styles.contactBtnText}>WhatsApp</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>
              Listings ({listings.length})
            </Text>
          </AnimatedEntrance>
        }
        renderItem={({item, index}) => (
          <AnimatedEntrance delay={index * 40}>
            <PropertyCard
              property={item}
              style={styles.card}
              onPress={() => navigation.navigate('PropertyDetail', {id: item.id})}
            />
          </AnimatedEntrance>
        )}
        ListEmptyComponent={
          isLoading ? (
            <Loader size={40} label="Loading listings…" />
          ) : (
            <EmptyState icon="🏠" title="No listings yet" subtitle="This agent hasn't posted any properties." />
          )
        }
      />
    </View>
  );
}

function StatItem({value, label}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    headerSafe: {backgroundColor: c.bg, borderBottomWidth: 1, borderBottomColor: c.borderSoft},
    header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
    iconBtn: {width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderSoft, alignItems: 'center', justifyContent: 'center'},
    headerTitle: {flex: 1, textAlign: 'center', color: c.text, fontSize: 18, fontWeight: '700', fontFamily: 'serif'},

    list: {padding: spacing.md, paddingBottom: spacing.xxl},

    heroCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSoft,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    agentName: {color: c.text, fontSize: 22, fontWeight: '700', fontFamily: 'serif', marginTop: spacing.md},
    verifiedRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4},
    verifiedText: {color: c.success, fontSize: 12.5, fontWeight: '700'},
    bio: {color: c.textMuted, fontSize: 13.5, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20},

    stats: {flexDirection: 'row', marginTop: spacing.md, backgroundColor: c.bg, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderSoft, paddingVertical: spacing.sm, width: '100%'},
    statItem: {flex: 1, alignItems: 'center'},
    statDiv: {width: 1, backgroundColor: c.border},
    statValue: {color: c.text, fontSize: 22, fontWeight: '800'},
    statLabel: {color: c.textMuted, fontSize: 12, marginTop: 2},

    contactRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, width: '100%'},
    contactBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 42,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: c.gold,
      backgroundColor: c.goldFaint,
    },
    contactBtnText: {color: c.gold, fontSize: 14, fontWeight: '700'},

    sectionTitle: {color: c.text, fontSize: 16, fontWeight: '700', marginBottom: spacing.md},
    card: {marginBottom: spacing.md},
  });
