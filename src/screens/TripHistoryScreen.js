// src/screens/TripHistoryScreen.js

import React, {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import AppButton from '../components/AppButton';
import LoadingOverlay from '../components/LoadingOverlay';

import {
  COLORS,
  DEFAULT_USER_ID,
  RADIUS,
  SPACING,
} from '../utils/constants';

import { formatFare, getVehicleCategoryById } from '../utils/fareCalculator';

import { getTripsByUser } from '../services/tripService';

import {
  fetchTripsFailure,
  fetchTripsStart,
  fetchTripsSuccess,
  setSelectedTrip,
} from '../redux/slices/tripHistorySlice';

/**
 * Trip history screen.
 *
 * This screen displays the user's completed trips loaded from Firestore.
 *
 * @returns {React.ReactElement} Trip history screen.
 */
const TripHistoryScreen = () => {
  const dispatch = useDispatch();

  const {
    trips,
    selectedTrip,
    isLoading,
    error,
  } = useSelector((state) => state.tripHistory);

  /**
   * Memoized total amount spent.
   *
   * This value is recalculated only when the trip list changes.
   */
  const totalSpent = useMemo(() => {
    return trips.reduce((total, trip) => {
      return total + Number(trip.fare || 0);
    }, 0);
  }, [trips]);

  /**
   * Memoized total completed trips.
   */
  const totalTrips = useMemo(() => {
    return trips.length;
  }, [trips]);

  /**
   * Loads trip history from Firestore.
   */
  const loadTripHistory = useCallback(async () => {
    try {
      dispatch(fetchTripsStart());

      const userTrips = await getTripsByUser(DEFAULT_USER_ID);

      dispatch(fetchTripsSuccess(userTrips));
    } catch (requestError) {
      dispatch(fetchTripsFailure(
        requestError.message || 'Failed to load trip history.',
      ));
    }
  }, [dispatch]);

  /**
   * Loads trip history when the screen is mounted.
   */
  useEffect(() => {
    loadTripHistory();
  }, [loadTripHistory]);

  /**
   * Shows errors from Redux state.
   */
  useEffect(() => {
    if (error) {
      Alert.alert('Trip history error', error);
    }
  }, [error]);

  /**
   * Handles pressing one trip item.
   *
   * @param {Object} trip - Selected trip.
   */
  const handleSelectTrip = useCallback(
    (trip) => {
      dispatch(setSelectedTrip(trip));

      Alert.alert(
        'Trip details',
        `Destination: ${trip.destination?.name || 'Not available'}\nFare: ${formatFare(trip.fare)}\nDistance: ${trip.distanceText || 'Not available'}\nDuration: ${trip.durationText || 'Not available'}`,
      );
    },
    [dispatch],
  );

  /**
   * Formats a Firestore ISO date for display.
   *
   * @param {string|null} dateValue - ISO date value.
   * @returns {string} Formatted date.
   */
  const formatTripDate = (dateValue) => {
    if (!dateValue) {
      return 'Date not available';
    }

    return new Date(dateValue).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Renders one trip card.
   *
   * @param {Object} params - FlatList render params.
   * @param {Object} params.item - Trip item.
   * @returns {React.ReactElement} Trip card.
   */
  const renderTripItem = ({ item }) => {
    const vehicleCategory = getVehicleCategoryById(item.vehicleCategory);
    const isSelected = selectedTrip?.id === item.id;

    return (
      <View
        style={[
          styles.tripCard,
          isSelected && styles.selectedTripCard,
        ]}
      >
        <Text style={styles.tripDestination}>
          {item.destination?.name || 'Unknown destination'}
        </Text>

        <Text style={styles.tripAddress}>
          {item.destination?.address || 'Address not available'}
        </Text>

        <View style={styles.tripInfoGrid}>
          <View style={styles.tripInfoItem}>
            <Text style={styles.tripInfoLabel}>Cost</Text>
            <Text style={styles.tripInfoValue}>
              {formatFare(item.fare)}
            </Text>
          </View>

          <View style={styles.tripInfoItem}>
            <Text style={styles.tripInfoLabel}>Date</Text>
            <Text style={styles.tripInfoValue}>
              {formatTripDate(item.createdAt)}
            </Text>
          </View>

          <View style={styles.tripInfoItem}>
            <Text style={styles.tripInfoLabel}>Distance</Text>
            <Text style={styles.tripInfoValue}>
              {item.distanceText || 'N/A'}
            </Text>
          </View>

          <View style={styles.tripInfoItem}>
            <Text style={styles.tripInfoLabel}>Duration</Text>
            <Text style={styles.tripInfoValue}>
              {item.durationText || 'N/A'}
            </Text>
          </View>

          <View style={styles.tripInfoItem}>
            <Text style={styles.tripInfoLabel}>Vehicle</Text>
            <Text style={styles.tripInfoValue}>
              {vehicleCategory.label}
            </Text>
          </View>

          <View style={styles.tripInfoItem}>
            <Text style={styles.tripInfoLabel}>Payment</Text>
            <Text style={styles.tripInfoValue}>
              {item.paymentProvider || 'N/A'}
            </Text>
          </View>
        </View>

        <AppButton
          title="View details"
          onPress={() => handleSelectTrip(item)}
          variant="secondary"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip history</Text>
        <Text style={styles.subtitle}>
          Review your completed rides and payment details.
        </Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total trips</Text>
          <Text style={styles.summaryValue}>{totalTrips}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total spent</Text>
          <Text style={styles.summaryValue}>
            {formatFare(totalSpent)}
          </Text>
        </View>
      </View>

      {trips.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No trips found</Text>
          <Text style={styles.emptyText}>
            Completed trips will appear here after payment.
          </Text>

          <AppButton
            title="Reload history"
            onPress={loadTripHistory}
            variant="secondary"
          />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadTripHistory}
            />
          }
        />
      )}

      <LoadingOverlay
        visible={isLoading}
        message="Loading trip history..."
      />
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
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  summaryLabel: {
    color: COLORS.mutedText,
    fontSize: 13,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: 0,
    paddingBottom: SPACING.xxl,
  },
  tripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  selectedTripCard: {
    borderColor: COLORS.secondary,
    backgroundColor: '#EEF6FF',
  },
  tripDestination: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: SPACING.xs,
  },
  tripAddress: {
    color: COLORS.mutedText,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  tripInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  tripInfoItem: {
    width: '50%',
    marginBottom: SPACING.md,
  },
  tripInfoLabel: {
    color: COLORS.mutedText,
    fontSize: 12,
    marginBottom: 2,
  },
  tripInfoValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    paddingRight: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.mutedText,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
});

export default TripHistoryScreen;