import React, {useEffect, useRef} from 'react';
import {Animated, Dimensions, Easing, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import {Logo} from './Logo';
import {spacing, useColors, useThemedStyles} from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Premium loader.
 * - Inline / small (buttons, rows): a gold gradient arc spins around a pulsing
 *   dot. `size`, `color` apply here.
 * - `fullscreen` / `brand`: the AUREVIA wordmark gently breathes while a gold
 *   shimmer sweeps along a hairline beneath it — a branded, on-theme loader.
 */
export function Loader({
  size = 44,
  label,
  fullscreen = false,
  brand,
  color,
  style,
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);

  // Brand loader whenever fullscreen (unless explicitly disabled) or brand=true.
  const isBrand = brand ?? fullscreen;

  if (isBrand) {
    const inner = <BrandMark styles={styles} label={label} />;
    return fullscreen ? (
      <View style={[styles.fullscreen, style]}>{inner}</View>
    ) : (
      <View style={[styles.inline, style]}>{inner}</View>
    );
  }

  return <Ring size={size} color={color} label={label} styles={styles} style={style} />;
}

/** Breathing AUREVIA wordmark + sweeping gold shimmer line. */
function BrandMark({styles, label}) {
  const breathe = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    breatheLoop.start();
    sweepLoop.start();
    return () => {
      breatheLoop.stop();
      sweepLoop.stop();
    };
  }, [breathe, sweep]);

  const TRACK = 132;
  const SEG = 46;

  const logoStyle = {
    opacity: breathe.interpolate({inputRange: [0, 1], outputRange: [0.55, 1]}),
    transform: [
      {scale: breathe.interpolate({inputRange: [0, 1], outputRange: [0.97, 1.03]})},
    ],
  };
  const segStyle = {
    transform: [
      {
        translateX: sweep.interpolate({
          inputRange: [0, 1],
          outputRange: [-SEG, TRACK],
        }),
      },
    ],
  };

  return (
    <View style={styles.brandWrap}>
      <Animated.View style={logoStyle}>
        <Logo width={132} align="center" />
      </Animated.View>
      <View style={[styles.track, {width: TRACK}]}>
        <Animated.View style={[styles.trackSeg, {width: SEG}, segStyle]} />
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

/** Spinning gold arc ring with a pulsing centre dot. */
function Ring({size, color, label, styles, style}) {
  const c = useColors();
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
        Animated.timing(pulse, {toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
  const stroke = Math.max(2.5, size * 0.07);
  const r = (size - stroke) / 2;
  const cxy = size / 2;
  const circ = 2 * Math.PI * r;
  const dot = size * 0.2;
  const dotScale = pulse.interpolate({inputRange: [0, 1], outputRange: [0.7, 1]});
  const dotOpacity = pulse.interpolate({inputRange: [0, 1], outputRange: [0.45, 1]});

  return (
    <View style={[styles.inline, style]}>
      <View style={[styles.ringWrap, {width: size, height: size}]}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={cxy} cy={cxy} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        </Svg>
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
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.bg,
    },
    brandWrap: {alignItems: 'center', gap: spacing.md},
    track: {
      height: 2,
      borderRadius: 1,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    trackSeg: {
      height: 2,
      borderRadius: 1,
      backgroundColor: c.gold,
    },
    label: {
      color: c.textMuted,
      fontSize: 11,
      letterSpacing: 2,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  });
