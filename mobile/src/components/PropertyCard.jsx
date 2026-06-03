import React, {useRef, useState} from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Icon} from './ui/Icon';
import {radius, shadow, spacing, useColors, useThemedStyles} from '../theme';
import {
  coverImage,
  FALLBACK_IMG,
  listingLabel,
  locationLine,
  money,
} from '../lib/format';
import {useSavedStore} from '../store/savedStore';

/** Premium property card used across Explore / Saved / Profile lists.
 * Pass `statusBadge` to overlay a verification status on the image.
 * Pass `onDelete` to show a trash icon inline with the type chip. */
export function PropertyCard({property, onPress, style, statusBadge, onDelete}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const scale = useRef(new Animated.Value(1)).current;
  const heart = useRef(new Animated.Value(1)).current;
  const [imgW, setImgW] = useState(0);
  const [active, setActive] = useState(0);

  const area = property.carpetArea ?? property.superBuiltUpArea;
  const saved = useSavedStore(s => s.ids.has(property.id));
  const toggleSaved = useSavedStore(s => s.toggle);

  const images = property.imageUrls?.length
    ? property.imageUrls
    : [coverImage(property) || FALLBACK_IMG];

  const spring = to =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
    }).start();

  const onHeart = () => {
    toggleSaved(property);
    heart.setValue(0.6);
    Animated.spring(heart, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 12,
    }).start();
  };

  const onScroll = e => {
    if (!imgW) {
      return;
    }
    const i = Math.round(e.nativeEvent.contentOffset.x / imgW);
    if (i !== active) {
      setActive(i);
    }
  };

  const typeLabel = property.type
    ? property.type.charAt(0).toUpperCase() + property.type.slice(1)
    : 'Property';

  return (
    <Animated.View style={[{transform: [{scale}]}, shadow.card, styles.card, style]}>
      <View
        style={styles.imageWrap}
        onLayout={e => setImgW(e.nativeEvent.layout.width)}>
        {/* Swipeable image carousel — each frame taps through to details */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          nestedScrollEnabled>
          {images.map((src, i) => (
            <Pressable
              key={i}
              onPress={onPress}
              style={{width: imgW || undefined, height: '100%'}}>
              <Image source={{uri: src}} style={styles.image} />
            </Pressable>
          ))}
        </ScrollView>

          {/* layered scrims for depth + legibility */}
          <View style={styles.scrimTop} pointerEvents="none" />
          <View style={styles.scrimBottom} pointerEvents="none" />

          {/* top row: listing + featured + status / heart */}
          <View style={styles.topRow} pointerEvents="box-none">
            <View style={styles.tags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{listingLabel(property)}</Text>
              </View>
              {property.featured ? (
                <View style={styles.featured}>
                  <Icon name="star" size={11} color={c.onGold} />
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              ) : null}
              {statusBadge ? (
                <View style={styles.statusTag}>
                  <View style={[styles.statusDot, {backgroundColor: statusBadge.color}]} />
                  <Icon name={statusBadge.icon} size={11} color={statusBadge.color} />
                  <Text style={[styles.statusTagText, {color: statusBadge.color}]}>{statusBadge.label}</Text>
                </View>
              ) : null}
            </View>

            {!onDelete ? (
              <Animated.View style={{transform: [{scale: heart}]}}>
                <Pressable style={styles.fav} hitSlop={8} onPress={onHeart}>
                  <Icon
                    name="heart"
                    size={18}
                    color={saved ? c.danger : '#fff'}
                    strokeWidth={2}
                  />
                </Pressable>
              </Animated.View>
            ) : null}
          </View>

          {/* paging dots */}
          {images.length > 1 ? (
            <View style={styles.dots} pointerEvents="none">
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === active && styles.dotActive]}
                />
              ))}
            </View>
          ) : null}

          {/* price block */}
          <View style={styles.priceWrap} pointerEvents="none">
            <Text style={styles.price}>
              {money(property.price, property.currency)}
              {property.listingType === 'rent' ? (
                <Text style={styles.perMonth}> /mo</Text>
              ) : null}
            </Text>
            {property.priceNegotiable ? (
              <View style={styles.negPill}>
                <Text style={styles.negText}>Negotiable</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          style={styles.body}
          onPress={onPress}
          onPressIn={() => spring(0.985)}
          onPressOut={() => spring(1)}>
          <View style={styles.typeRow}>
            <View style={styles.typeChip}>
              <Icon name="home" size={12} color={c.gold} />
              <Text style={styles.typeChipText}>{typeLabel}</Text>
            </View>
            <View style={styles.typeRowRight}>
              {property.isVerified ? (
                <View style={styles.verified}>
                  <Icon name="check" size={11} color={c.success} strokeWidth={2.6} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              ) : null}
              {onDelete ? (
                <Pressable
                  style={({pressed}) => [styles.deleteBtn, pressed && {opacity: 0.55}]}
                  hitSlop={8}
                  onPress={onDelete}>
                  <Icon name="trash-2" size={15} color={c.danger} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {property.title}
          </Text>

          <View style={styles.locationRow}>
            <Icon name="map-pin" size={13} color={c.textMuted} />
            <Text style={styles.location} numberOfLines={1}>
              {locationLine(property)}
            </Text>
          </View>

          {property.bhk != null || property.bathrooms != null || area != null ? (
            <View style={styles.specs}>
              {property.bhk != null ? (
                <Spec icon="bed" label={`${property.bhk} BHK`} />
              ) : null}
              {property.bhk != null && (property.bathrooms != null || area != null) ? (
                <View style={styles.specDivider} />
              ) : null}
              {property.bathrooms != null ? (
                <Spec icon="bath" label={`${property.bathrooms} Bath`} />
              ) : null}
              {property.bathrooms != null && area != null ? (
                <View style={styles.specDivider} />
              ) : null}
              {area != null ? (
                <Spec icon="ruler" label={`${area} ft²`} />
              ) : null}
            </View>
          ) : null}
        </Pressable>
    </Animated.View>
  );
}

function Spec({icon, label}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.spec}>
      <View style={styles.specIconWrap}>
        <Icon name={icon} size={14} color={c.gold} />
      </View>
      <Text style={styles.specText}>{label}</Text>
    </View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    card: {
      // Dark theme: lift the card above the ink background so it reads as a
      // raised surface. Light theme: keep it clean white.
      backgroundColor: c.isDark ? c.surfaceAlt : c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    imageWrap: {height: 210, backgroundColor: c.surface2},
    image: {height: '100%'},
    scrimTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 86,
      backgroundColor: 'rgba(15,12,12,0.26)',
    },
    scrimBottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 118,
      backgroundColor: 'rgba(15,12,12,0.5)',
    },
    topRow: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      right: spacing.sm,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    tags: {flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1},
    tag: {
      backgroundColor: 'rgba(15,12,12,0.55)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    tagText: {
      color: '#fff',
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    featured: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.gold,
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    featuredText: {
      color: c.onGold,
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    fav: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(15,12,12,0.5)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dots: {
      position: 'absolute',
      bottom: 52,
      alignSelf: 'center',
      flexDirection: 'row',
      gap: 5,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.45)',
    },
    dotActive: {width: 18, backgroundColor: c.gold},
    priceWrap: {
      position: 'absolute',
      bottom: spacing.sm + 2,
      left: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    price: {
      color: '#fff',
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: 0.2,
      textShadowColor: 'rgba(0,0,0,0.55)',
      textShadowRadius: 10,
    },
    perMonth: {fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)'},
    negPill: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 4,
    },
    negText: {color: '#fff', fontSize: 10, fontWeight: '700'},
    body: {padding: spacing.md},
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: c.goldFaint,
      borderRadius: radius.pill,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    typeChipText: {color: c.gold, fontSize: 11.5, fontWeight: '700'},
    typeRowRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
    verified: {flexDirection: 'row', alignItems: 'center', gap: 4},
    verifiedText: {color: c.success, fontSize: 11.5, fontWeight: '700'},
    deleteBtn: {
      width: 30,
      height: 30,
      borderRadius: radius.sm,
      backgroundColor: 'rgba(239,107,107,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Status overlay on image
    statusTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(15,12,12,0.62)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      borderRadius: radius.pill,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    statusDot: {width: 5, height: 5, borderRadius: 3},
    statusTagText: {fontSize: 10.5, fontWeight: '700', letterSpacing: 0.4},
    title: {color: c.text, fontSize: 17.5, fontWeight: '700', letterSpacing: 0.1},
    locationRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5},
    location: {color: c.textMuted, fontSize: 13, flex: 1},
    specs: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.borderSoft,
      paddingTop: spacing.sm + 2,
    },
    spec: {flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1},
    specIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: c.goldFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    specText: {color: c.textDim, fontSize: 12.5, fontWeight: '600'},
    specDivider: {
      width: 1,
      height: 22,
      backgroundColor: c.borderSoft,
      marginHorizontal: spacing.sm,
    },
  });
