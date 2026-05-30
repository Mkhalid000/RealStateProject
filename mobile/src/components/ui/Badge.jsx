import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, radius} from '../../theme';

const TONES = {
  gold: {bg: colors.goldFaint, fg: colors.gold, bd: 'rgba(242,166,90,0.35)'},
  green: {bg: 'rgba(95,208,138,0.12)', fg: colors.success, bd: 'rgba(95,208,138,0.35)'},
  red: {bg: 'rgba(239,107,107,0.12)', fg: colors.danger, bd: 'rgba(239,107,107,0.35)'},
  neutral: {bg: colors.white06, fg: colors.textDim, bd: colors.border},
};

export function Badge({label, tone = 'neutral', style}) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.badge, {backgroundColor: t.bg, borderColor: t.bd}, style]}>
      <Text style={[styles.text, {color: t.fg}]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: {fontSize: 10.5, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase'},
});
