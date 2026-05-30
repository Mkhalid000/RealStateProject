import React, {useRef} from 'react';
import {Animated, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {Badge} from './ui/Badge';
import {colors, radius, shadow, spacing} from '../theme';
import {coverImage, listingLabel, locationLine, money} from '../lib/format';
import {useSavedStore} from '../store/savedStore';

/** Premium property card used across Explore / Saved / Profile lists. */
export function PropertyCard({property, onPress, style}) {
  const scale = useRef(new Animated.Value(1)).current;
  const area = property.carpetArea ?? property.superBuiltUpArea;
  const saved = useSavedStore(s => s.ids.has(property.id));
  const toggleSaved = useSavedStore(s => s.toggle);

  const spring = to =>
    Animated.spring(scale, {toValue: to, useNativeDriver: true, speed: 30, bounciness: 5}).start();

  return (
    <Animated.View style={[{transform: [{scale}]}, shadow.card, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => spring(0.98)}
        onPressOut={() => spring(1)}
        style={styles.card}>
        <View style={styles.imageWrap}>
          <Image source={{uri: coverImage(property)}} style={styles.image} />
          <View style={styles.scrim} />

          <View style={styles.topRow}>
            <Badge label={property.type} tone="neutral" style={styles.badgeBlur} />
            <Badge label={listingLabel(property)} tone="neutral" style={styles.badgeBlur} />
            {property.featured ? <Badge label="★ Featured" tone="gold" /> : null}
          </View>

          <Pressable
            style={styles.fav}
            hitSlop={8}
            onPress={() => toggleSaved(property)}>
            <Text style={[styles.favGlyph, saved && {color: colors.danger}]}>
              {saved ? '♥' : '♡'}
            </Text>
          </Pressable>

          <View style={styles.priceWrap}>
            <Text style={styles.price}>{money(property.price, property.currency)}</Text>
            {property.priceNegotiable ? (
              <Text style={styles.negotiable}>Negotiable</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {property.title}
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            ◍ {locationLine(property)}
          </Text>

          <View style={styles.specs}>
            {property.bhk != null ? <Spec icon="◳" label={`${property.bhk} BHK`} /> : null}
            {property.bathrooms != null ? <Spec icon="◴" label={`${property.bathrooms} Bath`} /> : null}
            {area != null ? <Spec icon="◰" label={`${area} sqft`} /> : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Spec({icon, label}) {
  return (
    <View style={styles.spec}>
      <Text style={styles.specIcon}>{icon}</Text>
      <Text style={styles.specText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  imageWrap: {height: 200, backgroundColor: colors.surface2},
  image: {width: '100%', height: '100%'},
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,16,16,0.18)',
  },
  topRow: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: 54,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badgeBlur: {backgroundColor: 'rgba(20,16,16,0.55)', borderColor: 'rgba(255,255,255,0.18)'},
  fav: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,16,16,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favGlyph: {color: '#fff', fontSize: 19, lineHeight: 21},
  priceWrap: {position: 'absolute', bottom: spacing.sm, left: spacing.md, flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  price: {color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8},
  negotiable: {color: 'rgba(255,255,255,0.8)', fontSize: 11, marginBottom: 4},
  body: {padding: spacing.md},
  title: {color: colors.text, fontSize: 17, fontWeight: '700'},
  location: {color: colors.textMuted, fontSize: 13, marginTop: 4},
  specs: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: spacing.sm},
  spec: {flexDirection: 'row', alignItems: 'center', gap: 5},
  specIcon: {color: colors.gold, fontSize: 13},
  specText: {color: colors.textDim, fontSize: 13},
});
