import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Badge} from '../../components/ui/Badge';
import {Button} from '../../components/ui/Button';
import {Avatar} from '../../components/ui/Avatar';
import {EmptyState} from '../../components/ui/EmptyState';
import {useProperty} from '../../hooks/useProperties';
import {useSavedStore} from '../../store/savedStore';
import {coverImage, listingLabel, locationLine, money} from '../../lib/format';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

const {width} = Dimensions.get('window');

export function PropertyDetailScreen({route, navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const {id} = route.params || {};
  const {data: property, isLoading, isError, refetch} = useProperty(id);
  const [activeImg, setActiveImg] = useState(0);
  const {ids, toggle} = useSavedStore();
  const scrollX = useRef(0);

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
        <EmptyState icon="⚠" title="Property not found" subtitle="It may have been removed." actionLabel="Retry" onAction={refetch} />
      </SafeAreaView>
    );
  }

  const images = property.imageUrls?.length ? property.imageUrls : [coverImage(property)];
  const saved = ids.has(property.id);
  const agent = property.agent;
  const phone = property.ownerPhone || agent?.phone;

  const specs = [
    property.bhk != null && {icon: '◳', label: 'Bedrooms', value: `${property.bhk} BHK`},
    property.bathrooms != null && {icon: '◴', label: 'Bathrooms', value: property.bathrooms},
    property.balconies != null && {icon: '⛶', label: 'Balconies', value: property.balconies},
    (property.carpetArea ?? property.superBuiltUpArea) != null && {
      icon: '◰',
      label: 'Area',
      value: `${property.carpetArea ?? property.superBuiltUpArea} sqft`,
    },
    property.furnishing && {icon: '🛋', label: 'Furnishing', value: String(property.furnishing).replace('_', ' ')},
    property.facing && {icon: '🧭', label: 'Facing', value: property.facing},
    property.floorNumber != null && {icon: '🏢', label: 'Floor', value: `${property.floorNumber}${property.totalFloors ? ` / ${property.totalFloors}` : ''}`},
    property.propertyAge && {icon: '📅', label: 'Age', value: property.propertyAge},
  ].filter(Boolean);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 120}}>
        {/* gallery */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={e => {
              scrollX.current = e.nativeEvent.contentOffset.x;
              setActiveImg(Math.round(scrollX.current / width));
            }}
            scrollEventThrottle={32}>
            {images.map((src, i) => (
              <Image key={i} source={{uri: src}} style={styles.hero} />
            ))}
          </ScrollView>
          <View style={styles.heroScrim} pointerEvents="none" />

          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
              ))}
            </View>
          ) : null}

          <SafeAreaView style={styles.heroBar} edges={['top']}>
            <RoundBtn glyph="‹" onPress={() => navigation.goBack()} />
            <RoundBtn glyph={saved ? '♥' : '♡'} tint={saved ? c.danger : '#fff'} onPress={() => toggle(property)} />
          </SafeAreaView>

          <View style={styles.heroBadges}>
            <Badge label={property.type} tone="gold" />
            <Badge label={listingLabel(property)} tone="neutral" style={styles.badgeDark} />
            {property.isVerified ? <Badge label="✓ Verified" tone="green" /> : null}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.price}>
            {money(property.price, property.currency)}
            {property.priceNegotiable ? <Text style={styles.negotiable}>  · Negotiable</Text> : null}
          </Text>
          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.location}>◍ {locationLine(property)}</Text>

          {/* spec grid */}
          {specs.length ? (
            <View style={styles.specGrid}>
              {specs.map((s, i) => (
                <View key={i} style={styles.specCell}>
                  <Text style={styles.specIcon}>{s.icon}</Text>
                  <Text style={styles.specValue}>{s.value}</Text>
                  <Text style={styles.specLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
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
                    <Text style={styles.amenityText}>✓ {a}</Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {agent ? (
            <Section title="Listed by">
              <View style={styles.agentRow}>
                <Avatar uri={agent.avatarUrl} name={agent.fullName} size={52} />
                <View style={{flex: 1}}>
                  <Text style={styles.agentName}>
                    {agent.fullName}{agent.isVerified ? '  ✓' : ''}
                  </Text>
                  <Text style={styles.agentRole}>
                    {property.agencyName || (agent.role === 'agent' ? 'Verified Agent' : 'Owner')}
                  </Text>
                </View>
              </View>
            </Section>
          ) : null}
        </View>
      </ScrollView>

      {/* sticky contact bar */}
      <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
        <View style={styles.ctaInner}>
          <Button
            title="Call"
            variant="outline"
            style={styles.ctaBtn}
            onPress={() => phone && Linking.openURL(`tel:${phone}`)}
          />
          <Button
            title="Message Agent"
            icon="✉"
            style={styles.ctaBtnPrimary}
            onPress={() => {
              if (property.ownerWhatsapp || phone) {
                Linking.openURL(`https://wa.me/${(property.ownerWhatsapp || phone).replace(/[^0-9]/g, '')}`);
              }
            }}
          />
        </View>
      </SafeAreaView>
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

function RoundBtn({glyph, onPress, tint = '#fff'}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={onPress} style={styles.roundBtn} hitSlop={8}>
      <Text style={[styles.roundGlyph, {color: tint}]}>{glyph}</Text>
    </Pressable>
  );
}

const makeStyles = c =>
  StyleSheet.create({
  root: {flex: 1, backgroundColor: c.bg},
  center: {flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center'},
  hero: {width, height: 340, backgroundColor: c.surface2},
  heroScrim: {position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.25)'},
  heroBar: {position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md},
  roundBtn: {width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(20,16,16,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm},
  roundGlyph: {color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 26},
  dots: {position: 'absolute', bottom: spacing.md, alignSelf: 'center', flexDirection: 'row', gap: 6},
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)'},
  dotActive: {width: 18, backgroundColor: c.gold},
  heroBadges: {position: 'absolute', bottom: spacing.md, left: spacing.md, flexDirection: 'row', gap: 6},
  badgeDark: {backgroundColor: 'rgba(20,16,16,0.6)'},
  body: {padding: spacing.lg},
  price: {color: c.gold, fontSize: 28, fontWeight: '800'},
  negotiable: {color: c.textMuted, fontSize: 14, fontWeight: '500'},
  title: {color: c.text, fontSize: 22, fontWeight: '700', fontFamily: 'serif', marginTop: spacing.xs},
  location: {color: c.textMuted, fontSize: 14, marginTop: spacing.xs},
  specGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderSoft, paddingVertical: spacing.sm},
  specCell: {width: '25%', alignItems: 'center', paddingVertical: spacing.md},
  specIcon: {fontSize: 20, color: c.gold, marginBottom: 4},
  specValue: {color: c.text, fontWeight: '700', fontSize: 13, textTransform: 'capitalize'},
  specLabel: {color: c.textMuted, fontSize: 11, marginTop: 2},
  section: {marginTop: spacing.xl},
  sectionTitle: {color: c.text, fontSize: 18, fontWeight: '700', fontFamily: 'serif', marginBottom: spacing.sm},
  desc: {color: c.textDim, fontSize: 14.5, lineHeight: 22},
  amenities: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  amenity: {backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8},
  amenityText: {color: c.textDim, fontSize: 13},
  agentRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderSoft, padding: spacing.md},
  agentName: {color: c.text, fontSize: 16, fontWeight: '700'},
  agentRole: {color: c.textMuted, fontSize: 13, marginTop: 2},
  ctaBar: {position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.bgSoft, borderTopWidth: 1, borderTopColor: c.border},
  ctaInner: {flexDirection: 'row', gap: spacing.sm, padding: spacing.md},
  ctaBtn: {flex: 1},
  ctaBtnPrimary: {flex: 2},
  });
