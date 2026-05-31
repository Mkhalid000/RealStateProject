import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Badge} from '../../components/ui/Badge';
import {Button} from '../../components/ui/Button';
import {Avatar} from '../../components/ui/Avatar';
import {Icon} from '../../components/ui/Icon';
import {EmptyState} from '../../components/ui/EmptyState';
import {useProperty} from '../../hooks/useProperties';
import {useSavedStore} from '../../store/savedStore';
import {coverImage, listingLabel, locationLine, money} from '../../lib/format';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const {width} = Dimensions.get('window');
const HERO_H = 280;

export function PropertyDetailScreen({route, navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const {id} = route.params || {};
  const {data: property, isLoading, isError, refetch} = useProperty(id);
  const [activeImg, setActiveImg] = useState(0);
  const {ids, toggle} = useSavedStore();
  const scrollY = useRef(new Animated.Value(0)).current;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={c.gold} />
      </View>
    );
  }

  if (isError || !property) {
    return (
      <SafeAreaView style={styles.center}>
        <EmptyState
          icon="⚠"
          title="Property not found"
          subtitle="It may have been removed."
          actionLabel="Retry"
          onAction={refetch}
        />
      </SafeAreaView>
    );
  }

  const images = property.imageUrls?.length
    ? property.imageUrls
    : [coverImage(property)];
  const saved = ids.has(property.id);
  const agent = property.agent;
  const phone = property.ownerPhone || agent?.phone;
  const area = property.carpetArea ?? property.superBuiltUpArea;

  // Compact highlights shown right under the price card.
  const highlights = [
    property.bhk != null && {icon: 'bed', value: `${property.bhk}`, label: 'Bedrooms'},
    property.bathrooms != null && {icon: 'bath', value: `${property.bathrooms}`, label: 'Bathrooms'},
    area != null && {icon: 'ruler', value: `${area}`, label: 'Sq.ft'},
  ].filter(Boolean);

  // Full detail grid.
  const specs = [
    property.balconies != null && {icon: 'layers', label: 'Balconies', value: property.balconies},
    property.furnishing && {
      icon: 'sofa',
      label: 'Furnishing',
      value: String(property.furnishing).replace('_', ' '),
    },
    property.facing && {icon: 'compass', label: 'Facing', value: property.facing},
    property.floorNumber != null && {
      icon: 'building',
      label: 'Floor',
      value: `${property.floorNumber}${property.totalFloors ? ` / ${property.totalFloors}` : ''}`,
    },
    property.propertyAge && {icon: 'calendar', label: 'Age', value: property.propertyAge},
    property.type && {icon: 'home', label: 'Type', value: property.type},
  ].filter(Boolean);

  // Parallax + zoom on the hero as you scroll.
  const heroTransform = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [-HERO_H, 0, HERO_H],
          outputRange: [-HERO_H / 2, 0, HERO_H * 0.3],
        }),
      },
      {
        scale: scrollY.interpolate({
          inputRange: [-HERO_H, 0],
          outputRange: [1.6, 1],
          extrapolateRight: 'clamp',
        }),
      },
    ],
  };

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 130}}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: true},
        )}>
        {/* gallery */}
        <View style={styles.heroWrap}>
          <Animated.View style={heroTransform}>
            <ScrollViewGallery
              images={images}
              onIndex={setActiveImg}
              styles={styles}
            />
          </Animated.View>
          <View style={styles.heroScrim} pointerEvents="none" />
          <View style={styles.heroScrimBottom} pointerEvents="none" />

          {images.length > 1 ? (
            <View style={styles.counter} pointerEvents="none">
              <Icon name="layers" size={12} color="#fff" />
              <Text style={styles.counterText}>
                {activeImg + 1} / {images.length}
              </Text>
            </View>
          ) : null}

          {images.length > 1 ? (
            <View style={styles.dots} pointerEvents="none">
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>

        {/* floating price card overlapping the hero */}
        <View style={styles.body}>
          <View style={styles.priceCard}>
            {/* status chips */}
            <View style={styles.chipsRow}>
              <Badge label={listingLabel(property)} tone="gold" />
              <Badge label={property.type} tone="neutral" />
              {property.isVerified ? <Badge label="✓ Verified" tone="green" /> : null}
            </View>

            <Text style={styles.title}>{property.title}</Text>
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={14} color={c.gold} />
              <Text style={styles.location}>{locationLine(property)}</Text>
            </View>

            {/* price */}
            <View style={styles.priceRow}>
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

            {highlights.length ? (
              <View style={styles.highlights}>
                {highlights.map((h, i) => (
                  <React.Fragment key={h.label}>
                    {i > 0 ? <View style={styles.hlDivider} /> : null}
                    <View style={styles.hl}>
                      <Icon name={h.icon} size={18} color={c.gold} />
                      <Text style={styles.hlValue}>{h.value}</Text>
                      <Text style={styles.hlLabel}>{h.label}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            ) : null}
          </View>

          {specs.length ? (
            <Section title="Property details">
              <View style={styles.detailCard}>
                {specs.map((s, i) => (
                  <View
                    key={s.label}
                    style={[styles.detailRow, i === specs.length - 1 && styles.detailRowLast]}>
                    <View style={styles.detailLeft}>
                      <View style={styles.specIconWrap}>
                        <Icon name={s.icon} size={16} color={c.gold} />
                      </View>
                      <Text style={styles.detailLabel}>{s.label}</Text>
                    </View>
                    <Text style={styles.detailValue}>{s.value}</Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {property.description ? (
            <Section title="Description">
              <Text style={styles.desc}>{property.description}</Text>
            </Section>
          ) : null}

          {property.amenities?.length ? (
            <Section title="Amenities">
              <View style={styles.amenities}>
                {property.amenities.map(a => (
                  <View key={a} style={styles.amenity}>
                    <Icon name="check" size={13} color={c.gold} strokeWidth={2.6} />
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {agent ? (
            <Section title="Listed by">
              <View style={styles.agentRow}>
                <Avatar uri={agent.avatarUrl} name={agent.fullName} size={52} ring />
                <View style={{flex: 1}}>
                  <Text style={styles.agentName}>
                    {agent.fullName}
                    {agent.isVerified ? '  ✓' : ''}
                  </Text>
                  <Text style={styles.agentRole}>
                    {property.agencyName ||
                      (agent.role === 'agent' ? 'Verified Agent' : 'Owner')}
                  </Text>
                </View>
                <Pressable
                  style={styles.agentCall}
                  hitSlop={8}
                  onPress={() => phone && Linking.openURL(`tel:${phone}`)}>
                  <Icon name="phone" size={18} color={c.gold} />
                </Pressable>
              </View>
            </Section>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* floating top bar */}
      <SafeAreaView style={styles.heroBar} edges={['top']}>
        <RoundBtn icon="chevron-left" onPress={() => navigation.goBack()} />
        <View style={styles.heroBarRight}>
          <RoundBtn icon="share-2" onPress={() => {}} />
          <RoundBtn
            icon="heart"
            tint={saved ? c.danger : '#fff'}
            onPress={() => toggle(property)}
          />
        </View>
      </SafeAreaView>

      {/* sticky contact bar */}
      <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
        <View style={styles.ctaInner}>
          <Pressable
            style={styles.callBtn}
            onPress={() => phone && Linking.openURL(`tel:${phone}`)}>
            <Icon name="phone" size={19} color={c.gold} />
          </Pressable>
          <Button
            title="Message Agent"
            style={styles.ctaBtnPrimary}
            onPress={() => {
              if (property.ownerWhatsapp || phone) {
                Linking.openURL(
                  `https://wa.me/${(property.ownerWhatsapp || phone).replace(/[^0-9]/g, '')}`,
                );
              }
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Swipeable hero gallery. */
function ScrollViewGallery({images, onIndex, styles}) {
  const scrollX = useRef(0);
  return (
    <View>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={e => {
          scrollX.current = e.nativeEvent.contentOffset.x;
          onIndex(Math.round(scrollX.current / width));
        }}>
        {images.map((src, i) => (
          <Image key={i} source={{uri: src}} style={styles.hero} />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

function Section({title, children}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function RoundBtn({icon, onPress, tint = '#fff'}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={onPress} style={styles.roundBtn} hitSlop={8}>
      <Icon name={icon} size={20} color={tint} strokeWidth={2.2} />
    </Pressable>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    center: {flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center'},
    heroWrap: {height: HERO_H, backgroundColor: c.surface2, overflow: 'hidden'},
    hero: {width, height: HERO_H, backgroundColor: c.surface2},
    heroScrim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 140,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    heroScrimBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
      backgroundColor: 'rgba(15,12,12,0.35)',
    },
    heroBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
    },
    heroBarRight: {flexDirection: 'row', gap: spacing.sm},
    roundBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(20,16,16,0.55)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    counter: {
      position: 'absolute',
      top: 70,
      right: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(15,12,12,0.55)',
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    counterText: {color: '#fff', fontSize: 11.5, fontWeight: '600'},
    dots: {
      position: 'absolute',
      bottom: 40,
      alignSelf: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)'},
    dotActive: {width: 18, backgroundColor: c.gold},
    body: {paddingHorizontal: spacing.md},
    priceCard: {
      marginTop: -28,
      backgroundColor: c.isDark ? c.surfaceAlt : c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: {width: 0, height: 8},
      elevation: 8,
    },
    chipsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md},
    title: {
      color: c.text,
      fontSize: 22,
      fontWeight: '700',
      fontFamily: 'serif',
      lineHeight: 28,
    },
    locationRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8},
    location: {color: c.textMuted, fontSize: 14, flex: 1},
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    price: {color: c.gold, fontSize: 30, fontWeight: '800', letterSpacing: 0.2},
    perMonth: {color: c.textMuted, fontSize: 15, fontWeight: '600'},
    negPill: {
      backgroundColor: c.goldFaint,
      borderRadius: radius.sm,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    negText: {color: c.gold, fontSize: 11, fontWeight: '700'},
    highlights: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: c.borderSoft,
    },
    hl: {flex: 1, alignItems: 'center', gap: 3},
    hlValue: {color: c.text, fontSize: 16, fontWeight: '800'},
    hlLabel: {color: c.textMuted, fontSize: 11},
    hlDivider: {width: 1, height: 34, backgroundColor: c.borderSoft},
    section: {marginTop: spacing.xl},
    sectionTitle: {
      color: c.text,
      fontSize: 18,
      fontWeight: '700',
      fontFamily: 'serif',
      marginBottom: spacing.md,
    },
    detailCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      paddingHorizontal: spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md - 2,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    detailRowLast: {borderBottomWidth: 0},
    detailLeft: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
    specIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor: c.goldFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailLabel: {color: c.textMuted, fontSize: 13.5, fontWeight: '500'},
    detailValue: {
      color: c.text,
      fontWeight: '700',
      fontSize: 14,
      textTransform: 'capitalize',
    },
    desc: {color: c.textDim, fontSize: 14.5, lineHeight: 23},
    amenities: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
    amenity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    amenityText: {color: c.textDim, fontSize: 13},
    agentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      padding: spacing.md,
    },
    agentName: {color: c.text, fontSize: 16, fontWeight: '700'},
    agentRole: {color: c.textMuted, fontSize: 13, marginTop: 2},
    agentCall: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.goldFaint,
      borderWidth: 1,
      borderColor: c.goldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.bgSoft,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    ctaInner: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md},
    callBtn: {
      width: 54,
      height: 54,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaBtnPrimary: {flex: 1},
  });
