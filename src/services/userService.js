import firestore from '@react-native-firebase/firestore';
import { database, collections } from './firebaseConfig';

/**
 * Saves or updates a user profile in Firestore.
 *
 * In this academic version, the userId can be manually generated or fixed.
 * In a real production app, this should come from Firebase Authentication.
 *
 * @param {string} userId - Unique user identifier.
 * @param {Object} profileData - User profile information.
 * @returns {Promise<Object>} Saved profile data.
 */
export const saveUserProfile = async (userId, profileData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required.');
    }

    if (!profileData) {
      throw new Error('Profile data is required.');
    }

    const userReference = database
      .collection(collections.users)
      .doc(userId);

    const profileToSave = {
      ...profileData,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await userReference.set(profileToSave, { merge: true });

    return {
      id: userId,
      ...profileData,
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to save user profile.');
  }
};

/**
 * Gets a user profile from Firestore.
 *
 * @param {string} userId - Unique user identifier.
 * @returns {Promise<Object|null>} User profile or null if it does not exist.
 */
export const getUserProfile = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required.');
    }

    const userSnapshot = await database
      .collection(collections.users)
      .doc(userId)
      .get();

    if (!userSnapshot.exists) {
      return null;
    }

    return {
      id: userSnapshot.id,
      ...userSnapshot.data(),
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to get user profile.');
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
    if (!userId) {
      throw new Error('User ID is required.');
    }

    await database
      .collection(collections.users)
      .doc(userId)
      .delete();

    return true;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete user profile.');
  }
};