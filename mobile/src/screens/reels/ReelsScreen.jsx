import React, {useCallback, useRef, useState} from 'react';
import {Dimensions, FlatList, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useIsFocused} from '@react-navigation/native';
import {EmptyState} from '../../components/ui/EmptyState';
import {Loader} from '../../components/ui/Loader';
import {ReelItem} from './ReelItem';
import {flattenPages} from '../../hooks/useProperties';
import {useReelFeed} from '../../hooks/useReels';

export function ReelsScreen({navigation}) {
  const isFocused = useIsFocused();
  const [activeIndex, setActiveIndex] = useState(0);
  const [height, setHeight] = useState(Dimensions.get('window').height);

  const {data, isLoading, isError, refetch, fetchNextPage, hasNextPage} =
    useReelFeed();
  const items = flattenPages(data);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }).current;

  const onViewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderItem = useCallback(
    ({item, index}) => (
      <ReelItem
        reel={item}
        height={height}
        active={isFocused && index === activeIndex}
        onOpenProperty={id => navigation.navigate('PropertyDetail', {id})}
        onOpenAgent={agent => navigation.navigate('AgentProfile', {agent})}
      />
    ),
    [height, isFocused, activeIndex, navigation],
  );

  const keyExtractor = useCallback(r => r.id, []);

  const getItemLayout = useCallback(
    (_, index) => ({length: height, offset: height * index, index}),
    [height],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  if (isLoading) {
    return <Loader fullscreen />;
  }

  if (isError || items.length === 0) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="🎬"
          title={isError ? "Couldn't load reels" : 'No reels yet'}
          subtitle={
            isError
              ? 'Check your connection and try again.'
              : "Agents haven't posted any reels yet. Check back soon."
          }
          actionLabel="Refresh"
          onAction={refetch}
        />
      </View>
    );
  }

  return (
    <View
      style={styles.root}
      onLayout={e => setHeight(e.nativeEvent.layout.height)}>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        // Performance
        windowSize={3}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={50}
        initialNumToRender={1}
        removeClippedSubviews
        getItemLayout={getItemLayout}
        // Viewability
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        // Infinite scroll
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        // Stability
        disableIntervalMomentum
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  center: {flex: 1, backgroundColor: '#1B1818', alignItems: 'center', justifyContent: 'center'},
});
