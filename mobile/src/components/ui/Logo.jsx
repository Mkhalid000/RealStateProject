import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useColors} from '../../theme';

export const LOGO_ASPECT = 737 / 174; // ≈ 4.236, matches src/assets/logo.png

// Gold wordmark for dark surfaces; dark-ink variant for the light theme.
const SOURCE_DARK = require('../../assets/logo.png');
const SOURCE_LIGHT = require('../../assets/darkLogo.png');

/**
 * AUREVIA brand wordmark. Auto-swaps artwork to match the active theme
 * (gold on dark, ink on light). Pass `width` (preferred) or `height`; the
 * other dimension is derived from the logo's aspect ratio. Optional tracked
 * `subtitle` renders beneath.
 */
export function Logo({width = 160, height, subtitle, align = 'center', style}) {
  const c = useColors();
  const dims = height
    ? {height, width: height * LOGO_ASPECT}
    : {width, height: width / LOGO_ASPECT};

  return (
    <View style={[{alignItems: align === 'center' ? 'center' : 'flex-start'}, style]}>
      <Image
        source={c.isDark ? SOURCE_DARK : SOURCE_LIGHT}
        style={dims}
        resizeMode="contain"
      />
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
