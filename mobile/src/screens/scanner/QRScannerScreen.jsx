import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Camera, useCameraDevice, useCodeScanner} from 'react-native-vision-camera';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Icon} from '../../components/ui/Icon';
import {Loader} from '../../components/ui/Loader';
import {radius, spacing, useColors, useThemedStyles} from '../../theme';

export function QRScannerScreen({navigation}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const device = useCameraDevice('back');

  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  async function requestCameraPermission() {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'AUREVIA needs camera access to scan QR codes.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        },
      );
      setHasPermission(result === PermissionsAndroid.RESULTS.GRANTED);
    } else {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    }
  }

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: useCallback(
      codes => {
        if (scanned || !codes.length) return;
        const value = codes[0].value;
        if (!value) return;
        setScanned(true);

        // Handle aurevia://property/<id>  OR  https://aurevia.app/property/<id>
        const match =
          value.match(/aurevia:\/\/property\/([a-zA-Z0-9-]+)/) ||
          value.match(/\/property\/([a-zA-Z0-9-]+)/);

        if (match) {
          const id = match[1];
          navigation.replace('PropertyDetail', {id});
        } else {
          Alert.alert(
            'Invalid QR Code',
            'This QR code is not an AUREVIA property code.',
            [{text: 'Scan Again', onPress: () => setScanned(false)}],
          );
        }
      },
      [scanned, navigation],
    ),
  });

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <SafeAreaView edges={['top']}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backFloat} hitSlop={10}>
            <Icon name="chevron-left" size={22} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <Icon name="eye-off" size={48} color="rgba(255,255,255,0.5)" />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permSub}>Allow camera permission to scan QR codes.</Text>
        <Pressable style={styles.permBtn} onPress={requestCameraPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Loader size={40} color="#fff" />
        <Text style={styles.permSub}>Loading camera…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!scanned}
        codeScanner={codeScanner}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanBox}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {/* Scan line */}
            <View style={styles.scanLine} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Top bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={({pressed}) => [styles.backFloat, pressed && {opacity: 0.7}]}>
          <Icon name="chevron-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.topTitle}>Scan QR Code</Text>
        <View style={{width: 40}} />
      </SafeAreaView>

      {/* Hint */}
      <View style={styles.hintWrap} pointerEvents="none">
        <View style={styles.hintPill}>
          <Icon name="map-pin" size={13} color="#fff" />
          <Text style={styles.hintText}>Point at an AUREVIA property QR code</Text>
        </View>
      </View>
    </View>
  );
}

const BOX = 240;
const CORNER = 22;
const THICK  = 3.5;

const makeStyles = c =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: '#000'},
    center: {
      flex: 1,
      backgroundColor: '#111',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xl,
    },
    permTitle: {color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center'},
    permSub: {color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center'},
    permBtn: {
      backgroundColor: c.gold,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.xl,
      paddingVertical: 13,
      marginTop: spacing.sm,
    },
    permBtnText: {color: c.onGold, fontSize: 15, fontWeight: '700'},

    // Overlay
    overlay: {flex: 1, ...StyleSheet.absoluteFillObject},
    overlayTop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.62)'},
    overlayMiddle: {flexDirection: 'row', height: BOX},
    overlaySide: {flex: 1, backgroundColor: 'rgba(0,0,0,0.62)'},
    overlayBottom: {flex: 1, backgroundColor: 'rgba(0,0,0,0.62)'},
    scanBox: {
      width: BOX,
      height: BOX,
      position: 'relative',
      overflow: 'hidden',
    },
    scanLine: {
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: c.gold,
      opacity: 0.8,
    },

    // Corner brackets
    corner: {position: 'absolute', width: CORNER, height: CORNER, borderColor: c.gold},
    cornerTL: {top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: 4},
    cornerTR: {top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: 4},
    cornerBL: {bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK, borderBottomLeftRadius: 4},
    cornerBR: {bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: 4},

    // Top bar
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backFloat: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    topTitle: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      textShadowColor: 'rgba(0,0,0,0.6)',
      textShadowRadius: 6,
    },

    // Hint pill at bottom
    hintWrap: {
      position: 'absolute',
      bottom: 60,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    hintPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    hintText: {color: '#fff', fontSize: 13, fontWeight: '600'},
  });
