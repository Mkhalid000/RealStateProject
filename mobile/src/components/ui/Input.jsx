import React, {useRef, useState} from 'react';
import {Animated, Platform, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {Icon} from './Icon';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

/**
 * Labeled text field with an animated gold focus glow, an optional leading
 * SVG icon (`icon` = Icon name) and a built-in password show/hide toggle
 * (pass `secureTextEntry`).
 */
export function Input({
  label,
  icon,
  error,
  secureTextEntry,
  compact,
  style,
  containerStyle,
  ...rest
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
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
    ? c.danger
    : glow.interpolate({
        inputRange: [0, 1],
        outputRange: [c.border, c.gold],
      });

  const iconColor = error ? c.danger : focused ? c.gold : c.textMuted;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      ) : null}
      <Animated.View
        style={[
          styles.field,
          compact && styles.fieldCompact,
          rest.multiline && styles.fieldMultiline,
          {borderColor},
          focused && styles.fieldFocused,
        ]}>
        {icon ? <Icon name={icon} size={19} color={iconColor} style={styles.icon} /> : null}
        <TextInput
          placeholderTextColor={c.textMuted}
          secureTextEntry={hidden}
          style={[styles.input, rest.multiline && styles.inputMultiline, style]}
          selectionColor={c.gold}
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
          <Pressable onPress={() => setHidden(h => !h)} hitSlop={10} style={styles.eyeBtn}>
            <Icon name={hidden ? 'eye-off' : 'eye'} size={19} color={c.textMuted} />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    wrap: {marginBottom: spacing.md},
    label: {
      color: c.textMuted,
      marginBottom: 7,
      fontSize: 11.5,
      letterSpacing: 0.8,
      fontWeight: '700',
    },
    labelFocused: {color: c.gold},
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 56,
    },
    fieldCompact: {height: 50},
    // Multiline grows downward and keeps text/placeholder pinned to the top.
    fieldMultiline: {height: undefined, minHeight: 56, alignItems: 'flex-start', paddingVertical: spacing.sm},
    fieldFocused: {backgroundColor: c.surfaceAlt},
    icon: {marginRight: spacing.sm},
    input: {flex: 1, color: c.text, fontSize: 14, height: '100%'},
    inputMultiline: {height: undefined, textAlignVertical: 'top', paddingTop: Platform.OS === 'ios' ? 2 : 0},
    eyeBtn: {paddingLeft: spacing.sm},
    error: {color: c.danger, fontSize: 12, marginTop: 5, marginLeft: 2},
  });
