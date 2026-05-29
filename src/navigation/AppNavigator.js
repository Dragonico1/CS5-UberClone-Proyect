// src/navigation/AppNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import AuthNavigator  from './AuthNavigator';
import StackNavigator from './StackNavigator';

/**
 * Main app navigator.
 *
 * Reads isAuthenticated from authSlice and renders:
 *  - AuthNavigator  → when the user is NOT logged in
 *  - StackNavigator → when the user IS logged in
 *
 * Because both navigators live inside the same NavigationContainer,
 * React Navigation handles the transition automatically when the
 * Redux state changes.
 */
const AppNavigator = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated ? <StackNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;