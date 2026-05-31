import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {radius, spacing, useThemedStyles} from '../../theme';

const {height: SCREEN_H} = Dimensions.get('window');

/**
 * Lightweight bottom sheet built on RN Modal + Animated + PanResponder
 * (no native deps). Backdrop fades, panel slides up. Dismiss by tapping the
 * backdrop or dragging the handle down past a threshold.
 *
 * A single `translateY` value drives both the enter/exit animation and the
 * drag — mixing a native-driven composite with JS setValue breaks the drag,
 * so everything stays on one JS-driven value.
 */
export function BottomSheet({visible, onClose, children}) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const open = () => {
    Animated.parallel([
      Animated.timing(fade, {toValue: 1, duration: 220, useNativeDriver: true}),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
        mass: 0.6,
      }),
    ]).start();
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(fade, {toValue: 0, duration: 200, useNativeDriver: true}),
      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => onClose?.());
  };

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_H);
      fade.setValue(0);
      open();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Drag the handle down to dismiss; release past threshold closes.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 0.8) {
          close();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 220,
            mass: 0.6,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, {opacity: fade}]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md),
              transform: [{translateY}],
            },
          ]}>
          <View style={styles.handleZone} {...pan.panHandlers}>
            <View style={styles.handle} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, justifyContent: 'flex-end'},
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: c.overlay},
    sheet: {
      backgroundColor: c.bgSoft,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: c.border,
      paddingHorizontal: spacing.lg,
      maxHeight: '88%',
    },
    handleZone: {
      alignSelf: 'stretch',
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.border,
    },
  });
