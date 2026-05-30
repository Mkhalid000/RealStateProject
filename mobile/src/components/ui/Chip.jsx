import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {colors, radius, spacing} from '../../theme';

/** Toggleable filter pill. */
export function Chip({label, active, onPress, style}) {
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

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {backgroundColor: colors.gold, borderColor: colors.gold},
  text: {color: colors.textDim, fontSize: 13.5, fontWeight: '600'},
  textActive: {color: colors.bgSoft, fontWeight: '700'},
});
