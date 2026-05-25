import { createSlice } from '@reduxjs/toolkit';

/**
 * Initial state for ride requests.
 *
 * This state stores all information related to the current ride.
 */
const initialState = {
  origin: null,
  destination: null,
  routeCoordinates: [],
  selectedVehicleCategory: 'economy',
  distanceText: '',
  distanceValue: 0,
  durationText: '',
  durationValue: 0,
  estimatedFare: 0,
  driverLocation: null,
  rideStatus: 'idle',
  error: null,
};

/**
 * Ride slice.
 *
 * This slice manages ride request data, selected vehicle category,
 * estimated fare, map route and real-time driver tracking state.
 */
const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    /**
     * Sets the user current origin location.
     */
    setOrigin: (state, action) => {
      state.origin = action.payload;
    },

    /**
     * Sets the selected destination location.
     */
    setDestination: (state, action) => {
      state.destination = action.payload;
    },

    /**
     * Stores the route coordinates returned by Google Directions API.
     */
    setRouteCoordinates: (state, action) => {
      state.routeCoordinates = action.payload;
    },

    /**
     * Updates the selected vehicle category.
     */
    setSelectedVehicleCategory: (state, action) => {
      state.selectedVehicleCategory = action.payload;
    },

    /**
     * Stores distance and duration data returned by Google Distance Matrix API.
     */
    setRideMetrics: (state, action) => {
      const {
        distanceText,
        distanceValue,
        durationText,
        durationValue,
      } = action.payload;

      state.distanceText = distanceText;
      state.distanceValue = distanceValue;
      state.durationText = durationText;
      state.durationValue = durationValue;
    },

    /**
     * Stores the calculated fare.
     */
    setEstimatedFare: (state, action) => {
      state.estimatedFare = action.payload;
    },

    /**
     * Updates the animated driver location.
     */
    setDriverLocation: (state, action) => {
      state.driverLocation = action.payload;
    },

    /**
     * Updates the current ride status.
     *
     * Possible values:
     * idle, searching, accepted, in_progress, completed, cancelled
     */
    setRideStatus: (state, action) => {
      state.rideStatus = action.payload;
    },

    /**
     * Stores ride-related errors.
     */
    setRideError: (state, action) => {
      state.error = action.payload;
    },

    /**
     * Clears all ride data.
     */
    clearRide: () => initialState,
  },
});

export const {
  setOrigin,
  setDestination,
  setRouteCoordinates,
  setSelectedVehicleCategory,
  setRideMetrics,
  setEstimatedFare,
  setDriverLocation,
  setRideStatus,
  setRideError,
  clearRide,
} = rideSlice.actions;

export default rideSlice.reducer;