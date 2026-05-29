// src/services/userService.js

import firestore from '@react-native-firebase/firestore';
import { database, collections } from './firebaseConfig';

/**
 * Saves or updates a user profile in Firestore.
 *
 * The userId comes from auth state (generated at registration time).
 *
 * @param {string} userId - Unique user identifier.
 * @param {Object} profileData - User profile information.
 * @returns {Promise<Object>} Saved profile data.
 */
export const saveUserProfile = async (userId, profileData) => {
  try {
    if (!userId) throw new Error('User ID is required.');
    if (!profileData) throw new Error('Profile data is required.');

    const userReference = database
      .collection(collections.users)
      .doc(userId);

    const profileToSave = {
      ...profileData,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await userReference.set(profileToSave, { merge: true });

    return { id: userId, ...profileData };
  } catch (error) {
    throw new Error(error.message || 'Failed to save user profile.');
  }
};

/**
 * Gets a user profile from Firestore by document ID.
 *
 * @param {string} userId - Unique user identifier.
 * @returns {Promise<Object|null>} User profile or null if not found.
 */
export const getUserProfile = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required.');

    const userSnapshot = await database
      .collection(collections.users)
      .doc(userId)
      .get();

    if (!userSnapshot.exists) return null;

    return { id: userSnapshot.id, ...userSnapshot.data() };
  } catch (error) {
    throw new Error(error.message || 'Failed to get user profile.');
  }
};

/**
 * Finds a user by phone number.
 *
 * Used during login: the user enters their registered phone number
 * and we look up their Firestore document.
 *
 * @param {string} phoneNumber - Phone number to search.
 * @returns {Promise<Object|null>} User profile with Firestore ID, or null if not found.
 */
export const getUserByPhone = async (phoneNumber) => {
  try {
    if (!phoneNumber) throw new Error('Phone number is required.');

    const snapshot = await database
      .collection(collections.users)
      .where('phoneNumber', '==', phoneNumber.trim())
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      // Firestore timestamps need to be serialised for Redux
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate().toISOString()
        : null,
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to find user by phone.');
  }
};

/**
 * Deletes a user profile from Firestore.
 *
 * @param {string} userId - Unique user identifier.
 * @returns {Promise<boolean>} True when the profile was deleted.
 */
export const deleteUserProfile = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required.');

    await database
      .collection(collections.users)
      .doc(userId)
      .delete();

    return true;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete user profile.');
  }
};