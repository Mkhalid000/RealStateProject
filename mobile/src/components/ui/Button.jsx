import React, {useRef} from 'react';
import {ActivityIndicator, Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {radius, shadow, spacing, useColors, useThemedStyles} from '../../theme';

/**
 * Premium pressable button with a spring press-in animation.
 * variants: primary (gold), outline, ghost, danger.
 * sizes: md (default), lg, sm.
 */
export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  textStyle,
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const spring = to =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const labelColor = isPrimary
    ? c.onGold
    : isDanger
    ? c.danger
    : c.gold;

  return (
    <Animated.View style={[{transform: [{scale}]}, isPrimary && shadow.glow, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => !isDisabled && spring(0.96)}
        onPressOut={() => spring(1)}
        style={[
          styles.base,
          size === 'lg' && styles.lg,
          size === 'sm' && styles.sm,
          isPrimary && styles.primary,
          variant === 'outline' && styles.outline,
          variant === 'ghost' && styles.ghost,
          isDanger && styles.dangerBtn,
          isDisabled && styles.disabled,
        ]}>
        {loading ? (
          <ActivityIndicator color={labelColor} />
        ) : (
          <View style={styles.row}>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <Text
              style={[
                styles.text,
                size === 'sm' && styles.textSm,
                {color: labelColor},
                textStyle,
              ]}>
              {title}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    base: {
      height: 54,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    lg: {height: 58},
    sm: {height: 42, borderRadius: radius.md, paddingHorizontal: spacing.md},
    row: {flexDirection: 'row', alignItems: 'center', gap: 8},
    icon: {fontSize: 16},
    primary: {backgroundColor: c.gold},
    outline: {borderWidth: 1.5, borderColor: c.gold, backgroundColor: 'transparent'},
    ghost: {backgroundColor: c.white06},
    dangerBtn: {
      borderWidth: 1.5,
      borderColor: 'rgba(239,107,107,0.5)',
      backgroundColor: 'rgba(239,107,107,0.08)',
    },
    disabled: {opacity: 0.45},
    text: {fontSize: 16, fontWeight: '700', letterSpacing: 0.3},
    textSm: {fontSize: 14},
  });
