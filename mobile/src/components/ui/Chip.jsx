import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {radius, spacing, useThemedStyles} from '../../theme';

/** Toggleable filter pill. */
export function Chip({label, active, onPress, style}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.chip,
        active && styles.active,
        pressed && {opacity: 0.8},
        style,
      ]}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: spacing.md,
      height: 38,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    active: {backgroundColor: c.gold, borderColor: c.gold},
    text: {color: c.textDim, fontSize: 13.5, fontWeight: '600'},
    textActive: {color: c.onGold, fontWeight: '700'},
  });
