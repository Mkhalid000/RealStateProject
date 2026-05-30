import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing} from '../theme';

const ICONS = {
  Explore: '◎',
  Reels: '▶',
  Saved: '♥',
  Profile: '◐',
};
const LABELS = {
  Explore: 'Explore',
  Reels: 'Reels',
  Saved: 'Saved',
  Profile: 'Profile',
};

/** Custom bottom bar with an animated gold dot + scale on the active tab. */
export function TabBar({state, navigation}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, {paddingBottom: Math.max(insets.bottom, 10)}]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return (
          <TabItem
            key={route.key}
            focused={focused}
            icon={ICONS[route.name]}
            label={LABELS[route.name]}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

function TabItem({focused, icon, label, onPress}) {
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(v, {toValue: focused ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 8}).start();
  }, [focused, v]);

  const scale = v.interpolate({inputRange: [0, 1], outputRange: [1, 1.12]});
  const translateY = v.interpolate({inputRange: [0, 1], outputRange: [0, -2]});

  return (
    <Pressable style={styles.item} onPress={onPress} hitSlop={6}>
      <Animated.Text
        style={[
          styles.icon,
          {color: focused ? colors.gold : colors.textMuted, transform: [{scale}, {translateY}]},
        ]}>
        {icon}
      </Animated.Text>
      <Text style={[styles.label, {color: focused ? colors.gold : colors.textMuted}]}>{label}</Text>
      <Animated.View style={[styles.dot, {opacity: v, transform: [{scale: v}]}]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSoft,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  item: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3},
  icon: {fontSize: 22},
  label: {fontSize: 10.5, fontWeight: '600', letterSpacing: 0.3},
  dot: {width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold, marginTop: 1},
});
