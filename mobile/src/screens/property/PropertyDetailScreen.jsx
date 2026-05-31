import React, {useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Badge} from '../../components/ui/Badge';
import {Button} from '../../components/ui/Button';
import {Input} from '../../components/ui/Input';
import {Avatar} from '../../components/ui/Avatar';
import {Icon} from '../../components/ui/Icon';
import {BottomSheet} from '../../components/ui/BottomSheet';
import {Loader} from '../../components/ui/Loader';
import {EmptyState} from '../../components/ui/EmptyState';
import {useProperty} from '../../hooks/useProperties';
import {useSavedStore} from '../../store/savedStore';
import {createLead} from '../../lib/leads';
import {apiErrorMessage} from '../../lib/api';
import {useAuthStore} from '../../store/authStore';
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
  const [descExpanded, setDescExpanded] = useState(false);
  const {ids, toggle} = useSavedStore();
  const scrollY = useRef(new Animated.Value(0)).current;

  // ── enquiry → lead ──
  const user = useAuthStore(s => s.user);
  const [lead, setLead] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const setL = (k, v) => setLead(f => ({...f, [k]: v}));

  async function submitLead() {
    if (!lead.name.trim() || !(lead.email.trim() || lead.phone.trim())) {
      setLeadError('Please add your name and an email or phone.');
      return;
    }
    Keyboard.dismiss();
    setLeadError('');
    setSending(true);
    try {
      await createLead({
        name: lead.name.trim(),
        email: lead.email.trim(),
        phone: lead.phone.trim(),
        message: lead.message.trim(),
        propertyId: property.id,
      });
      setSent(true);
    } catch (err) {
      setLeadError(apiErrorMessage(err, 'Could not send your request.'));
    } finally {
      setSending(false);
    }
  }

  if (isLoading) {
    return <Loader fullscreen size={52} label="Loading residence" />;
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
    property.type && {icon: 'home', label: 'Type', value: property.type},
    property.balconies != null && {icon: 'layers', label: 'Balconies', value: property.balconies},
    property.furnishing && {
      icon: 'sofa',
      label: 'Furnishing',
      value: String(property.furnishing).replace(/_/g, ' '),
    },
    property.facing && {
      icon: 'compass',
      label: 'Facing',
      value: String(property.facing).replace(/_/g, '-'),
    },
    (property.floorNumber != null || property.totalFloors != null) && {
      icon: 'building',
      label: property.floorNumber != null ? 'Floor' : 'Total floors',
      value:
        property.floorNumber != null
          ? `${property.floorNumber}${property.totalFloors ? ` of ${property.totalFloors}` : ''}`
          : `${property.totalFloors}`,
    },
    property.propertyAge && {icon: 'calendar', label: 'Age', value: property.propertyAge},
    property.carpetArea != null && {
      icon: 'ruler',
      label: 'Carpet area',
      value: `${property.carpetArea} ft²`,
    },
    property.superBuiltUpArea != null && {
      icon: 'ruler',
      label: 'Built-up area',
      value: `${property.superBuiltUpArea} ft²`,
    },
    property.plotArea != null && {
      icon: 'layers',
      label: 'Plot area',
      value: `${property.plotArea} ft²`,
    },
  ].filter(Boolean);

  // Full address line for the Location section.
  const fullAddress = [
    property.address,
    property.landmark,
    [property.city, property.state].filter(Boolean).join(', '),
    property.pincode,
  ]
    .filter(Boolean)
    .join('\n');

  // Parallax + zoom on the hero as you scroll: zooms on pull-down (overscroll)
  // AND gently zooms in as you scroll down through the content.
  const heroTransform = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [-HERO_H, 0, HERO_H],
          outputRange: [-HERO_H / 2, 0, HERO_H * 0.28],
        }),
      },
      {
        scale: scrollY.interpolate({
          inputRange: [-HERO_H, 0, HERO_H],
          outputRange: [1.6, 1, 1.22],
          extrapolate: 'clamp',
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
              <View style={styles.detailGrid}>
                {specs.map(s => (
                  <View key={s.label} style={styles.detailCell}>
                    <View style={styles.specIconWrap}>
                      <Icon name={s.icon} size={16} color={c.gold} />
                    </View>
                    <View style={styles.detailCellText}>
                      <Text style={styles.detailLabel}>{s.label}</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {s.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {property.description ? (
            <Section title="Description">
              <Text
                style={styles.desc}
                numberOfLines={descExpanded ? undefined : 4}>
                {property.description}
              </Text>
              {property.description.length > 160 ? (
                <Pressable
                  hitSlop={8}
                  onPress={() => setDescExpanded(v => !v)}
                  style={styles.moreBtn}>
                  <Text style={styles.moreText}>
                    {descExpanded ? 'See less' : 'See more'}
                  </Text>
                  <Icon
                    name={descExpanded ? 'chevron-up' : 'chevron-down'}
                    size={15}
                    color={c.gold}
                    strokeWidth={2.4}
                  />
                </Pressable>
              ) : null}
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

          {fullAddress ? (
            <Section title="Location">
              <View style={styles.locationCard}>
                <View style={styles.locIconWrap}>
                  <Icon name="map-pin" size={18} color={c.gold} />
                </View>
                <Text style={styles.locAddress}>{fullAddress}</Text>
              </View>
            </Section>
          ) : null}

          {agent ? (
            <Section title="Listed by">
              <View style={styles.agentCard}>
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
                {agent.bio ? (
                  <Text style={styles.agentBio}>{agent.bio}</Text>
                ) : null}
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
            style={styles.iconBtn}
            onPress={() => phone && Linking.openURL(`tel:${phone}`)}>
            <Icon name="phone" size={19} color={c.gold} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              setSent(false);
              setLeadError('');
              setEnquiryOpen(true);
            }}>
            <Icon name="message-circle" size={19} color={c.gold} />
          </Pressable>
          <Button
            title="WhatsApp"
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

      {/* enquiry bottom sheet */}
      <BottomSheet visible={enquiryOpen} onClose={() => setEnquiryOpen(false)}>
        {sent ? (
          <View style={styles.sentBox}>
            <View style={styles.sentIcon}>
              <Icon name="check" size={28} color={c.gold} strokeWidth={2.6} />
            </View>
            <Text style={styles.sentTitle}>Enquiry sent!</Text>
            <Text style={styles.sentSub}>Our advisor will be in touch shortly.</Text>
            <Button
              title="Done"
              size="lg"
              onPress={() => setEnquiryOpen(false)}
              style={styles.leadCta}
            />
          </View>
        ) : (
          <>
            <Text style={styles.sheetTitle}>Request a Private Viewing</Text>
            <Text style={styles.leadSub}>
              Our advisor will respond within 24 hours.
            </Text>
            <Input
              compact
              containerStyle={styles.leadGap}
              label="FULL NAME"
              icon="user"
              value={lead.name}
              onChangeText={v => setL('name', v)}
              placeholder="Your name"
            />
            <Input
              compact
              containerStyle={styles.leadGap}
              label="EMAIL"
              icon="mail"
              value={lead.email}
              onChangeText={v => setL('email', v)}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Input
              compact
              containerStyle={styles.leadGap}
              label="PHONE"
              icon="phone"
              value={lead.phone}
              onChangeText={v => setL('phone', v)}
              keyboardType="phone-pad"
              placeholder="Your phone number"
            />
            <Input
              compact
              containerStyle={styles.leadGap}
              label="MESSAGE"
              value={lead.message}
              onChangeText={v => setL('message', v)}
              placeholder="I'd like a private viewing…"
              multiline
              numberOfLines={3}
              style={styles.leadTextarea}
            />
            {leadError ? <Text style={styles.leadError}>{leadError}</Text> : null}
            <Button
              title="Request Viewing"
              size="lg"
              loading={sending}
              onPress={submitLead}
              style={styles.leadCta}
            />
            <View style={{height: spacing.sm}} />
          </>
        )}
      </BottomSheet>
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
      bottom: spacing.md,
      alignSelf: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)'},
    dotActive: {width: 18, backgroundColor: c.gold},
    body: {paddingHorizontal: spacing.md},
    priceCard: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
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
    hlValue: {color: c.text, fontSize: 18, fontWeight: '900'},
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
    detailGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
    detailCell: {
      width: (width - spacing.lg * 2 - spacing.sm) / 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.borderSoft,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm + 2,
    },
    specIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor: c.goldFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailCellText: {flex: 1},
    detailLabel: {color: c.textMuted, fontSize: 11.5},
    detailValue: {
      color: c.text,
      fontWeight: '700',
      fontSize: 13.5,
      textTransform: 'capitalize',
      marginTop: 1,
    },
    desc: {color: c.textDim, fontSize: 14.5, lineHeight: 23},
    moreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: spacing.sm,
    },
    moreText: {color: c.gold, fontSize: 13.5, fontWeight: '700'},
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
    locationCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      padding: spacing.md,
    },
    locIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: c.goldFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locAddress: {color: c.textDim, fontSize: 14, lineHeight: 21, flex: 1},
    agentCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      padding: spacing.md,
    },
    agentRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
    agentName: {color: c.text, fontSize: 16, fontWeight: '700'},
    agentRole: {color: c.textMuted, fontSize: 13, marginTop: 2},
    agentBio: {
      color: c.textDim,
      fontSize: 13,
      lineHeight: 20,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.borderSoft,
    },
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
    sheetTitle: {
      color: c.text,
      fontSize: 20,
      fontWeight: '700',
      fontFamily: 'serif',
    },
    leadSub: {color: c.textMuted, fontSize: 13, marginTop: 2, marginBottom: spacing.md},
    leadGap: {marginBottom: spacing.sm + 2},
    leadTextarea: {height: 80, textAlignVertical: 'top', paddingTop: spacing.sm},
    leadError: {color: c.danger, fontSize: 12.5, marginBottom: spacing.sm},
    leadCta: {marginTop: spacing.xs},
    sentBox: {alignItems: 'center', paddingVertical: spacing.lg},
    sentIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.goldFaint,
      borderWidth: 1,
      borderColor: c.goldGlow,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    sentTitle: {color: c.text, fontSize: 16, fontWeight: '700'},
    sentSub: {color: c.textMuted, fontSize: 13, marginTop: 3, textAlign: 'center'},
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
    iconBtn: {
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
