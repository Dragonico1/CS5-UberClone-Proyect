// src/navigation/TabNavigator.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import RegisterProfileScreen from '../screens/RegisterProfileScreen';
import RideRequestScreen from '../screens/RideRequestScreen';
import TripHistoryScreen from '../screens/TripHistoryScreen';

import { COLORS } from '../utils/constants';

/**
 * Bottom tab navigator instance.
 *
 * This navigator controls the main app tabs.
 */
const Tab = createBottomTabNavigator();

/**
 * Tab navigator.
 *
 * This navigator contains the main sections of the app:
 * - Profile
 * - Ride request
 * - Trip history
 *
 * @returns {React.ReactElement} Bottom tab navigator.
 */
const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="RideRequest"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.mutedText,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Profile"
        component={RegisterProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => null,
        }}
      />

      <Tab.Screen
        name="RideRequest"
        component={RideRequestScreen}
        options={{
          tabBarLabel: 'Ride',
          tabBarIcon: ({ color }) => null,
        }}
      />

      <Tab.Screen
        name="TripHistory"
        component={TripHistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => null,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;