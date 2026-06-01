import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {WelcomeScreen} from '../screens/auth/WelcomeScreen';
import {LoginScreen} from '../screens/auth/LoginScreen';
import {SignUpScreen} from '../screens/auth/SignUpScreen';
import {useAuthStore} from '../store/authStore';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  // A returning user whose stored session was rejected (expired token or a
  // blocked role) skips Welcome and lands straight on Login.
  const startAtLogin = useAuthStore(s => s.startAtLogin);

  return (
    <Stack.Navigator
      initialRouteName={startAtLogin ? 'Login' : 'Welcome'}
      screenOptions={{headerShown: false, animation: 'fade'}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{animation: 'slide_from_right'}}
      />
    </Stack.Navigator>
  );
}
