import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from '@react-native-firebase/firestore';

import { collections } from './firebaseConfig';

const db = getFirestore();

/**
 * Saves a completed trip in Firestore.
 *
 * This function is called when a ride is finished or paid successfully.
 *
 * @param {Object} tripData - Completed trip information.
 * @param {string} tripData.userId - User identifier.
 * @param {Object} tripData.origin - Origin location.
 * @param {Object} tripData.destination - Destination location.
 * @param {string} tripData.vehicleCategory - Selected vehicle category.
 * @param {number} tripData.fare - Final trip fare.
 * @param {string} tripData.distanceText - Human-readable distance.
 * @param {string} tripData.durationText - Human-readable duration.
 * @param {string} tripData.paymentProvider - Payment provider used.
 * @param {string} tripData.transactionId - Payment transaction identifier.
 * @returns {Promise<Object>} Saved trip data.
 */
export const saveCompletedTrip = async (tripData) => {
  try {
    if (!tripData) {
      throw new Error('Trip data is required.');
    }

    if (!tripData.userId) {
      throw new Error('User ID is required.');
    }

    const tripToSave = {
      userId: tripData.userId,
      origin: tripData.origin,
      destination: tripData.destination,
      vehicleCategory: tripData.vehicleCategory,
      fare: tripData.fare,
      distanceText: tripData.distanceText,
      durationText: tripData.durationText,
      paymentProvider: tripData.paymentProvider,
      transactionId: tripData.transactionId,
      status: 'completed',
      createdAt: serverTimestamp(),
    };

    const tripReference = await addDoc(
      collection(db, collections.trips),
      tripToSave,
    );

    return {
      id: tripReference.id,
      ...tripData,
      status: 'completed',
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to save completed trip.');
  }
};

/**
 * Gets all completed trips for a specific user.
 *
 * @param {string} userId - User identifier.
 * @returns {Promise<Array>} User trip history.
 */
export const getTripsByUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required.');
    }

    const q = query(
      collection(db, collections.trips),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(q);

    const trips = snapshot.docs.map((documentSnapshot) => {
      const data = documentSnapshot.data();

      return {
        id: documentSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : null,
      };
    });

    return trips;
  } catch (error) {
    throw new Error(error.message || 'Failed to get trip history.');
  }
};

/**
 * Gets one trip by its Firestore document ID.
 *
 * @param {string} tripId - Trip document identifier.
 * @returns {Promise<Object|null>} Trip details or null if not found.
 */
export const getTripById = async (tripId) => {
  try {
    if (!tripId) {
      throw new Error('Trip ID is required.');
    }

    const tripSnapshot = await getDoc(
      doc(db, collections.trips, tripId),
    );

    if (!tripSnapshot.exists()) {
      return null;
    }

    const data = tripSnapshot.data();

    return {
      id: tripSnapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : null,
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to get trip details.');
  }
};

/**
 * Updates the status of an existing trip.
 *
 * @param {string} tripId - Trip document identifier.
 * @param {string} status - New trip status.
 * @returns {Promise<boolean>} True when the trip was updated.
 */
export const updateTripStatus = async (tripId, status) => {
  try {
    if (!tripId) {
      throw new Error('Trip ID is required.');
    }

    if (!status) {
      throw new Error('Trip status is required.');
    }

    await updateDoc(doc(db, collections.trips, tripId), {
      status,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    throw new Error(error.message || 'Failed to update trip status.');
  }
};