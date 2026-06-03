import React, {useState} from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Dropdown} from 'react-native-element-dropdown';
import {useQueryClient} from '@tanstack/react-query';
import {PropertyCard} from '../../components/PropertyCard';
import {Icon} from '../../components/ui/Icon';
import {Loader} from '../../components/ui/Loader';
import {EmptyState} from '../../components/ui/EmptyState';
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {useMyProperties} from '../../hooks/useProperties';
import {deleteProperty} from '../../lib/properties';
import {radius, shadow, spacing, useColors, useThemedStyles} from '../../theme';

const SCREEN_W = Dimensions.get('window').width;

// Trigger button is 44px wide, bar has 16px horizontal padding, 8px gap.
// triggerLeft  = SCREEN_W - 16(rightPad) - 44(trigger) = SCREEN_W - 60
// desiredLeft  = 16 (leftPad)
// marginLeft   = 16 - (SCREEN_W - 60) = 76 - SCREEN_W = -(SCREEN_W - 76)
const DROP_W        = SCREEN_W - spacing.md * 2;          // full-width with side margins
const DROP_ML       = -(SCREEN_W - spacing.md * 2 - 44);  // snap to left edge

const FILTERS = [
  {label: 'All',          value: 'all',      icon: 'layers'},
  {label: 'Live',         value: 'verified', icon: 'check-circle'},
  {label: 'Under Review', value: 'pending',  icon: 'clock'},
  {label: 'Rejected',     value: 'rejected', icon: 'x-circle'},
];

const STATUS_BADGE = {
  verified: {label: 'Live',         icon: 'check-circle', color: '#5FD08A'},
  pending:  {label: 'Under Review', icon: 'clock',        color: '#C9893B'},
  rejected: {label: 'Rejected',     icon: 'x-circle',     color: '#EF6B6B'},
};

export function MyPropertiesScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const qc = useQueryClient();
  const [tab, setTab] = useState('all');
  const {data, isLoading, refetch, isRefetching} = useMyProperties(tab);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');

  const items = data?.items ?? [];
  const isFiltered = tab !== 'all';

  const filtered = search.trim()
    ? items.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.city?.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  function confirmDelete(id) {
    Alert.alert('Delete listing', 'Are you sure you want to delete this property?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => remove(id)},
    ]);
  }

  async function remove(id) {
    setBusyId(id);
    try {
      await deleteProperty(id);
      qc.invalidateQueries({queryKey: ['my-properties']});
      refetch();
    } catch {
      Alert.alert('Error', 'Could not delete the property.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({pressed}) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
            <Icon name="chevron-left" size={22} color={c.text} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Properties</Text>
            {items.length > 0 && (
              <Text style={styles.headerSub}>
                {items.length} listing{items.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          <Pressable
            onPress={() => navigation.navigate('PostProperty')}
            hitSlop={10}
            style={({pressed}) => [styles.postBtn, pressed && {opacity: 0.75}]}>
            <Icon name="plus" size={18} color={c.onGold} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* ── Search + Filter inline ── */}
      <View style={styles.bar}>

        {/* Search */}
        <View style={styles.searchBox}>
          <Icon name="search" size={15} color={c.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties…"
            placeholderTextColor={c.textDim}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Icon name="x" size={13} color={c.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter — 44px trigger, full-width dropdown list */}
        <Dropdown
          style={[styles.filterTrigger, isFiltered && styles.filterTriggerActive]}
          containerStyle={styles.dropContainer}
          data={FILTERS}
          labelField="label"
          valueField="value"
          value={tab}
          maxHeight={280}
          onChange={item => setTab(item.value)}
          renderLeftIcon={() => (
            <View style={styles.filterIconCenter}>
              <Icon name="sliders" size={16} color={isFiltered ? c.onGold : c.text} />
            </View>
          )}
          renderRightIcon={() => null}
          selectedTextStyle={styles.dropHidden}
          renderItem={(item, selected) => (
            <DropItem item={item} selected={selected} c={c} styles={styles} />
          )}
          activeColor={c.goldFaint}
        />
      </View>

      {/* ── List ── */}
      {isLoading ? (
        <Loader fullscreen size={48} label="Loading…" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({item, index}) => {
            const badge = STATUS_BADGE[item.verificationStatus] ?? STATUS_BADGE.pending;
            return (
              <AnimatedEntrance delay={Math.min(index, 6) * 50}>
                <View style={styles.cardWrap}>
                  <PropertyCard
                    property={item}
                    statusBadge={badge}
                    onDelete={busyId === item.id ? undefined : () => confirmDelete(item.id)}
                    onPress={() =>
                      navigation.navigate('PropertyDetail', {id: item.id, title: item.title})
                    }
                  />
                  {busyId === item.id && (
                    <Loader size={20} color={c.danger} style={styles.busyLoader} />
                  )}
                </View>
              </AnimatedEntrance>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="🏠"
              title="No listings here"
              subtitle="Post your first property to get started."
              actionLabel="Post a property"
              onAction={() => navigation.navigate('PostProperty')}
            />
          }
        />
      )}
    </View>
  );
}

function DropItem({item, selected, c, styles}) {
  return (
    <View style={[styles.dropItem, selected && styles.dropItemSelected]}>
      <View style={[styles.dropIconWrap, selected && styles.dropIconWrapActive]}>
        <Icon name={item.icon} size={15} color={selected ? c.onGold : c.textDim} />
      </View>
      <Text style={[styles.dropLabel, selected && styles.dropLabelActive]}>
        {item.label}
      </Text>
      {selected && <Icon name="check" size={14} color={c.gold} />}
    </View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},

    // ── Header ──
    headerSafe: {
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnPressed: {backgroundColor: c.surfaceAlt, transform: [{scale: 0.94}]},
    headerCenter: {flex: 1, alignItems: 'center'},
    headerTitle: {color: c.text, fontSize: 18, fontWeight: '700', fontFamily: 'serif'},
    headerSub: {color: c.textMuted, fontSize: 12, marginTop: 1},
    postBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Search + Filter bar ──
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
      backgroundColor: c.bg,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 44,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.borderSoft,
      backgroundColor: c.surface,
      paddingHorizontal: spacing.md,
    },
    searchInput: {flex: 1, color: c.text, fontSize: 14, paddingVertical: 0},

    // Filter trigger — 44×44 icon button
    filterTrigger: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.borderSoft,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterTriggerActive: {backgroundColor: c.gold, borderColor: c.gold},
    filterIconCenter: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropHidden: {width: 0, height: 0},

    // Dropdown list — full width, snapped to left edge of bar
    dropContainer: {
      width: DROP_W,
      marginLeft: DROP_ML,
      marginTop: 6,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      ...shadow.card,
    },

    // Dropdown items
    dropItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    dropItemSelected: {backgroundColor: c.goldFaint},
    dropIconWrap: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropIconWrapActive: {backgroundColor: c.gold},
    dropLabel: {flex: 1, color: c.text, fontSize: 14.5, fontWeight: '600'},
    dropLabelActive: {color: c.gold},

    // ── List ──
    list: {padding: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1},
    cardWrap: {marginBottom: spacing.md, position: 'relative'},
    busyLoader: {position: 'absolute', top: 12, right: 12},
  });
