import React, {useEffect} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PropertyCard} from '../../components/PropertyCard';
import {EmptyState} from '../../components/ui/EmptyState';
import {AnimatedEntrance} from '../../components/ui/AnimatedEntrance';
import {useSavedStore} from '../../store/savedStore';
import {colors, spacing} from '../../theme';

export function SavedScreen({navigation}) {
  const {items, loaded, load} = useSavedStore();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>Your shortlisted properties</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({item, index}) => (
          <AnimatedEntrance delay={Math.min(index, 6) * 40}>
            <PropertyCard
              property={item}
              style={styles.card}
              onPress={() => navigation.navigate('PropertyDetail', {id: item.id, title: item.title})}
            />
          </AnimatedEntrance>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="♡"
            title="Nothing saved yet"
            subtitle="Tap the heart on any property to keep it here."
            actionLabel="Explore properties"
            onAction={() => navigation.navigate('Explore')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  header: {paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm},
  title: {color: colors.text, fontSize: 28, fontWeight: '700', fontFamily: 'serif'},
  subtitle: {color: colors.textMuted, fontSize: 14, marginTop: 2},
  list: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1},
  card: {marginBottom: spacing.lg},
});
