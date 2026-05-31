import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQueryClient} from '@tanstack/react-query';
import {Badge} from '../../components/ui/Badge';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {useMyProperties} from '../../hooks/useProperties';
import {deleteProperty} from '../../lib/properties';
import {coverImage, listingLabel, money} from '../../lib/format';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const TABS = [
  {key: 'all', label: 'All'},
  {key: 'verified', label: 'Live'},
  {key: 'pending', label: 'Under Review'},
  {key: 'rejected', label: 'Rejected'},
];

const STATUS = {
  verified: {label: 'Live', tone: 'green'},
  pending: {label: 'Under review', tone: 'gold'},
  rejected: {label: 'Rejected', tone: 'red'},
};

export function MyPropertiesScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const qc = useQueryClient();
  const [tab, setTab] = useState('all');
  const {data, isLoading, refetch, isRefetching} = useMyProperties(tab);
  const [busyId, setBusyId] = useState(null);

  const items = data?.items ?? [];

  function confirmDelete(id) {
    Alert.alert('Delete listing', 'Pakka delete karna hai?', [
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
      Alert.alert('Error', 'Delete nahi ho paya.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map(t => (
            <Chip key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key)} />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.gold} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({item}) => {
            const st = STATUS[item.verificationStatus] || STATUS.pending;
            return (
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate('PropertyDetail', {id: item.id})}>
                <Image source={{uri: coverImage(item)}} style={styles.rowImg} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.rowPrice}>{money(item.price, item.currency)} · {listingLabel(item)}</Text>
                  <Badge label={st.label} tone={st.tone} style={{marginTop: 6}} />
                </View>
                <Pressable
                  style={styles.del}
                  hitSlop={8}
                  onPress={() => confirmDelete(item.id)}>
                  {busyId === item.id ? (
                    <ActivityIndicator color={c.danger} size="small" />
                  ) : (
                    <Text style={styles.delGlyph}>🗑</Text>
                  )}
                </Pressable>
              </Pressable>
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

      <SafeAreaView edges={['bottom']} style={styles.fabBar}>
        <Button title="Post a Property" icon="＋" onPress={() => navigation.navigate('PostProperty')} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const makeStyles = c =>
  StyleSheet.create({
  root: {flex: 1, backgroundColor: c.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  tabs: {borderBottomWidth: 1, borderBottomColor: c.borderSoft},
  tabsRow: {gap: spacing.sm, padding: spacing.md},
  list: {padding: spacing.lg, paddingBottom: 120, flexGrow: 1},
  row: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderSoft, padding: spacing.sm, marginBottom: spacing.md},
  rowImg: {width: 80, height: 80, borderRadius: radius.md, backgroundColor: c.surface2},
  rowBody: {flex: 1},
  rowTitle: {color: c.text, fontSize: 15, fontWeight: '700'},
  rowPrice: {color: c.textDim, fontSize: 13, marginTop: 2},
  del: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  delGlyph: {fontSize: 18},
  fabBar: {position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, backgroundColor: c.bgSoft, borderTopWidth: 1, borderTopColor: c.border},
  });
