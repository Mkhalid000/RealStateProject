import React, {useState} from 'react';
import {NavigationContainer, DarkTheme} from '@react-navigation/native';
import {useAuthStore} from '../store/authStore';
import {useAuthInit} from '../hooks/useAuthInit';
import {AuthNavigator} from './AuthNavigator';
import {AppNavigator} from './AppNavigator';
import {SplashScreen} from '../screens/SplashScreen';
import {colors} from '../theme';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.gold,
    notification: colors.gold,
  },
};

export function RootNavigator() {
  useAuthInit();
  const {user, initializing} = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);

  // Hold the splash until BOTH the intro animation has played and the stored
  // session has been resolved — no flicker between splash and the first screen.
  if (!splashDone || initializing) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
