import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useColors} from '../../theme';

export const LOGO_ASPECT = 737 / 174; // ≈ 4.236, matches src/assets/logo.png

const SOURCE = require('../../assets/logo.png');

/**
 * AUREVIA brand wordmark (gold PNG, transparent bg — for dark surfaces).
 * Pass `width` (preferred) or `height`; the other dimension is derived from
 * the logo's aspect ratio. Optional tracked `subtitle` renders beneath.
 */
export function Logo({width = 160, height, subtitle, align = 'center', style}) {
  const c = useColors();
  const dims = height
    ? {height, width: height * LOGO_ASPECT}
    : {width, height: width / LOGO_ASPECT};

  return (
    <View style={[{alignItems: align === 'center' ? 'center' : 'flex-start'}, style]}>
      <Image source={SOURCE} style={dims} resizeMode="contain" />
      {subtitle ? (
        <Text
          style={[
            styles.sub,
            {color: c.textMuted, fontSize: Math.max(9, dims.height * 0.26)},
          ]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sub: {
    letterSpacing: 4,
    fontWeight: '600',
    marginTop: 5,
    textTransform: 'uppercase',
  },
});
