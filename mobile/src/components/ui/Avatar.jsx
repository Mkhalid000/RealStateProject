import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {colors} from '../../theme';

/** Circular avatar — shows the image if present, else a gold gradient initial. */
export function Avatar({uri, name, size = 48, ring = false}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  return (
    <View style={[styles.ringWrap, ring && {padding: 2, borderColor: colors.gold, borderWidth: 1.5, borderRadius: (size + 6) / 2}]}>
      {uri ? (
        <Image source={{uri}} style={style} />
      ) : (
        <View style={[style, styles.fallback]}>
          <Text style={[styles.initial, {fontSize: size * 0.42}]}>{initial}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ringWrap: {alignItems: 'center', justifyContent: 'center'},
  fallback: {backgroundColor: colors.goldDark, alignItems: 'center', justifyContent: 'center'},
  initial: {color: colors.bgSoft, fontWeight: '800'},
});
