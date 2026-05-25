// src/utils/useCurrentLocation.js

import { useCallback, useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

import { DEFAULT_MAP_REGION } from './constants';

/**
 * Custom hook for getting the user's current location.
 *
 * This hook requests location permission on Android and then retrieves
 * the current device coordinates.
 *
 * @returns {Object} Current location state and actions.
 */
export const useCurrentLocation = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationRegion, setLocationRegion] = useState(DEFAULT_MAP_REGION);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  /**
   * Requests location permission on Android.
   *
   * @returns {Promise<boolean>} True if permission is granted.
   */
  const requestLocationPermission = useCallback(async () => {
    try {
      if (Platform.OS !== 'android') {
        return true;
      }

      const permissionResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location permission',
          message: 'UberClone needs access to your location to request rides.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );

      return permissionResult === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      setLocationError(error.message || 'Failed to request location permission.');
      return false;
    }
  }, []);

  /**
   * Gets the current device location.
   */
  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);

      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        throw new Error('Location permission was denied.');
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          const location = {
            latitude,
            longitude,
          };

          const region = {
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };

          setCurrentLocation(location);
          setLocationRegion(region);
          setIsLoadingLocation(false);
        },
        (error) => {
          setLocationError(error.message || 'Failed to get current location.');
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (error) {
      setLocationError(error.message || 'Failed to get current location.');
      setIsLoadingLocation(false);
    }
  }, [requestLocationPermission]);

  /**
   * Automatically tries to load the current location when the hook is used.
   */
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    currentLocation,
    locationRegion,
    isLoadingLocation,
    locationError,
    getCurrentLocation,
  };
};

export default useCurrentLocation;