// src/navigation/StackNavigator.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';

import RealTimeTrackingScreen from '../screens/RealTimeTrackingScreen';
import PaymentScreen from '../screens/PaymentScreen';

import { COLORS } from '../utils/constants';

/**
 * Native stack navigator instance.
 *
 * This navigator controls the main app flow.
 */
const Stack = createNativeStackNavigator();

/**
 * Stack navigator.
 *
 * This navigator combines the bottom tabs with flow-specific screens
 * such as real-time tracking and payment.
 *
 * @returns {React.ReactElement} Native stack navigator.
 */
const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '800',
        },
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="RealTimeTracking"
        component={RealTimeTrackingScreen}
        options={{
          title: 'Real-time tracking',
        }}
      />

      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          title: 'Payment',
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;