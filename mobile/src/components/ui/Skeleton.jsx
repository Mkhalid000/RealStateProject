import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {colors, radius} from '../../theme';

/** Shimmering placeholder block used while content loads. */
export function Skeleton({width = '100%', height = 16, style, round}) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 700, useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0.4, duration: 700, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.base,
        {width, height, borderRadius: round ? height / 2 : radius.sm, opacity: pulse},
        style,
      ]}
    />
  );
}

/** Card-shaped skeleton matching the property card layout. */
export function PropertyCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={190} style={{borderRadius: radius.lg}} />
      <View style={{padding: 14, gap: 10}}>
        <Skeleton width="55%" height={20} />
        <Skeleton width="80%" height={13} />
        <Skeleton width="40%" height={13} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {backgroundColor: colors.surface2},
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    marginBottom: 16,
  },
});
