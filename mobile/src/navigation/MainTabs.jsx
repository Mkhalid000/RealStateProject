import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {ExploreScreen} from '../screens/explore/ExploreScreen';
import {ReelsScreen} from '../screens/reels/ReelsScreen';
import {SavedScreen} from '../screens/saved/SavedScreen';
import {ProfileScreen} from '../screens/profile/ProfileScreen';
import {TabBar} from './TabBar';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{headerShown: false, lazy: true}}>
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Reels" component={ReelsScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
