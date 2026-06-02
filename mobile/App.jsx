/**
 * RealReels — real estate reels + listings app.
 * @format
 */

import React, {useEffect, useRef} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClientProvider} from '@tanstack/react-query';
import {createNavigationContainerRef} from '@react-navigation/native';
import {queryClient} from './src/lib/queryClient';
import {RootNavigator} from './src/navigation/RootNavigator';
import {useThemeStore} from './src/store/themeStore';
import {useAuthStore} from './src/store/authStore';
import {setupPush} from './src/lib/push';
import {useColors} from './src/theme';

export const navigationRef = createNavigationContainerRef();

function App() {
  const hydrate = useThemeStore(s => s.hydrate);
  const user = useAuthStore(s => s.user);
  const c = useColors();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Register this device for push once signed in; refresh the in-app list
  // when a foreground message arrives; navigate on tray tap.
  useEffect(() => {
    if (!user) {
      return;
    }
    let cleanup = () => {};
    setupPush(
      () => queryClient.invalidateQueries({queryKey: ['notifications']}),
      navigationRef,
    ).then(fn => {
      cleanup = fn || (() => {});
    });
    return () => cleanup();
  }, [user]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar
          barStyle={c.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={c.bg}
        />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
