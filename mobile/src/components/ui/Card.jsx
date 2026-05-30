import React from 'react';
import {StyleSheet, View} from 'react-native';
import {colors, radius, shadow, spacing} from '../../theme';

export function Card({children, style, padded = true}) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  padded: {padding: spacing.md},
});
