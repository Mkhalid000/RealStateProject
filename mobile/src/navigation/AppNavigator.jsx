import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {MainTabs} from './MainTabs';
import {Placeholder} from '../components/ui/Placeholder';
import {colors} from '../theme';

const Stack = createNativeStackNavigator();

// Phase 3+ screens are placeholders for now; routes already exist so other
// screens can navigate to them without changing call sites later.
const PropertyDetail = () => <Placeholder title="Property Detail" />;
const AgentProfile = () => <Placeholder title="Agent Profile" />;
const Chat = () => <Placeholder title="Chat" />;
const CreateReel = () => <Placeholder title="Create Reel" />;
const ManageProperty = () => <Placeholder title="Manage Property" />;
const AgentDashboard = () => <Placeholder title="Agent Dashboard" />;

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.bg},
        headerTintColor: colors.text,
        contentStyle: {backgroundColor: colors.bg},
      }}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{headerShown: false}}
      />
      <Stack.Screen name="PropertyDetail" component={PropertyDetail} />
      <Stack.Screen name="AgentProfile" component={AgentProfile} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="CreateReel" component={CreateReel} />
      <Stack.Screen name="ManageProperty" component={ManageProperty} />
      <Stack.Screen name="AgentDashboard" component={AgentDashboard} />
    </Stack.Navigator>
  );
}
