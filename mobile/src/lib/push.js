/**
 * Firebase Cloud Messaging — permission, token, tray-tap navigation.
 */
import {Platform, PermissionsAndroid} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {registerDeviceToken, removeDeviceToken} from './notifications';

let currentToken = null;

async function askPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ).catch(() => {});
  }
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/** Route FCM data payload to the right screen. */
function navigate(navigationRef, data) {
  if (!data?.screen || !navigationRef?.isReady()) {
    return;
  }
  if (data.screen === 'PropertyDetail' && data.id) {
    navigationRef.navigate('PropertyDetail', {id: data.id});
  } else {
    navigationRef.navigate('Notifications');
  }
}

/**
 * Call once the user is signed in.
 * - Registers device token with the backend.
 * - Foreground messages refresh the in-app list via onForeground().
 * - Tray taps navigate via navigationRef (a React Navigation ref).
 * Returns a cleanup function.
 */
export async function setupPush(onForeground, navigationRef) {
  try {
    const ok = await askPermission();
    if (!ok) {
      return () => {};
    }

    currentToken = await messaging().getToken();
    if (currentToken) {
      await registerDeviceToken(currentToken).catch(() => {});
    }

    const unsubRefresh = messaging().onTokenRefresh(async t => {
      currentToken = t;
      await registerDeviceToken(t).catch(() => {});
    });

    const unsubForeground = messaging().onMessage(async () => {
      onForeground?.();
    });

    // App in background → user taps tray notification.
    const unsubBackground = messaging().onNotificationOpenedApp(remote => {
      navigate(navigationRef, remote?.data);
    });

    // App was fully closed → launched from tray notification.
    messaging()
      .getInitialNotification()
      .then(remote => {
        if (remote?.data) {
          setTimeout(() => navigate(navigationRef, remote.data), 800);
        }
      });

    return () => {
      unsubRefresh();
      unsubForeground();
      unsubBackground();
    };
  } catch {
    return () => {};
  }
}

/** Call on logout to stop push for this device. */
export async function teardownPush() {
  try {
    const t = currentToken || (await messaging().getToken());
    if (t) {
      await removeDeviceToken(t).catch(() => {});
    }
    currentToken = null;
  } catch {
    // ignore
  }
}
