import React, {useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {colors, radius, spacing} from '../../theme';

/**
 * Labeled text field with an animated gold focus glow, optional leading icon
 * and a built-in password show/hide toggle (pass `secureTextEntry`).
 */
export function Input({
  label,
  icon,
  error,
  secureTextEntry,
  style,
  containerStyle,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const glow = useRef(new Animated.Value(0)).current;

  const animate = to =>
    Animated.timing(glow, {
      toValue: to,
      duration: 180,
      useNativeDriver: false,
    }).start();

  const borderColor = error
    ? colors.danger
    : glow.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, colors.gold],
      });

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      ) : null}
      <Animated.View
        style={[
          styles.field,
          {borderColor},
          focused && styles.fieldFocused,
        ]}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          style={[styles.input, style]}
          onFocus={e => {
            setFocused(true);
            animate(1);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            animate(0);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden(h => !h)} hitSlop={10}>
            <Text style={styles.eye}>{hidden ? '👁' : '🙈'}</Text>
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {marginBottom: spacing.md},
  label: {color: colors.textMuted, marginBottom: 6, fontSize: 12.5, letterSpacing: 0.4, fontWeight: '600'},
  labelFocused: {color: colors.gold},
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 54,
  },
  fieldFocused: {backgroundColor: colors.surfaceAlt},
  icon: {fontSize: 16, marginRight: spacing.sm, opacity: 0.8},
  input: {flex: 1, color: colors.text, fontSize: 16, height: '100%'},
  eye: {fontSize: 18, paddingLeft: spacing.sm},
  error: {color: colors.danger, fontSize: 12, marginTop: 5, marginLeft: 2},
});
