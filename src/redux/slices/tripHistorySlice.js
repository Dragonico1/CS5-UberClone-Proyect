import { createSlice } from '@reduxjs/toolkit';

/**
 * Initial state for trip history.
 *
 * This state stores the user's completed rides retrieved from Firestore.
 */
const initialState = {
  trips: [],
  selectedTrip: null,
  isLoading: false,
  error: null,
};

/**
 * Trip history slice.
 *
 * This slice manages completed trips, loading state and selected trip details.
 */
const tripHistorySlice = createSlice({
  name: 'tripHistory',
  initialState,
  reducers: {
    /**
     * Starts loading the trip history.
     */
    fetchTripsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    /**
     * Stores the trip history list after a successful request.
     */
    fetchTripsSuccess: (state, action) => {
      state.isLoading = false;
      state.trips = action.payload;
      state.error = null;
    },

    /**
     * Stores an error if trip history cannot be loaded.
     */
    fetchTripsFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    /**
     * Selects one trip to display its details.
     */
    setSelectedTrip: (state, action) => {
      state.selectedTrip = action.payload;
    },

    /**
     * Adds a new completed trip to the current list.
     */
    addTripToHistory: (state, action) => {
      state.trips.unshift(action.payload);
    },

    /**
     * Clears the selected trip.
     */
    clearSelectedTrip: (state) => {
      state.selectedTrip = null;
    },

    /**
     * Clears the whole trip history state.
     */
    clearTripHistory: () => initialState,
  },
});

export const {
  fetchTripsStart,
  fetchTripsSuccess,
  fetchTripsFailure,
  setSelectedTrip,
  addTripToHistory,
  clearSelectedTrip,
  clearTripHistory,
} = tripHistorySlice.actions;

export default tripHistorySlice.reducer;