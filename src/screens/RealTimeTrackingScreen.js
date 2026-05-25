// src/screens/RealTimeTrackingScreen.js

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, {
  AnimatedRegion,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';

import AppButton from '../components/AppButton';
import RideInfoCard from '../components/RideInfoCard';

import {
  COLORS,
  DEFAULT_DRIVER_LOCATION,
  DEFAULT_MAP_REGION,
  RIDE_STATUS,
  RADIUS,
  SPACING,
} from '../utils/constants';

import { useDriverSimulation } from '../utils/useDriverSimulation';

import {
  setDriverLocation,
  setRideStatus,
} from '../redux/slices/rideSlice';

/**
 * Real-time tracking screen.
 *
 * This screen simulates a driver moving first to the pickup point
 * and then to the selected destination.
 *
 * @param {Object} props - Screen props.
 * @param {Object} props.navigation - React Navigation object.
 * @returns {React.ReactElement} Real-time tracking screen.
 */
const RealTimeTrackingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const ride = useSelector((state) => state.ride);

  const [trackingPhase, setTrackingPhase] = useState('waiting');

  /**
   * Creates a fake driver location near the pickup point.
   * If there is no origin yet, it uses the default driver location.
   */
  const initialDriverLocation = ride.origin
    ? {
        latitude: ride.origin.latitude + 0.015,
        longitude: ride.origin.longitude - 0.015,
      }
    : DEFAULT_DRIVER_LOCATION;

  const {
    driverLocation,
    isDriverMoving,
    simulationError,
    moveAlongRoute,
    stopSimulation,
    resetDriverLocation,
  } = useDriverSimulation(initialDriverLocation);

  const animatedDriverCoordinate = useRef(
    new AnimatedRegion({
      latitude: initialDriverLocation.latitude,
      longitude: initialDriverLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
  ).current;

  /**
   * Moves the animated marker whenever the simulated driver location changes.
   */
  useEffect(() => {
    dispatch(setDriverLocation(driverLocation));

    animatedDriverCoordinate
      .timing({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        duration: 650,
        useNativeDriver: false,
      })
      .start();
  }, [driverLocation, dispatch, animatedDriverCoordinate]);

  /**
   * Shows simulation errors.
   */
  useEffect(() => {
    if (simulationError) {
      Alert.alert('Tracking error', simulationError);
    }
  }, [simulationError]);

  /**
   * Stops simulation when leaving the screen.
   */
  useEffect(() => {
    return () => {
      stopSimulation();
    };
  }, [stopSimulation]);

  /**
   * Starts the full simulated trip:
   * 1. Driver moves to pickup.
   * 2. Driver moves from pickup to destination.
   */
  const handleStartTracking = useCallback(() => {
    if (!ride.origin) {
      Alert.alert('Origin required', 'A pickup location is required.');
      return;
    }

    if (!ride.destination) {
      Alert.alert('Destination required', 'A destination is required.');
      return;
    }

    if (!ride.routeCoordinates || ride.routeCoordinates.length < 2) {
      Alert.alert(
        'Route required',
        'A valid route is required before starting tracking.',
      );
      return;
    }

    dispatch(setRideStatus(RIDE_STATUS.inProgress));
    setTrackingPhase('pickup_to_destination');

    moveAlongRoute(ride.routeCoordinates, () => {
      dispatch(setRideStatus(RIDE_STATUS.completed));
      setTrackingPhase('completed');

      Alert.alert(
        'Trip completed',
        'The simulated ride has arrived at the destination.',
        [
          {
            text: 'Go to payment',
            onPress: () => navigation.navigate('Payment'),
          },
        ],
      );
    });
  }, [
    dispatch,
    moveAlongRoute,
    navigation,
    ride.origin,
    ride.destination,
    ride.routeCoordinates,
  ]);

  /**
   * Navigates to payment after the simulated trip is completed.
   */
  const handleGoToPayment = useCallback(() => {
    if (ride.rideStatus !== RIDE_STATUS.completed) {
      Alert.alert(
        'Trip not completed',
        'Please wait until the simulated trip reaches the destination.',
      );
      return;
    }

    navigation.navigate('Payment');
  }, [navigation, ride.rideStatus]);

  /**
   * Resets driver simulation.
   */
  const handleResetDriver = useCallback(() => {
    resetDriverLocation(initialDriverLocation);
    dispatch(setRideStatus(RIDE_STATUS.searching));
    setTrackingPhase('waiting');
  }, [
    dispatch,
    resetDriverLocation,
    initialDriverLocation,
  ]);

  const mapInitialRegion = ride.origin
    ? {
        latitude: ride.origin.latitude,
        longitude: ride.origin.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }
    : DEFAULT_MAP_REGION;

  const destinationCoordinates = ride.destination
    ? {
        latitude: ride.destination.latitude,
        longitude: ride.destination.longitude,
      }
    : null;

  const driverPathCoordinates = destinationCoordinates && ride.origin
    ? [driverLocation, ride.origin, destinationCoordinates]
    : ride.origin
      ? [driverLocation, ride.origin]
      : [];

  const trackingMessage = {
    waiting: 'Press start to simulate the driver route.',
    driver_to_pickup: 'Driver is moving toward your pickup point.',
    pickup_to_destination: 'Trip started. Driver is moving to the destination.',
    completed: 'Trip completed. You can now continue to payment.',
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Real-time tracking</Text>
        <Text style={styles.subtitle}>
          Track your simulated driver while the ride is active.
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapInitialRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {ride.origin ? (
            <Marker
              coordinate={ride.origin}
              title="Pickup point"
              description="Your pickup location"
              pinColor="red"
            />
          ) : null}

          {destinationCoordinates ? (
            <Marker
              coordinate={destinationCoordinates}
              title={ride.destination.name || 'Destination'}
              description={ride.destination.address}
              pinColor="green"
            />
          ) : null}

          {ride.routeCoordinates.length > 0 ? (
            <Polyline
              coordinates={ride.routeCoordinates}
              strokeWidth={5}
              strokeColor={COLORS.secondary}
            />
          ) : null}

          {driverPathCoordinates.length > 1 ? (
            <Polyline
              coordinates={driverPathCoordinates}
              strokeWidth={3}
              strokeColor={COLORS.warning}
            />
          ) : null}

          <Marker.Animated
            coordinate={animatedDriverCoordinate}
            title="Driver"
            description="Simulated driver location"
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverIcon}>🚗</Text>
            </View>
          </Marker.Animated>
        </MapView>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Ride status</Text>
          <Text style={styles.statusValue}>{ride.rideStatus}</Text>

          <Text style={styles.driverStatus}>
            {trackingMessage[trackingPhase]}
          </Text>
        </View>

        <RideInfoCard
          distanceText={ride.distanceText}
          durationText={ride.durationText}
          vehicleCategoryId={ride.selectedVehicleCategory}
          estimatedFare={ride.estimatedFare}
        />

        <AppButton
          title="Start simulated tracking"
          onPress={handleStartTracking}
          disabled={isDriverMoving || trackingPhase === 'completed'}
        />

        <AppButton
          title="Reset simulation"
          onPress={handleResetDriver}
          variant="secondary"
        />

        <AppButton
          title="Go to payment"
          onPress={handleGoToPayment}
          disabled={ride.rideStatus !== RIDE_STATUS.completed}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
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
  },
  mapContainer: {
    height: 300,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  statusLabel: {
    color: COLORS.mutedText,
    fontSize: 13,
    marginBottom: SPACING.xs,
  },
  statusValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  driverStatus: {
    color: COLORS.mutedText,
    fontSize: 14,
    marginTop: SPACING.sm,
  },
  driverMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  driverIcon: {
    fontSize: 24,
  },
});

export default RealTimeTrackingScreen;