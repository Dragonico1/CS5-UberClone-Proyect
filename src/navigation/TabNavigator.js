// src/navigation/TabNavigator.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
 * useSafeAreaInsets is used to calculate the real bottom inset
 * (home indicator on iPhone, navigation bar on Android) so the
 * tab bar height never overlaps system UI elements.
 *
 * @returns {React.ReactElement} Bottom tab navigator.
 */
const TabNavigator = () => {
  const insets = useSafeAreaInsets();

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
          height: 52 + insets.bottom,
          paddingBottom: insets.bottom + 4,
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