// src/components/RideInfoCard.js

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS, RADIUS, SPACING } from '../utils/constants';
import { formatFare, getVehicleCategoryById } from '../utils/fareCalculator';

/**
 * Reusable ride information card.
 *
 * This component displays the estimated ride information:
 * distance, duration, selected vehicle category and estimated fare.
 *
 * @param {Object} props - Component props.
 * @param {string} props.distanceText - Human-readable distance.
 * @param {string} props.durationText - Human-readable duration.
 * @param {string} props.vehicleCategoryId - Selected vehicle category ID.
 * @param {number} props.estimatedFare - Estimated fare value.
 * @returns {React.ReactElement|null} Ride information card.
 */
const RideInfoCard = ({
  distanceText,
  durationText,
  vehicleCategoryId,
  estimatedFare,
}) => {
  const vehicleCategory = getVehicleCategoryById(vehicleCategoryId);

  const shouldShowCard =
    distanceText ||
    durationText ||
    estimatedFare > 0;

  if (!shouldShowCard) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ride summary</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{distanceText || 'Not available'}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Duration</Text>
        <Text style={styles.value}>{durationText || 'Not available'}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Vehicle</Text>
        <Text style={styles.value}>{vehicleCategory.label}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Estimated fare</Text>
        <Text style={styles.totalValue}>{formatFare(estimatedFare)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  label: {
    color: COLORS.mutedText,
    fontSize: 14,
  },
  value: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: COLORS.secondary,
    fontSize: 20,
    fontWeight: '900',
  },
});

export default RideInfoCard;