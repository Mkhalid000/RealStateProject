/**
 * RealReels — real estate reels + listings app.
 * @format
 */

import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from './src/lib/queryClient';
import {RootNavigator} from './src/navigation/RootNavigator';
import {useThemeStore} from './src/store/themeStore';
import {useColors} from './src/theme';

function App() {
  const hydrate = useThemeStore(s => s.hydrate);
  const c = useColors();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
