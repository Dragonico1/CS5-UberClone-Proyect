// src/redux/slices/authSlice.js

import { createSlice } from '@reduxjs/toolkit';

/**
 * Initial state for authentication.
 *
 * userId is the Firestore document ID of the logged-in user.
 * isAuthenticated controls which navigator is shown (Auth vs Main).
 */
const initialState = {
  userId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Called when a user logs in or registers successfully.
     * Stores the Firestore userId so every service call uses the real ID.
     */
    loginSuccess: (state, action) => {
      state.userId = action.payload.userId;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    /**
     * Starts an auth operation (login / register).
     */
    authStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    /**
     * Stores an auth error.
     */
    authFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    /**
     * Logs the user out and resets auth state.
     */
    logout: () => initialState,
  },
});

export const {
  loginSuccess,
  authStart,
  authFailure,
  logout,
} = authSlice.actions;

export default authSlice.reducer;