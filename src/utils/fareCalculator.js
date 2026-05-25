import { VEHICLE_CATEGORIES } from './constants';

/**
 * Converts meters to kilometers.
 *
 * @param {number} meters - Distance in meters.
 * @returns {number} Distance in kilometers.
 */
export const metersToKilometers = (meters) => {
  if (!meters || meters <= 0) {
    return 0;
  }

  return meters / 1000;
};

/**
 * Converts seconds to minutes.
 *
 * @param {number} seconds - Duration in seconds.
 * @returns {number} Duration in minutes.
 */
export const secondsToMinutes = (seconds) => {
  if (!seconds || seconds <= 0) {
    return 0;
  }

  return seconds / 60;
};

/**
 * Finds a vehicle category by its ID.
 *
 * @param {string} categoryId - Vehicle category ID.
 * @returns {Object} Vehicle category object.
 */
export const getVehicleCategoryById = (categoryId) => {
  const selectedCategory = VEHICLE_CATEGORIES.find(
    (category) => category.id === categoryId,
  );

  return selectedCategory || VEHICLE_CATEGORIES[0];
};

/**
 * Calculates an estimated ride fare.
 *
 * Formula:
 * base fare + distance cost + time cost, multiplied by category multiplier.
 *
 * @param {Object} params - Fare calculation parameters.
 * @param {number} params.distanceValue - Distance in meters.
 * @param {number} params.durationValue - Duration in seconds.
 * @param {string} params.vehicleCategoryId - Selected vehicle category ID.
 * @returns {number} Estimated fare rounded to the nearest integer.
 */
export const calculateEstimatedFare = ({
  distanceValue,
  durationValue,
  vehicleCategoryId,
}) => {
  const vehicleCategory = getVehicleCategoryById(vehicleCategoryId);

  const distanceInKilometers = metersToKilometers(distanceValue);
  const durationInMinutes = secondsToMinutes(durationValue);

  const distanceCost =
    distanceInKilometers * vehicleCategory.pricePerKilometer;

  const timeCost =
    durationInMinutes * vehicleCategory.pricePerMinute;

  const rawFare =
    (vehicleCategory.baseFare + distanceCost + timeCost) *
    vehicleCategory.multiplier;

  return Math.round(rawFare);
};

/**
 * Formats a fare value as Colombian pesos.
 *
 * @param {number} fare - Fare amount.
 * @returns {string} Formatted fare.
 */
export const formatFare = (fare) => {
  if (!fare || fare <= 0) {
    return '$0 COP';
  }

  return `$${Math.round(fare).toLocaleString('es-CO')} COP`;
};