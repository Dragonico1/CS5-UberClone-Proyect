// src/navigation/AppNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import StackNavigator from './StackNavigator';

/**
 * Main app navigator.
 *
 * SafeAreaProvider must wrap NavigationContainer so that React Navigation
 * and all screens can read the device insets (notch, home indicator, status bar).
 *
 * @returns {React.ReactElement} Main navigation container.
 */
const AppNavigator = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;