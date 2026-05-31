import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import {spacing, useColors, useThemedStyles} from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Premium brand loader: a gold gradient arc spins around a softly pulsing
 * center dot. Use `<Loader />` inline, or `<Loader fullscreen label="…" />`
 * to fill a screen. `size` controls the ring diameter.
 */
export function Loader({size = 44, label, fullscreen = false, color, style}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const arcFrom = color || c.goldLight;
  const arcTo = color || c.gold;
  const dotColor = color || c.gold;
  const trackColor = color ? 'rgba(255,255,255,0.25)' : c.border;
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const stroke = Math.max(2.5, size * 0.07);
  const r = (size - stroke) / 2;
  const cxy = size / 2;
  const circ = 2 * Math.PI * r;

  const dot = size * 0.2;
  const dotScale = pulse.interpolate({inputRange: [0, 1], outputRange: [0.7, 1]});
  const dotOpacity = pulse.interpolate({inputRange: [0, 1], outputRange: [0.45, 1]});

  const ring = (
    <View style={[styles.ringWrap, {width: size, height: size}]}>
      {/* track */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={cxy}
          cy={cxy}
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
      </Svg>
      {/* spinning gold arc */}
      <Animated.View style={[StyleSheet.absoluteFill, {transform: [{rotate}]}]}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="loaderGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={arcFrom} />
              <Stop offset="1" stopColor={arcTo} />
            </LinearGradient>
          </Defs>
          <AnimatedCircle
            cx={cxy}
            cy={cxy}
            r={r}
            stroke="url(#loaderGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circ * 0.28} ${circ}`}
          />
        </Svg>
      </Animated.View>
      {/* pulsing center dot */}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: dotColor,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            opacity: dotOpacity,
            transform: [{scale: dotScale}],
          },
        ]}
      />
    </View>
  );

  if (fullscreen) {
    return (
      <View style={[styles.fullscreen, style]}>
        {ring}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.inline, style]}>
      {ring}
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    ringWrap: {alignItems: 'center', justifyContent: 'center'},
    dot: {backgroundColor: c.gold},
    inline: {alignItems: 'center', justifyContent: 'center', gap: spacing.sm},
    fullscreen: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.bg,
      gap: spacing.md,
    },
    label: {
      color: c.textMuted,
      fontSize: 12.5,
      letterSpacing: 1,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  });
