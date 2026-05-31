import React from 'react';
import {StyleSheet, View} from 'react-native';
import {radius, shadow, spacing, useThemedStyles} from '../../theme';

export function Card({children, style, padded = true}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.card, padded && styles.padded, style]}>{children}</View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      ...shadow.card,
    },
    padded: {padding: spacing.md},
  });
