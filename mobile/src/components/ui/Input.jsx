import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {colors, radius, spacing} from '../../theme';

export function Input({label, style, ...rest}) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {marginBottom: spacing.md},
  label: {color: colors.textMuted, marginBottom: spacing.xs, fontSize: 13},
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    height: 50,
    fontSize: 16,
  },
});
