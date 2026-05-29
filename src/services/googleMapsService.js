/**
 * Google Maps service.
 *
 * This file centralizes external requests to Google Maps APIs:
 * - Places Autocomplete API
 * - Directions API
 * - Distance Matrix API
 *
 * IMPORTANT:
 * In a real production app, sensitive API keys should be protected.
 * For academic purposes, this key can be stored here or in an environment file.
 */

import { GOOGLE_MAPS_API_KEY } from '@env';



const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

/**
 * Searches places using Google Places Autocomplete API.
 *
 * @param {string} input - Text typed by the user.
 * @returns {Promise<Array>} List of place predictions.
 */
export const searchPlaces = async (input) => {
  try {
    if (!input || input.trim().length === 0) {
      return [];
    }

    const url = `${GOOGLE_MAPS_BASE_URL}/place/autocomplete/json?input=${encodeURIComponent(
      input,
    )}&key=${GOOGLE_MAPS_API_KEY}&language=en`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(data.error_message || 'Failed to search places.');
    }

    return data.predictions || [];
  } catch (error) {
    throw new Error(error.message || 'Failed to search places.');
  }
};

/**
 * Gets place details from Google Places Details API.
 *
 * This is useful because the autocomplete result gives us a place_id,
 * but we need latitude and longitude to draw the route.
 *
 * @param {string} placeId - Google place identifier.
 * @returns {Promise<Object>} Place location data.
 */
export const getPlaceDetails = async (placeId) => {
  try {
    if (!placeId) {
      throw new Error('Place ID is required.');
    }

    const url = `${GOOGLE_MAPS_BASE_URL}/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(data.error_message || 'Failed to get place details.');
    }

    const location = data.result.geometry.location;

    return {
      name: data.result.name,
      address: data.result.formatted_address,
      latitude: location.lat,
      longitude: location.lng,
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to get place details.');
  }
};

/**
 * Gets a route between origin and destination using Google Directions API.
 *
 * @param {Object} origin - Origin coordinates.
 * @param {number} origin.latitude - Origin latitude.
 * @param {number} origin.longitude - Origin longitude.
 * @param {Object} destination - Destination coordinates.
 * @param {number} destination.latitude - Destination latitude.
 * @param {number} destination.longitude - Destination longitude.
 * @returns {Promise<Object>} Route information and decoded coordinates.
 */
export const getDirections = async (origin, destination) => {
  try {
    if (!origin || !destination) {
      throw new Error('Origin and destination are required.');
    }

    const originParam = `${origin.latitude},${origin.longitude}`;
    const destinationParam = `${destination.latitude},${destination.longitude}`;

    const url = `${GOOGLE_MAPS_BASE_URL}/directions/json?origin=${originParam}&destination=${destinationParam}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(data.error_message || 'Failed to get directions.');
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distanceText: leg.distance.text,
      distanceValue: leg.distance.value,
      durationText: leg.duration.text,
      durationValue: leg.duration.value,
      routeCoordinates: decodePolyline(route.overview_polyline.points),
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to get directions.');
  }
};

/**
 * Gets distance and duration using Google Distance Matrix API.
 *
 * @param {Object} origin - Origin coordinates.
 * @param {number} origin.latitude - Origin latitude.
 * @param {number} origin.longitude - Origin longitude.
 * @param {Object} destination - Destination coordinates.
 * @param {number} destination.latitude - Destination latitude.
 * @param {number} destination.longitude - Destination longitude.
 * @returns {Promise<Object>} Distance and duration data.
 */
export const getDistanceMatrix = async (origin, destination) => {
  try {
    if (!origin || !destination) {
      throw new Error('Origin and destination are required.');
    }

    const originParam = `${origin.latitude},${origin.longitude}`;
    const destinationParam = `${destination.latitude},${destination.longitude}`;

    const url = `${GOOGLE_MAPS_BASE_URL}/distancematrix/json?origins=${originParam}&destinations=${destinationParam}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(data.error_message || 'Failed to get distance matrix.');
    }

    const element = data.rows[0].elements[0];

    if (element.status !== 'OK') {
      throw new Error('No valid route found.');
    }

    return {
      distanceText: element.distance.text,
      distanceValue: element.distance.value,
      durationText: element.duration.text,
      durationValue: element.duration.value,
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to get distance matrix.');
  }
};

/**
 * Decodes an encoded polyline from Google Directions API.
 *
 * React Native Maps needs an array of coordinates:
 * [
 *   { latitude: 6.2442, longitude: -75.5812 },
 *   { latitude: 6.2450, longitude: -75.5800 }
 * ]
 *
 * @param {string} encodedPolyline - Encoded polyline string.
 * @returns {Array} Decoded coordinate array.
 */
const decodePolyline = (encodedPolyline) => {
  let index = 0;
  const coordinates = [];
  let latitude = 0;
  let longitude = 0;

  while (index < encodedPolyline.length) {
    let byte = null;
    let shift = 0;
    let result = 0;

    do {
      byte = encodedPolyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const latitudeChange = result & 1 ? ~(result >> 1) : result >> 1;
    latitude += latitudeChange;

    shift = 0;
    result = 0;

    do {
      byte = encodedPolyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const longitudeChange = result & 1 ? ~(result >> 1) : result >> 1;
    longitude += longitudeChange;

    coordinates.push({
      latitude: latitude / 100000,
      longitude: longitude / 100000,
    });
  }

  return coordinates;
};