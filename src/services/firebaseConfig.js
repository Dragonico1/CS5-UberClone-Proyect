import firestore from '@react-native-firebase/firestore';

/**
 * Firestore database instance.
 *
 * This file centralizes the Firestore connection using React Native Firebase.
 * The native Firebase configuration is loaded from android/app/google-services.json.
 */
export const database = firestore();

/**
 * Collection names used across the app.
 * Keeping names here prevents spelling mistakes in service files.
 */
export const collections = {
  users: 'users',
  trips: 'trips',
};

export default database;