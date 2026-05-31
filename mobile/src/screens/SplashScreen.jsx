import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import {useColors, useThemedStyles} from '../theme';
import {LOGO_ASPECT} from '../components/ui/Logo';

const LOGO_DARK = require('../assets/logo.png');
const LOGO_LIGHT = require('../assets/darkLogo.png');

/**
 * Editorial luxury splash: hairline rules draw open around the AUREVIA
 * wordmark, which settles in, while a slim progress rule fills along the
 * bottom. Pure ink + gold. Calls `onDone` when the sequence completes.
 */
const DURATION = 2400;
const LOGO_W = 232;

export function SplashScreen({onDone}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const ruleTop = useRef(new Animated.Value(0)).current;
  const ruleBottom = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(ruleTop, {toValue: 1, duration: 640, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.timing(ruleBottom, {toValue: 1, duration: 640, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
      ]),
      Animated.timing(word, {
        toValue: 1,
        duration: 720,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tagline, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION - 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    const t = setTimeout(() => onDone?.(), DURATION);
    return () => clearTimeout(t);
  }, [ruleTop, ruleBottom, word, tagline, progress, onDone]);

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <Animated.View style={[styles.rule, {opacity: ruleTop, transform: [{scaleX: ruleTop}]}]} />

        <Animated.Image
          source={c.isDark ? LOGO_DARK : LOGO_LIGHT}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              opacity: word,
              transform: [
                {translateY: word.interpolate({inputRange: [0, 1], outputRange: [12, 0]})},
                {scale: word.interpolate({inputRange: [0, 1], outputRange: [0.96, 1]})},
              ],
            },
          ]}
        />

        <Animated.View style={[styles.rule, {opacity: ruleBottom, transform: [{scaleX: ruleBottom}]}]} />

        <Animated.Text style={[styles.tagline, {opacity: tagline}]}>
          LUXURY  ·  REAL  ESTATE
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, {transform: [{scaleX: progress}]}]} />
        </View>
        <Animated.Text style={[styles.footerText, {opacity: tagline}]}>
          CURATED  RESIDENCES
        </Animated.Text>
      </View>
    </View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center'},
    center: {alignItems: 'center', paddingHorizontal: 40},
    logo: {width: LOGO_W, height: LOGO_W / LOGO_ASPECT, marginVertical: 20},
    rule: {
      width: 190,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.isDark ? 'rgba(242,166,90,0.6)' : 'rgba(192,137,46,0.7)',
    },
    tagline: {
      color: c.textMuted,
      fontSize: 10.5,
      letterSpacing: 4,
      marginTop: 18,
      fontWeight: '600',
    },
    footer: {position: 'absolute', bottom: 56, alignItems: 'center', width: '100%'},
    progressTrack: {
      width: 64,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    progressFill: {width: '100%', height: '100%', backgroundColor: c.gold, alignSelf: 'flex-start'},
    footerText: {
      color: c.textMuted,
      fontSize: 9,
      letterSpacing: 3,
      marginTop: 16,
      fontWeight: '600',
      opacity: 0.7,
    },
  });
