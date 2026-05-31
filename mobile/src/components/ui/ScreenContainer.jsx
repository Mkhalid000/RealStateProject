import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {spacing, useThemedStyles} from '../../theme';

export function ScreenContainer({children, padded = true, style}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.inner, padded && styles.padded, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    safe: {flex: 1, backgroundColor: c.bg},
    inner: {flex: 1},
    padded: {padding: spacing.md},
  });
