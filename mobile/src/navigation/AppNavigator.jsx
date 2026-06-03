import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {MainTabs} from './MainTabs';
import {PropertyDetailScreen} from '../screens/property/PropertyDetailScreen';
import {PostPropertyScreen} from '../screens/property/PostPropertyScreen';
import {MyPropertiesScreen} from '../screens/property/MyPropertiesScreen';
import {SavedScreen} from '../screens/saved/SavedScreen';
import {NotificationsScreen} from '../screens/notifications/NotificationsScreen';
import {CreateReelScreen} from '../screens/reels/CreateReelScreen';
import {HelpSupportScreen} from '../screens/support/HelpSupportScreen';
import {useSavedStore} from '../store/savedStore';
import {useColors} from '../theme';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  // Hydrate the saved-properties set once the user is in the app so hearts
  // reflect server state across every screen.
  const load = useSavedStore(s => s.load);
  const loaded = useSavedStore(s => s.loaded);
  const c = useColors();
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: c.bgSoft},
        headerTintColor: c.text,
        headerTitleStyle: {fontWeight: '700'},
        headerShadowVisible: false,
        contentStyle: {backgroundColor: c.bg},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{headerShown: false}} />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="PostProperty" component={PostPropertyScreen} options={{headerShown: false}} />
      <Stack.Screen name="MyProperties" component={MyPropertiesScreen} options={{title: 'My Properties'}} />
      <Stack.Screen name="Saved" component={SavedScreen} options={{title: 'Saved'}} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="CreateReel"
        component={CreateReelScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}
