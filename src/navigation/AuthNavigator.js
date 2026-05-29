// src/navigation/AuthNavigator.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthScreen            from '../screens/AuthScreen';
import LoginScreen           from '../screens/LoginScreen';
import RegisterProfileScreen from '../screens/RegisterProfileScreen';

import { COLORS } from '../utils/constants';

const Stack = createNativeStackNavigator();

/**
 * Auth navigator.
 *
 * Shown when the user is NOT authenticated (isAuthenticated = false).
 *
 * Routes:
 *  Auth     — welcome screen (entry point)
 *  Login    — phone number login
 *  Register — create new account (RegisterProfileScreen with isEditing = false)
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Ingresar' }}
      />

      <Stack.Screen
        name="Register"
        component={RegisterProfileScreen}
        options={{ title: 'Crear cuenta' }}
        initialParams={{ isEditing: false }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;