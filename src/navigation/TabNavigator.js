// src/navigation/TabNavigator.js

import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import RegisterProfileScreen from '../screens/RegisterProfileScreen';
import RideRequestScreen     from '../screens/RideRequestScreen';
import TripHistoryScreen     from '../screens/TripHistoryScreen';

import { COLORS } from '../utils/constants';

import { logout }          from '../redux/slices/authSlice';
import { clearUserProfile } from '../redux/slices/userSlice';
import { clearRide }        from '../redux/slices/rideSlice';
import { clearPayment }     from '../redux/slices/paymentSlice';
import { clearTripHistory } from '../redux/slices/tripHistorySlice';

const Tab = createBottomTabNavigator();

/**
 * Tab navigator.
 *
 * Contains the main sections of the app after authentication:
 *  - Profile     → RegisterProfileScreen in edit mode (isEditing: true)
 *  - Ride        → RideRequestScreen
 *  - History     → TripHistoryScreen
 *
 * The logout button lives in the Profile tab header so it's
 * always accessible without cluttering the main UI.
 */
const TabNavigator = () => {
  const insets   = useSafeAreaInsets();
  const dispatch = useDispatch();

  /**
   * Clears all Redux slices and returns to AuthNavigator.
   */
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            dispatch(clearTripHistory());
            dispatch(clearPayment());
            dispatch(clearRide());
            dispatch(clearUserProfile());
            dispatch(logout());
            // AppNavigator switches to AuthNavigator automatically
          },
        },
      ],
    );
  }, [dispatch]);

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
          tabBarLabel: 'Perfil',
          tabBarIcon: () => null,
          // Show header only on Profile tab so logout button is visible
          headerShown: true,
          headerTitle: 'Mi perfil',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800' },
          headerRight: () => (
            <LogoutButton onPress={handleLogout} />
          ),
        }}
        initialParams={{ isEditing: true }}
      />

      <Tab.Screen
        name="RideRequest"
        component={RideRequestScreen}
        options={{
          tabBarLabel: 'Viaje',
          tabBarIcon: () => null,
        }}
      />

      <Tab.Screen
        name="TripHistory"
        component={TripHistoryScreen}
        options={{
          tabBarLabel: 'Historial',
          tabBarIcon: () => null,
        }}
      />
    </Tab.Navigator>
  );
};

// ─── Logout button component ──────────────────────────────────────────────────

import { Pressable, Text, StyleSheet } from 'react-native';
import { SPACING } from '../utils/constants';

const LogoutButton = ({ onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.logoutBtn,
      pressed && { opacity: 0.6 },
    ]}
  >
    <Text style={styles.logoutText}>Salir</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  logoutBtn: {
    marginRight: SPACING.md,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default TabNavigator;