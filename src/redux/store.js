// src/redux/store.js

import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import rideReducer from './slices/rideSlice';
import paymentReducer from './slices/paymentSlice';
import tripHistoryReducer from './slices/tripHistorySlice';

/**
 * Redux store configuration.
 *
 * auth    — session (userId, isAuthenticated)
 * user    — profile data (name, phone, email, etc.)
 * ride    — active ride state
 * payment — payment flow state
 * tripHistory — completed trips
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    ride: rideReducer,
    payment: paymentReducer,
    tripHistory: tripHistoryReducer,
  },
});

export const getAppState = () => store.getState();

export default store;