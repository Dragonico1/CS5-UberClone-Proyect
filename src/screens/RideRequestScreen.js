// src/screens/RideRequestScreen.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';

import AppButton from '../components/AppButton';
import LoadingOverlay from '../components/LoadingOverlay';
import RideInfoCard from '../components/RideInfoCard';
import VehicleCategoryCard from '../components/VehicleCategoryCard';

import {
  COLORS,
  DEFAULT_MAP_REGION,
  RIDE_STATUS,
  SPACING,
  RADIUS,
  VEHICLE_CATEGORIES,
} from '../utils/constants';

import { calculateEstimatedFare } from '../utils/fareCalculator';
import { useCurrentLocation } from '../utils/useCurrentLocation';

import {
  getDirections,
  getDistanceMatrix,
  getPlaceDetails,
  searchPlaces,
} from '../services/googleMapsService';

import {
  setDestination,
  setEstimatedFare,
  setOrigin,
  setRideMetrics,
  setRideStatus,
  setRouteCoordinates,
  setSelectedVehicleCategory,
} from '../redux/slices/rideSlice';

/**
 * Ride request screen.
 *
 * This screen lets the user search a destination, view the route on a map,
 * select a vehicle category and calculate the estimated fare.
 *
 * @param {Object} props - Screen props.
 * @param {Object} props.navigation - React Navigation object.
 * @returns {React.ReactElement} Ride request screen.
 */
const RideRequestScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const ride = useSelector((state) => state.ride);

  const {
    currentLocation,
    locationRegion,
    isLoadingLocation,
    locationError,
    getCurrentLocation,
  } = useCurrentLocation();

  const [destinationInput, setDestinationInput] = useState('');
  const [placePredictions, setPlacePredictions] = useState([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isCalculatingRide, setIsCalculatingRide] = useState(false);
  const [localError, setLocalError] = useState('');

  /**
   * Memoized map region.
   */
  const mapRegion = useMemo(() => {
    return locationRegion || DEFAULT_MAP_REGION;
  }, [locationRegion]);

  /**
   * Stores current location as ride origin when it becomes available.
   */
  useEffect(() => {
    if (currentLocation) {
      dispatch(setOrigin(currentLocation));
    }
  }, [currentLocation, dispatch]);

  /**
   * Shows location errors clearly.
   */
  useEffect(() => {
    if (locationError) {
      setLocalError(locationError);
    }
  }, [locationError]);

  /**
   * Searches places when the user types a destination.
   */
  const handleDestinationChange = useCallback(async (text) => {
    setDestinationInput(text);
    setLocalError('');

    if (text.trim().length < 3) {
      setPlacePredictions([]);
      return;
    }

    try {
      setIsSearchingPlaces(true);

      const predictions = await searchPlaces(text);

      setPlacePredictions(predictions);
    } catch (error) {
      setLocalError(error.message || 'Failed to search destination.');
    } finally {
      setIsSearchingPlaces(false);
    }
  }, []);

  /**
   * Handles selecting one place from the autocomplete results.
   */
  const handleSelectPlace = useCallback(
    async (place) => {
      try {
        if (!currentLocation) {
          Alert.alert(
            'Location required',
            'Current location is required before selecting a destination.',
          );
          return;
        }

        setIsCalculatingRide(true);
        setLocalError('');
        setPlacePredictions([]);
        setDestinationInput(place.description);

        const placeDetails = await getPlaceDetails(place.place_id);

        const destinationData = {
          name: placeDetails.name,
          address: placeDetails.address,
          latitude: placeDetails.latitude,
          longitude: placeDetails.longitude,
        };

        dispatch(setDestination(destinationData));

        const directions = await getDirections(
          currentLocation,
          destinationData,
        );

        const distanceMatrix = await getDistanceMatrix(
          currentLocation,
          destinationData,
        );

        dispatch(setRouteCoordinates(directions.routeCoordinates));

        dispatch(setRideMetrics({
          distanceText: distanceMatrix.distanceText,
          distanceValue: distanceMatrix.distanceValue,
          durationText: distanceMatrix.durationText,
          durationValue: distanceMatrix.durationValue,
        }));

        const fare = calculateEstimatedFare({
          distanceValue: distanceMatrix.distanceValue,
          durationValue: distanceMatrix.durationValue,
          vehicleCategoryId: ride.selectedVehicleCategory,
        });

        dispatch(setEstimatedFare(fare));
      } catch (error) {
        setLocalError(error.message || 'Failed to calculate ride.');
      } finally {
        setIsCalculatingRide(false);
      }
    },
    [currentLocation, dispatch, ride.selectedVehicleCategory],
  );

  /**
   * Handles selecting a vehicle category.
   */
  const handleSelectVehicleCategory = useCallback(
    (categoryId) => {
      dispatch(setSelectedVehicleCategory(categoryId));

      if (ride.distanceValue && ride.durationValue) {
        const fare = calculateEstimatedFare({
          distanceValue: ride.distanceValue,
          durationValue: ride.durationValue,
          vehicleCategoryId: categoryId,
        });

        dispatch(setEstimatedFare(fare));
      }
    },
    [dispatch, ride.distanceValue, ride.durationValue],
  );

  /**
   * Validates and starts the ride request flow.
   */
  const handleRequestRide = useCallback(() => {
    if (!ride.origin) {
      Alert.alert('Origin required', 'Please allow location access first.');
      return;
    }

    if (!ride.destination) {
      Alert.alert('Destination required', 'Please select a destination.');
      return;
    }

    if (!ride.estimatedFare || ride.estimatedFare <= 0) {
      Alert.alert('Fare required', 'Please calculate the ride fare first.');
      return;
    }

    dispatch(setRideStatus(RIDE_STATUS.searching));

    navigation.navigate('RealTimeTracking');
  }, [
    dispatch,
    navigation,
    ride.origin,
    ride.destination,
    ride.estimatedFare,
  ]);

  /**
   * Reloads current location manually.
   */
  const handleReloadLocation = useCallback(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Request ride</Text>
        <Text style={styles.subtitle}>
          Search your destination and choose the best ride category.
        </Text>

        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={mapRegion}
            region={mapRegion}
          >
            {ride.origin ? (
              <Marker
                coordinate={ride.origin}
                title="Origin"
                description="Your current location"
              />
            ) : null}

            {ride.destination ? (
              <Marker
                coordinate={{
                  latitude: ride.destination.latitude,
                  longitude: ride.destination.longitude,
                }}
                title={ride.destination.name || 'Destination'}
                description={ride.destination.address}
              />
            ) : null}

            {ride.routeCoordinates.length > 0 ? (
              <Polyline
                coordinates={ride.routeCoordinates}
                strokeWidth={5}
                strokeColor={COLORS.secondary}
              />
            ) : null}
          </MapView>
        </View>

        <AppButton
          title="Reload current location"
          onPress={handleReloadLocation}
          variant="secondary"
          isLoading={isLoadingLocation}
        />

        <View style={styles.searchContainer}>
          <Text style={styles.sectionTitle}>Destination</Text>

          <TextInput
            style={styles.searchInput}
            value={destinationInput}
            onChangeText={handleDestinationChange}
            placeholder="Search destination"
            placeholderTextColor={COLORS.mutedText}
          />

          {isSearchingPlaces ? (
            <Text style={styles.helperText}>Searching places...</Text>
          ) : null}

          {placePredictions.length > 0 ? (
            <View style={styles.predictionsContainer}>
              {placePredictions.map((item) => (
                <Pressable
                  key={item.place_id}
                  style={styles.predictionItem}
                  onPress={() => handleSelectPlace(item)}
                >
                  <Text style={styles.predictionMainText}>
                    {item.structured_formatting?.main_text || item.description}
                  </Text>
                  <Text style={styles.predictionSecondaryText}>
                    {item.structured_formatting?.secondary_text || ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {localError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{localError}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle category</Text>

          {VEHICLE_CATEGORIES.map((category) => (
            <VehicleCategoryCard
              key={category.id}
              category={category}
              isSelected={ride.selectedVehicleCategory === category.id}
              onPress={() => handleSelectVehicleCategory(category.id)}
            />
          ))}
        </View>

        <RideInfoCard
          distanceText={ride.distanceText}
          durationText={ride.durationText}
          vehicleCategoryId={ride.selectedVehicleCategory}
          estimatedFare={ride.estimatedFare}
        />

        <AppButton
          title="Request ride"
          onPress={handleRequestRide}
          disabled={!ride.destination || !ride.estimatedFare}
        />
      </ScrollView>

      <LoadingOverlay
        visible={isCalculatingRide}
        message="Calculating route and fare..."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    marginBottom: SPACING.lg,
  },
  mapContainer: {
    height: 280,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  searchInput: {
    minHeight: 50,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
    fontSize: 15,
  },
  helperText: {
    color: COLORS.mutedText,
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  predictionsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
    maxHeight: 220,
    overflow: 'hidden',
  },
  predictionItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  predictionMainText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  predictionSecondaryText: {
    color: COLORS.mutedText,
    fontSize: 13,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default RideRequestScreen;