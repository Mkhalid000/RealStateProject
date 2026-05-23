import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {FeedScreen} from '../screens/feed/FeedScreen';
import {ListingsScreen} from '../screens/listings/ListingsScreen';
import {InboxScreen} from '../screens/inbox/InboxScreen';
import {NotificationsScreen} from '../screens/notifications/NotificationsScreen';
import {ProfileScreen} from '../screens/profile/ProfileScreen';
import {colors} from '../theme';

const Tab = createBottomTabNavigator();

const ICONS = {
  Feed: '🎬',
  Listings: '🏠',
  Inbox: '💬',
  Notifications: '🔔',
  Profile: '👤',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerStyle: {backgroundColor: colors.bg},
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({focused}) => (
          <Text style={{fontSize: 20, opacity: focused ? 1 : 0.6}}>
            {ICONS[route.name]}
          </Text>
        ),
      })}>
      <Tab.Screen name="Feed" component={FeedScreen} options={{headerShown: false}} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
