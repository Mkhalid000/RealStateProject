import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {radius, useColors, useThemedStyles} from '../../theme';

function tonesFor(c) {
  return {
    gold: {bg: c.goldFaint, fg: c.gold, bd: 'rgba(201,137,46,0.35)'},
    green: {bg: 'rgba(95,208,138,0.12)', fg: c.success, bd: 'rgba(95,208,138,0.35)'},
    red: {bg: 'rgba(239,107,107,0.12)', fg: c.danger, bd: 'rgba(239,107,107,0.35)'},
    neutral: {bg: c.white06, fg: c.textDim, bd: c.border},
  };
}

export function Badge({label, tone = 'neutral', style}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const tones = tonesFor(c);
  const t = tones[tone] || tones.neutral;
  return (
    <View style={[styles.badge, {backgroundColor: t.bg, borderColor: t.bd}, style]}>
      <Text style={[styles.text, {color: t.fg}]}>{label}</Text>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    text: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
  });
