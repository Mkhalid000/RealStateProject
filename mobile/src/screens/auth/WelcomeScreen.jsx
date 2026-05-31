import React, {useCallback, useEffect, useRef} from 'react';
import {Animated, Easing, ImageBackground, Platform, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {Button} from '../../components/ui/Button';
import {Logo} from '../../components/ui/Logo';
import {colors, spacing} from '../../theme';

const HERO =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

export function WelcomeScreen({navigation}) {
  const fade = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 800,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // slow Ken-Burns zoom on the hero
    Animated.loop(
      Animated.sequence([
        Animated.timing(zoom, {toValue: 1.12, duration: 9000, useNativeDriver: true}),
        Animated.timing(zoom, {toValue: 1, duration: 9000, useNativeDriver: true}),
      ]),
    ).start();
  }, [fade, zoom]);

  // While focused, let the hero bleed behind a transparent status bar
  // (immersive). We do NOT reset on blur — the destination screen (Login /
  // SignUp) owns its own status bar, so resetting here would race and win,
  // leaving a wrong (dark) bar on those screens.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent');
      }
    }, []),
  );

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, {transform: [{scale: zoom}]}]}>
        <ImageBackground source={{uri: HERO}} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </Animated.View>
      <View style={styles.scrim} />
      <View style={styles.scrimBottom} />

      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.top, {opacity: fade}]}>
          <Logo width={170} subtitle="Luxury Real Estate" />
        </Animated.View>

        <Animated.View
          style={[
            styles.bottom,
            {
              opacity: fade,
              transform: [
                {translateY: fade.interpolate({inputRange: [0, 1], outputRange: [30, 0]})},
              ],
            },
          ]}>
          <Text style={styles.kicker}>FIND YOUR NEXT</Text>
          <Text style={styles.headline}>Address of{'\n'}Distinction</Text>
          <Text style={styles.sub}>
            Explore curated homes through immersive reels, connect with trusted
            agents, and list your own — all in one place.
          </Text>

          <Button
            title="Get Started"
            size="lg"
            style={styles.cta}
            onPress={() => navigation.navigate('SignUp')}
          />
          <Button
            title="I already have an account"
            variant="ghost"
            style={styles.ghost}
            onPress={() => navigation.navigate('Login')}
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  scrim: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,15,12,0.35)'},
  scrimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    backgroundColor: 'rgba(15, 11, 10, 0.53)',
  },
  safe: {flex: 1, justifyContent: 'space-between', padding: spacing.lg},
  top: {alignItems: 'flex-start', marginTop: spacing.sm},
  bottom: {paddingBottom: spacing.md},
  kicker: {color: colors.gold, letterSpacing: 3, fontSize: 12, fontWeight: '700', marginBottom: spacing.sm},
  headline: {color: colors.text, fontSize: 42, fontWeight: '700', fontFamily: 'serif', lineHeight: 46},
  sub: {color: colors.textDim, fontSize: 14.5, lineHeight: 21, marginTop: spacing.md, marginBottom: spacing.xl},
  cta: {marginBottom: spacing.sm},
  ghost: {},
});
