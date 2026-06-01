import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {PropertyCard} from '../../components/PropertyCard';
import {EmptyState} from '../../components/ui/EmptyState';
import {PropertyCardSkeleton} from '../../components/ui/Skeleton';
import {Logo} from '../../components/ui/Logo';
import {Icon} from '../../components/ui/Icon';
import {Button} from '../../components/ui/Button';
import {BottomSheet} from '../../components/ui/BottomSheet';
import {Loader} from '../../components/ui/Loader';
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {flattenPages, usePropertiesFeed} from '../../hooks/useProperties';
import {useDebounced} from '../../hooks/useDebounced';
import {useAuthStore} from '../../store/authStore';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const LISTING_TABS = [
  {key: undefined, label: 'All'},
  {key: 'buy', label: 'Buy'},
  {key: 'rent', label: 'Rent'},
];

const TYPES = [
  {key: undefined, label: 'All', icon: 'sliders'},
  {key: 'apartment', label: 'Apartment', icon: 'building'},
  {key: 'villa', label: 'Villa', icon: 'home'},
  {key: 'plot', label: 'Plot', icon: 'map-pin'},
  {key: 'commercial', label: 'Commercial', icon: 'tag'},
  {key: 'office', label: 'Office', icon: 'briefcase'},
  {key: 'shop', label: 'Shop', icon: 'tag'},
];

const BHK_OPTIONS = [
  {key: undefined, label: 'Any'},
  {key: 1, label: '1'},
  {key: 2, label: '2'},
  {key: 3, label: '3'},
  {key: 4, label: '4+'},
];

const PRICE_RANGES = [
  {key: 'any', label: 'Any price', min: undefined, max: undefined},
  {key: 'u100k', label: 'Under $100K', min: undefined, max: 100000},
  {key: '100-300', label: '$100K – $300K', min: 100000, max: 300000},
  {key: '300-600', label: '$300K – $600K', min: 300000, max: 600000},
  {key: '600-1m', label: '$600K – $1M', min: 600000, max: 1000000},
  {key: '1m+', label: '$1M+', min: 1000000, max: undefined},
];

const SORTS = [
  {key: 'newest', label: 'Newest'},
  {key: 'price_asc', label: 'Price: Low to High'},
  {key: 'price_desc', label: 'Price: High to Low'},
  {key: 'title_asc', label: 'Name: A to Z'},
];

const DEFAULTS = {
  listingType: undefined,
  type: undefined,
  bhk: undefined,
  priceKey: 'any',
  sort: 'newest',
};

export function ExploreScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const user = useAuthStore(s => s.user);

  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 400);
  const [adVisible, setAdVisible] = useState(true);

  // committed filters
  const [applied, setApplied] = useState(DEFAULTS);
  // sheet open + its draft
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(DEFAULTS);

  const priceRange = PRICE_RANGES.find(p => p.key === applied.priceKey) || PRICE_RANGES[0];

  const filters = useMemo(
    () => ({
      ...(q ? {q} : {}),
      ...(applied.listingType ? {listingType: applied.listingType} : {}),
      ...(applied.type ? {type: applied.type} : {}),
      ...(applied.bhk != null ? {bhk: applied.bhk} : {}),
      ...(priceRange.min != null ? {minPrice: priceRange.min} : {}),
      ...(priceRange.max != null ? {maxPrice: priceRange.max} : {}),
      sort: applied.sort || 'newest',
    }),
    [q, applied, priceRange],
  );

  const activeCount =
    (applied.listingType ? 1 : 0) +
    (applied.type ? 1 : 0) +
    (applied.bhk != null ? 1 : 0) +
    (applied.priceKey !== 'any' ? 1 : 0) +
    (applied.sort !== 'newest' ? 1 : 0);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePropertiesFeed(filters);

  const items = flattenPages(data);
  const total = data?.pages?.[0]?.total ?? items.length;

  function openSheet() {
    setDraft(applied);
    setSheetOpen(true);
  }
  function applyDraft() {
    setApplied(draft);
    setSheetOpen(false);
  }
  function resetAll() {
    setApplied(DEFAULTS);
    setDraft(DEFAULTS);
    setSearch('');
  }

  const header = (
    <View style={styles.headerWrap}>
      {/* <Text style={styles.hello}>
        Hello{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
      </Text> */}
      <Text style={styles.heading}>Find your{'\n'}perfect space</Text>

      {/* Search + Filters trigger */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={c.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search city, locality…"
            placeholderTextColor={c.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search ? (
            <Pressable hitSlop={10} onPress={() => setSearch('')} style={styles.clearBtn}>
              <Icon name="x" size={14} color={c.textMuted} strokeWidth={2.2} />
            </Pressable>
          ) : null}
        </View>

        <Pressable style={styles.filterBtn} onPress={openSheet}>
          <Icon name="sliders" size={20} color={activeCount ? c.onGold : c.text} />
          {activeCount ? (
            <View style={styles.filterDot}>
              <Text style={styles.filterDotText}>{activeCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

    </View>
  );

  const footer = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <Loader size={30} label="Loading more" />
        </View>
      );
    }
    if (!hasNextPage && items.length > 0) {
      return (
        <View style={styles.footer}>
          <View style={styles.endRule} />
          <Text style={styles.endText}>You’re all caught up</Text>
        </View>
      );
    }
    return <View style={{height: spacing.lg}} />;
  };

  // Let the gold orbs bleed up behind a transparent status bar on this screen.
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
    }, [c]),
  );

  return (
    <View style={styles.root}>
      <BackgroundDecor />
      <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Logo width={128} align="left" />
        <Pressable
          style={styles.bellBtn}
          hitSlop={8}
          onPress={() => navigation.navigate('Notifications')}>
          <Icon name="bell" size={20} color={c.text} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {header}
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.card}>
              <PropertyCardSkeleton />
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          renderItem={({item, index}) => (
            <AnimatedEntrance delay={Math.min(index, 6) * 40}>
              <PropertyCard
                property={item}
                style={styles.card}
                onPress={() =>
                  navigation.navigate('PropertyDetail', {id: item.id, title: item.title})
                }
              />
            </AnimatedEntrance>
          )}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={c.gold}
              colors={[c.gold]}
            />
          }
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="⚠"
                title="Couldn’t load listings"
                subtitle="Check your connection and try again."
                actionLabel="Retry"
                onAction={refetch}
              />
            ) : (
              <EmptyState
                title="No properties found"
                subtitle="Try adjusting your search or filters."
                actionLabel={activeCount > 0 || q ? 'Reset filters' : undefined}
                onAction={activeCount > 0 || q ? resetAll : undefined}
              />
            )
          }
          ListFooterComponent={footer}
        />
      )}
      </SafeAreaView>

      {adVisible ? (
        <AdBanner
          onPress={() => navigation.navigate('PostProperty')}
          onClose={() => setAdVisible(false)}
        />
      ) : null}

      <FiltersSheet
        visible={sheetOpen}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setSheetOpen(false)}
        onApply={applyDraft}
        onReset={() => setDraft(DEFAULTS)}
      />
    </View>
  );
}

/** Brand-focused vertical ad pinned bottom-right above the tab bar. */
function AdBanner({onPress, onClose}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const enter = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 7,
      delay: 600,
    }).start();

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(bob, {toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );
    bobLoop.start();
    return () => bobLoop.stop();
  }, [enter, bob]);

  const spring = to =>
    Animated.spring(press, {toValue: to, useNativeDriver: true, speed: 40, bounciness: 8}).start();

  const wrapStyle = {
    opacity: enter,
    transform: [
      {translateY: enter.interpolate({inputRange: [0, 1], outputRange: [50, 0]})},
      {translateY: bob.interpolate({inputRange: [0, 1], outputRange: [0, -5]})},
      {scale: press},
    ],
  };

  return (
    <Animated.View style={[styles.ad, wrapStyle]}>
      <Pressable
        style={styles.adCard}
        onPress={onPress}
        onPressIn={() => spring(0.97)}
        onPressOut={() => spring(1)}>
        {/* ambient brand glow */}
        <View style={styles.adGlow} pointerEvents="none" />

        <Pressable hitSlop={10} onPress={onClose} style={styles.adClose}>
          <Icon name="x" size={13} color={c.textMuted} strokeWidth={2.4} />
        </Pressable>

        {/* logo hero */}
        <View style={styles.adLogoWrap}>
          <Logo width={120} align="center" />
        </View>

        <View style={styles.adDivider} />

        <View style={styles.adFree}>
          <Text style={styles.adFreeText}>LIST FOR FREE</Text>
        </View>

        <Text style={styles.adHeadline}>Sell or rent your{'\n'}property faster</Text>

        <View style={styles.adCta}>
          <Text style={styles.adCtaText}>Post now</Text>
          <Icon name="arrow-right" size={14} color={c.onGold} strokeWidth={2.4} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Subtle, always-on animated backdrop: slowly drifting gold orbs + grid. */
function BackgroundDecor() {
  const styles = useThemedStyles(makeStyles);
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v, dur) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
          Animated.timing(v, {toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        ]),
      );
    const l1 = loop(a, 7000);
    const l2 = loop(b, 9000);
    l1.start();
    l2.start();
    return () => {
      l1.stop();
      l2.stop();
    };
  }, [a, b]);

  const orb1 = {
    transform: [
      {translateY: a.interpolate({inputRange: [0, 1], outputRange: [0, 40]})},
      {translateX: a.interpolate({inputRange: [0, 1], outputRange: [0, -24]})},
      {scale: a.interpolate({inputRange: [0, 1], outputRange: [1, 1.15]})},
    ],
  };
  const orb2 = {
    transform: [
      {translateY: b.interpolate({inputRange: [0, 1], outputRange: [0, -50]})},
      {translateX: b.interpolate({inputRange: [0, 1], outputRange: [0, 30]})},
      {scale: b.interpolate({inputRange: [0, 1], outputRange: [1.1, 0.95]})},
    ],
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.orb, styles.orbTop, orb1]} />
      <Animated.View style={[styles.orb, styles.orbBottom, orb2]} />
    </View>
  );
}

function FiltersSheet({visible, draft, setDraft, onClose, onApply, onReset}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const set = (k, v) => setDraft(d => ({...d, [k]: v}));

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.sheetHead}>
        <Text style={styles.sheetTitle}>Filters</Text>
        <Pressable hitSlop={8} onPress={onReset} style={styles.clearAll}>
          <Icon name="x" size={13} color={c.gold} strokeWidth={2.2} />
          <Text style={styles.clearAllText}>Clear all</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.sheetScroll}
        contentContainerStyle={styles.sheetContent}>

        {/* Listing type */}
        <FilterGroup title="Listing type">
          <View style={styles.wrapRow}>
            {LISTING_TABS.map(t => (
              <SheetPill
                key={t.label}
                label={t.label}
                active={draft.listingType === t.key}
                onPress={() => set('listingType', t.key)}
              />
            ))}
          </View>
        </FilterGroup>

        {/* Property type */}
        <FilterGroup title="Property type">
          <View style={styles.wrapRow}>
            {TYPES.map(t => (
              <SheetPill
                key={t.label}
                icon={t.icon}
                label={t.label}
                active={draft.type === t.key}
                onPress={() => set('type', t.key)}
              />
            ))}
          </View>
        </FilterGroup>

        {/* Bedrooms */}
        <FilterGroup title="Bedrooms">
          <View style={styles.wrapRow}>
            {BHK_OPTIONS.map(b => (
              <SheetPill
                key={b.label}
                label={b.label}
                active={draft.bhk === b.key}
                onPress={() => set('bhk', b.key)}
                wide={b.key == null}
              />
            ))}
          </View>
        </FilterGroup>

        {/* Price */}
        <FilterGroup title="Price range">
          <View style={styles.wrapRow}>
            {PRICE_RANGES.map(p => (
              <SheetPill
                key={p.key}
                label={p.label}
                active={draft.priceKey === p.key}
                onPress={() => set('priceKey', p.key)}
              />
            ))}
          </View>
        </FilterGroup>

        {/* Sort */}
        <FilterGroup title="Sort by">
          <View style={styles.sortList}>
            {SORTS.map(s => {
              const active = draft.sort === s.key;
              return (
                <Pressable
                  key={s.key}
                  style={styles.sortRow}
                  onPress={() => set('sort', s.key)}>
                  <Text style={[styles.sortLabel, active && styles.sortLabelActive]}>
                    {s.label}
                  </Text>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </FilterGroup>

        <View style={{height: spacing.sm}} />
      </ScrollView>

      <View style={styles.sheetActions}>
        <Button title="Show results" onPress={onApply} style={styles.applyBtn} />
      </View>
    </BottomSheet>
  );
}

function FilterGroup({title, children}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SheetPill({icon, label, active, onPress, wide}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, wide && styles.pillWide, active && styles.pillActive]}>
      {icon ? (
        <Icon name={icon} size={14} color={active ? c.gold : c.textMuted} />
      ) : null}
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    safe: {flex: 1},
    orb: {
      position: 'absolute',
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: c.gold,
    },
    orbTop: {top: -120, right: -110, opacity: c.isDark ? 0.1 : 0.14},
    orbBottom: {bottom: -60, left: -130, opacity: c.isDark ? 0.07 : 0.1},
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    bellBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellDot: {
      position: 'absolute',
      top: 10,
      right: 11,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: c.gold,
      borderWidth: 1.5,
      borderColor: c.surface,
    },
    list: {paddingHorizontal: spacing.md, paddingBottom: spacing.xxl},
    headerWrap: {paddingTop: spacing.xs},
    hello: {color: c.textMuted, fontSize: 14, marginTop: spacing.sm},
    heading: {
      color: c.text,
      fontSize: 30,
      fontWeight: '700',
      fontFamily: 'serif',
      lineHeight: 34,
      marginTop: 2,
    },
    searchRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.md},
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 45,
    },
    searchInput: {flex: 1, color: c.text, fontSize: 15},
    clearBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.white06,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBtn: {
      width: 45,
      height: 45,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterDot: {
      position: 'absolute',
      top: -5,
      right: -5,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: c.bg,
    },
    filterDotText: {color: c.onGold, fontSize: 11, fontWeight: '800'},
    resultsLabel: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '600',
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    card: {marginBottom: spacing.md},
    footer: {alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, gap: spacing.sm},
    footerText: {color: c.textMuted, fontSize: 12.5},
    endRule: {width: 44, height: 1, backgroundColor: c.border},
    endText: {color: c.textMuted, fontSize: 12, letterSpacing: 0.3},

    // ----- brand ad card -----
    ad: {
      position: 'absolute',
      right: spacing.md,
      bottom: spacing.md,
      width: 184,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: {width: 0, height: 10},
      elevation: 12,
    },
    adCard: {
      backgroundColor: c.isDark ? c.surfaceAlt : c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.goldGlow,
      padding: spacing.md,
      overflow: 'hidden',
    },
    adGlow: {
      position: 'absolute',
      top: -50,
      alignSelf: 'center',
      width: 180,
      height: 120,
      borderRadius: 90,
      backgroundColor: c.gold,
      opacity: c.isDark ? 0.12 : 0.16,
    },
    adClose: {
      position: 'absolute',
      top: 6,
      right: 6,
      zIndex: 2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.white06,
      alignItems: 'center',
      justifyContent: 'center',
    },
    adLogoWrap: {alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.xs},
    adDivider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: spacing.sm,
    },
    adFree: {
      alignSelf: 'center',
      backgroundColor: c.goldFaint,
      borderWidth: 1,
      borderColor: c.goldGlow,
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    adFreeText: {
      color: c.gold,
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    adHeadline: {
      color: c.text,
      fontSize: 14.5,
      fontWeight: '700',
      fontFamily: 'serif',
      lineHeight: 19,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    adCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: c.gold,
      borderRadius: radius.md,
      paddingVertical: 9,
      marginTop: spacing.md,
    },
    adCtaText: {color: c.onGold, fontSize: 13, fontWeight: '800', letterSpacing: 0.2},

    // ----- sheet -----
    sheetHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    sheetTitle: {color: c.text, fontSize: 20, fontWeight: '700', fontFamily: 'serif'},
    clearAll: {flexDirection: 'row', alignItems: 'center', gap: 4},
    clearAllText: {color: c.gold, fontSize: 13, fontWeight: '700'},
    sheetScroll: {flexShrink: 1, marginTop: spacing.xs},
    sheetContent: {paddingBottom: spacing.sm},
    group: {marginTop: spacing.lg},
    groupTitle: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    wrapRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      height: 42,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    pillWide: {minWidth: 64, justifyContent: 'center'},
    pillActive: {borderColor: c.gold, backgroundColor: c.goldFaint},
    pillText: {color: c.textDim, fontSize: 13.5, fontWeight: '600'},
    pillTextActive: {color: c.gold, fontWeight: '700'},
    sortList: {gap: 2},
    sortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 48,
    },
    sortLabel: {color: c.textDim, fontSize: 15},
    sortLabelActive: {color: c.text, fontWeight: '700'},
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioActive: {borderColor: c.gold},
    radioDot: {width: 11, height: 11, borderRadius: 6, backgroundColor: c.gold},
    sheetActions: {
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.borderSoft,
      marginTop: spacing.xs,
    },
    applyBtn: {width: '100%'},
  });
