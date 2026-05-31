import React, {useCallback, useRef, useState} from 'react';
import {Dimensions, FlatList, StyleSheet, Text, View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {EmptyState} from '../../components/ui/EmptyState';
import {Loader} from '../../components/ui/Loader';
import {ReelItem} from './ReelItem';
import {flattenPages} from '../../hooks/useProperties';
import {useReelFeed} from '../../hooks/useReels';
import {colors} from '../../theme';

export function ReelsScreen({navigation}) {
  const isFocused = useIsFocused();
  const [activeIndex, setActiveIndex] = useState(0);
  const [height, setHeight] = useState(Dimensions.get('window').height);

  const {data, isLoading, isError, refetch, fetchNextPage, hasNextPage} =
    useReelFeed();
  const items = flattenPages(data);

  const viewabilityConfig = useRef({itemVisiblePercentThreshold: 80}).current;
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
        onOpenProperty={id =>
          navigation.navigate('PropertyDetail', {id})
        }
      />
    ),
    [height, isFocused, activeIndex, navigation],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (isError || items.length === 0) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="🎬"
          title={isError ? 'Couldn’t load reels' : 'No reels yet'}
          subtitle={
            isError
              ? 'Check your connection and try again.'
              : 'Agents haven’t posted any reels yet. Check back soon.'
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
        keyExtractor={r => r.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        windowSize={3}
        maxToRenderPerBatch={3}
        initialNumToRender={2}
        removeClippedSubviews
        getItemLayout={(_, index) => ({length: height, offset: height * index, index})}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        onEndReachedThreshold={0.5}
        onEndReached={() => hasNextPage && fetchNextPage()}
      />
      <View style={styles.titleOverlay} pointerEvents="none">
        <Text style={styles.title}>Reels</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  center: {flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center'},
  titleOverlay: {position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center'},
  title: {color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: 'serif', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6},
});
