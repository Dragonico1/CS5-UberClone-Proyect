import { configureStore } from '@reduxjs/toolkit';

import userReducer from './slices/userSlice';
import rideReducer from './slices/rideSlice';
import paymentReducer from './slices/paymentSlice';
import tripHistoryReducer from './slices/tripHistorySlice';

/**
 * Redux store configuration.
 *
 * This file centralizes the global state of the application.
 * Each reducer controls one specific feature of the app.
 */
export const store = configureStore({
  reducer: {
    user: userReducer,
    ride: rideReducer,
    payment: paymentReducer,
    tripHistory: tripHistoryReducer,
  },
});

/**
 * Optional helper to access the current Redux state structure.
 * Useful for debugging during development.
 */
export const getAppState = () => store.getState();

export default store;