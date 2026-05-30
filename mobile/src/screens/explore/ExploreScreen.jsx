import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PropertyCard} from '../../components/PropertyCard';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PropertyCardSkeleton} from '../../components/ui/Skeleton';
import {Logo} from '../../components/ui/Logo';
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {flattenPages, usePropertiesFeed} from '../../hooks/useProperties';
import {useDebounced} from '../../hooks/useDebounced';
import {useAuthStore} from '../../store/authStore';
import {colors, radius, spacing} from '../../theme';

const LISTING_TABS = [
  {key: undefined, label: 'All'},
  {key: 'buy', label: 'Buy'},
  {key: 'rent', label: 'Rent'},
];

const TYPES = [
  {key: undefined, label: 'All types'},
  {key: 'apartment', label: 'Apartment'},
  {key: 'villa', label: 'Villa'},
  {key: 'plot', label: 'Plot'},
  {key: 'commercial', label: 'Commercial'},
  {key: 'office', label: 'Office'},
  {key: 'shop', label: 'Shop'},
];

export function ExploreScreen({navigation}) {
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [listingType, setListingType] = useState(undefined);
  const [type, setType] = useState(undefined);
  const q = useDebounced(search, 400);

  const filters = useMemo(
    () => ({
      ...(q ? {q} : {}),
      ...(listingType ? {listingType} : {}),
      ...(type ? {type} : {}),
      sort: 'newest',
    }),
    [q, listingType, type],
  );

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

  const header = (
    <View>
      <Text style={styles.hello}>
        Hello{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} 👋
      </Text>
      <Text style={styles.heading}>Discover your{'\n'}perfect space</Text>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search city, locality, agent…"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search ? (
          <Text style={styles.clear} onPress={() => setSearch('')}>
            ✕
          </Text>
        ) : null}
      </View>

      <View style={styles.segment}>
        {LISTING_TABS.map(t => (
          <Chip
            key={t.label}
            label={t.label}
            active={listingType === t.key}
            onPress={() => setListingType(t.key)}
            style={styles.segChip}
          />
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typesRow}>
        {TYPES.map(t => (
          <Chip
            key={t.label}
            label={t.label}
            active={type === t.key}
            onPress={() => setType(t.key)}
          />
        ))}
      </ScrollView>

      <Text style={styles.resultsLabel}>
        {isLoading ? 'Loading…' : `${items.length} ${items.length === 1 ? 'property' : 'properties'}`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topbar}>
        <Logo width={132} align="left" />
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.list}>
          {header}
          {[0, 1, 2].map(i => (
            <PropertyCardSkeleton key={i} />
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
                onPress={() => navigation.navigate('PropertyDetail', {id: item.id, title: item.title})}
              />
            </AnimatedEntrance>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasNextPage && fetchNextPage()}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.gold}
              colors={[colors.gold]}
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
              />
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.gold} style={{marginVertical: spacing.lg}} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  topbar: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs},
  list: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl},
  hello: {color: colors.textMuted, fontSize: 14, marginTop: spacing.sm},
  heading: {color: colors.text, fontSize: 30, fontWeight: '700', fontFamily: 'serif', lineHeight: 34, marginTop: 2},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 50,
    marginTop: spacing.lg,
  },
  searchIcon: {color: colors.gold, fontSize: 20, marginRight: spacing.sm},
  searchInput: {flex: 1, color: colors.text, fontSize: 15},
  clear: {color: colors.textMuted, fontSize: 15, paddingLeft: spacing.sm},
  segment: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md},
  segChip: {flex: 1},
  typesRow: {gap: spacing.sm, paddingVertical: spacing.md, paddingRight: spacing.lg},
  resultsLabel: {color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: spacing.md},
  card: {marginBottom: spacing.lg},
});
