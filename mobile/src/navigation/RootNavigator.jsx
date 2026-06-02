import React, {useMemo, useState} from 'react';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import {useAuthStore} from '../store/authStore';
import {useAuthInit} from '../hooks/useAuthInit';
import {AuthNavigator} from './AuthNavigator';
import {AppNavigator} from './AppNavigator';
import {SplashScreen} from '../screens/SplashScreen';
import {useColors} from '../theme';
import {navigationRef} from '../../App';

export function RootNavigator() {
  useAuthInit();
  const {user, initializing} = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);
  const c = useColors();

  const navTheme = useMemo(() => {
    const base = c.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: c.bg,
        card: c.surface,
        text: c.text,
        border: c.border,
        primary: c.gold,
        notification: c.gold,
      },
    };
  }, [c]);

  // Hold the splash until BOTH the intro animation has played and the stored
  // session has been resolved — no flicker between splash and the first screen.
  if (!splashDone || initializing) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
