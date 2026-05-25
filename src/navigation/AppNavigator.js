// src/navigation/AppNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import StackNavigator from './StackNavigator';

/**
 * Main app navigator.
 *
 * This component wraps the entire navigation system inside NavigationContainer.
 * React Navigation needs this container to manage navigation state internally.
 *
 * @returns {React.ReactElement} Main navigation container.
 */
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;