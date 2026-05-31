import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ScreenContainer} from './ScreenContainer';
import {spacing, useThemedStyles} from '../../theme';

/** Temporary screen body used until a feature phase fills it in. */
export function Placeholder({title, subtitle}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {subtitle ?? 'Coming in a later build phase.'}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    title: {color: c.text, fontSize: 22, fontWeight: '700'},
    subtitle: {color: c.textMuted, marginTop: spacing.sm, textAlign: 'center'},
  });
