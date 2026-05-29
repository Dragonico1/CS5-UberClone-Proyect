// src/services/firebaseConfig.js

import firestore from '@react-native-firebase/firestore';

/**
 * Firestore database instance.
 */
export const database = firestore();

/**
 * Collection names used across the app.
 */
export const collections = {
  users: 'users',
  trips: 'trips',
};

export default database;