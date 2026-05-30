import React, {useEffect, useRef} from 'react';
import {Animated, Easing} from 'react-native';

/**
 * Fade + slide-up entrance. Drop around any block; stagger with `delay`.
 * Uses the built-in Animated API (no native deps).
 */
export function AnimatedEntrance({
  children,
  delay = 0,
  offset = 18,
  duration = 520,
  style,
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [
            {
              translateY: t.interpolate({
                inputRange: [0, 1],
                outputRange: [offset, 0],
              }),
            },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
