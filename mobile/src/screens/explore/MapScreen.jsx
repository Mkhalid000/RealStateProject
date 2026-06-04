import React, {useRef, useState} from 'react';
import {
  Animated,
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {SafeAreaView} from 'react-native-safe-area-context';
import {usePropertiesFeed, flattenPages} from '../../hooks/useProperties';
import {Icon} from '../../components/ui/Icon';
import {Badge} from '../../components/ui/Badge';
import {Loader} from '../../components/ui/Loader';
import {moneyShort, coverImage, listingLabel} from '../../lib/format';
import {radius, shadow, spacing, useColors, useThemedStyles} from '../../theme';

const INITIAL_REGION = {
  latitude: 28.6139,
  longitude: 77.2090,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export function MapScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const centeredOnUser = useRef(false);

  const {data, isLoading} = usePropertiesFeed({limit: 100});
  const items = flattenPages(data).filter(
    p => p.latitude != null && p.longitude != null,
  );

  async function requestAndCenterLocation() {
    let granted = false;
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location permission',
            message: 'Allow AUREVIA to show properties near you.',
            buttonPositive: 'Allow',
            buttonNegative: 'Skip',
          },
        );
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        granted = false;
      }
    } else {
      granted = true;
    }
    setLocationEnabled(granted);
  }

  function onMapReady() {
    setMapReady(true);
    requestAndCenterLocation();
    // Fit to properties if no user location yet
    if (items.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        items.map(p => ({latitude: p.latitude, longitude: p.longitude})),
        {edgePadding: {top: 100, right: 40, bottom: 220, left: 40}, animated: false},
      );
    }
  }

  // Once location is available, center map there (only first time)
  function onUserLocationChange(e) {
    if (centeredOnUser.current) return;
    const coord = e?.nativeEvent?.coordinate;
    if (!coord) return;
    centeredOnUser.current = true;
    mapRef.current?.animateToRegion(
      {
        latitude: coord.latitude,
        longitude: coord.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
      800,
    );
  }

  function goToMyLocation() {
    centeredOnUser.current = false; // allow re-center
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation={locationEnabled}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onMapReady={onMapReady}
        onUserLocationChange={onUserLocationChange}
        onPress={() => setSelected(null)}>

        {mapReady &&
          items.map(p => (
            <Marker
              key={p.id}
              coordinate={{latitude: p.latitude, longitude: p.longitude}}
              anchor={{x: 0.5, y: 1}}
              onPress={e => {
                e.stopPropagation();
                setSelected(p);
              }}
              tracksViewChanges={false}>
              <PricePin
                price={moneyShort(p.price, p.currency)}
                selected={selected?.id === p.id}
                type={p.listingType}
                c={c}
                styles={styles}
              />
            </Marker>
          ))}
      </MapView>

      {/* Top bar */}
      <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={({pressed}) => [styles.floatBtn, pressed && {opacity: 0.75}]}>
          <Icon name="chevron-left" size={22} color={c.text} />
        </Pressable>

        <View style={styles.titlePill}>
          <Icon name="map-pin" size={13} color={c.gold} />
          <Text style={styles.titleText}>
            {isLoading ? 'Loading…' : `${items.length} propert${items.length === 1 ? 'y' : 'ies'}`}
          </Text>
        </View>

        {/* My location button */}
        {locationEnabled && (
          <Pressable
            hitSlop={10}
            style={({pressed}) => [styles.floatBtn, pressed && {opacity: 0.75}]}
            onPress={() => {
              centeredOnUser.current = false;
            }}>
            <Icon name="compass" size={20} color={c.gold} />
          </Pressable>
        )}
      </SafeAreaView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <Loader size={36} label="Loading properties…" />
        </View>
      )}

      {/* Selected property preview card */}
      {selected ? (
        <SafeAreaView edges={['bottom']} style={styles.cardBar}>
          <Pressable
            style={styles.previewCard}
            onPress={() =>
              navigation.navigate('PropertyDetail', {id: selected.id})
            }>
            <Image
              source={{uri: coverImage(selected)}}
              style={styles.previewImg}
            />
            <View style={styles.previewBody}>
              <View style={styles.previewBadgeRow}>
                <Badge label={listingLabel(selected)} tone="gold" />
                {selected.type ? <Badge label={selected.type} tone="neutral" /> : null}
              </View>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {selected.title}
              </Text>
              <Text style={styles.previewPrice}>
                {moneyShort(selected.price, selected.currency)}
              </Text>
              <Text style={styles.previewLoc} numberOfLines={1}>
                {[selected.locality, selected.city].filter(Boolean).join(', ')}
              </Text>
            </View>
            <View style={styles.previewArrow}>
              <Icon name="chevron-right" size={20} color={c.gold} />
            </View>
          </Pressable>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

/** Callout-style pin with a triangular tail pointing down. */
function PricePin({price, selected, type, c, styles}) {
  const isRent = type === 'rent';
  return (
    <View style={styles.pinWrap}>
      <View style={[styles.pinBubble, selected && styles.pinBubbleSelected]}>
        <View style={styles.pinTypeTag}>
          <Icon
            name={isRent ? 'home' : 'tag'}
            size={9}
            color={selected ? c.onGold : c.gold}
          />
          <Text style={[styles.pinTypeText, selected && styles.pinTypeTextSelected]}>
            {isRent ? 'Rent' : 'Sale'}
          </Text>
        </View>
        <Text style={[styles.pinPrice, selected && styles.pinPriceSelected]}>
          {price}
        </Text>
      </View>
      {/* Tail */}
      <View style={[styles.pinTail, selected && styles.pinTailSelected]} />
    </View>
  );
}

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bg},
    map: {flex: 1},

    // Top bar
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    floatBtn: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.card,
    },
    titlePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: c.bg,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.borderSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      ...shadow.card,
    },
    titleText: {color: c.text, fontSize: 13, fontWeight: '700'},

    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Price pin ──────────────────────────────────────────
    pinWrap: {alignItems: 'center'},
    pinBubble: {
      backgroundColor: c.bg,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: c.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: 'center',
      minWidth: 64,
      ...shadow.card,
    },
    pinBubbleSelected: {
      backgroundColor: c.gold,
      borderColor: c.gold,
      transform: [{scale: 1.12}],
    },
    pinTypeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginBottom: 2,
    },
    pinTypeText: {
      color: c.gold,
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    pinTypeTextSelected: {color: c.onGold},
    pinPrice: {
      color: c.text,
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.1,
    },
    pinPriceSelected: {color: c.onGold},

    // Triangle tail
    pinTail: {
      width: 0,
      height: 0,
      borderLeftWidth: 7,
      borderRightWidth: 7,
      borderTopWidth: 8,
      borderStyle: 'solid',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: c.border,
      marginTop: -1,
    },
    pinTailSelected: {borderTopColor: c.gold},

    // Preview card
    cardBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.md,
    },
    previewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bg,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSoft,
      padding: spacing.sm,
      gap: spacing.sm,
      ...shadow.card,
    },
    previewImg: {
      width: 76,
      height: 76,
      borderRadius: radius.lg,
      backgroundColor: c.surface2,
    },
    previewBody: {flex: 1},
    previewBadgeRow: {flexDirection: 'row', gap: 5, marginBottom: 4},
    previewTitle: {color: c.text, fontSize: 14, fontWeight: '700'},
    previewPrice: {color: c.gold, fontSize: 17, fontWeight: '800', marginTop: 2},
    previewLoc: {color: c.textMuted, fontSize: 12, marginTop: 2},
    previewArrow: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      backgroundColor: c.goldFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
