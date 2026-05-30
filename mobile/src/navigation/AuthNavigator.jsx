import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {WelcomeScreen} from '../screens/auth/WelcomeScreen';
import {LoginScreen} from '../screens/auth/LoginScreen';
import {SignUpScreen} from '../screens/auth/SignUpScreen';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator
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
