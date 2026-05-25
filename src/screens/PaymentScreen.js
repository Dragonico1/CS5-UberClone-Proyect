// src/screens/PaymentScreen.js

import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import AppButton from '../components/AppButton';
import LoadingOverlay from '../components/LoadingOverlay';
import RideInfoCard from '../components/RideInfoCard';

import {
  COLORS,
  DEFAULT_USER_ID,
  PAYMENT_PROVIDERS,
  RADIUS,
  SPACING,
} from '../utils/constants';

import { formatFare } from '../utils/fareCalculator';

import {
  createMercadoPagoPreference,
  createStripePaymentIntent,
} from '../services/paymentService';

import { saveCompletedTrip } from '../services/tripService';

import {
  clearPayment,
  paymentFailure,
  paymentSuccess,
  setPaymentProvider,
  setSelectedPaymentMethod,
  startPayment,
} from '../redux/slices/paymentSlice';

import {
  addTripToHistory,
} from '../redux/slices/tripHistorySlice';

/**
 * Payment screen.
 *
 * This screen lets the user select a payment provider,
 * process the payment and save the completed trip in Firestore.
 *
 * @param {Object} props - Screen props.
 * @param {Object} props.navigation - React Navigation object.
 * @returns {React.ReactElement} Payment screen.
 */
const PaymentScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const ride = useSelector((state) => state.ride);
  const payment = useSelector((state) => state.payment);
  const user = useSelector((state) => state.user);

  const [selectedProvider, setSelectedProvider] = useState(
    payment.paymentProvider || '',
  );

  /**
   * Memoized payment description.
   *
   * useMemo avoids rebuilding this text unless ride data changes.
   */
  const paymentDescription = useMemo(() => {
    const destinationName = ride.destination?.name || 'selected destination';

    return `UberClone ride to ${destinationName}`;
  }, [ride.destination]);

  /**
   * Builds the payment payload used by Stripe and Mercado Pago.
   */
  const paymentPayload = useMemo(() => {
    return {
      amount: ride.estimatedFare,
      currency: 'cop',
      userId: DEFAULT_USER_ID,
      description: paymentDescription,
    };
  }, [ride.estimatedFare, paymentDescription]);

  /**
   * Handles selecting a payment provider.
   *
   * @param {string} providerId - Selected provider ID.
   */
  const handleSelectProvider = useCallback(
    (providerId) => {
      setSelectedProvider(providerId);
      dispatch(setPaymentProvider(providerId));

      const method = providerId === 'stripe'
        ? 'credit_card'
        : 'mercado_pago_wallet';

      dispatch(setSelectedPaymentMethod(method));
    },
    [dispatch],
  );

  /**
   * Saves the completed trip after a successful payment.
   *
   * @param {Object} transactionData - Payment transaction information.
   * @returns {Promise<Object>} Saved trip.
   */
  const saveTripAfterPayment = useCallback(
    async (transactionData) => {
      const completedTrip = await saveCompletedTrip({
        userId: DEFAULT_USER_ID,
        origin: ride.origin,
        destination: ride.destination,
        vehicleCategory: ride.selectedVehicleCategory,
        fare: ride.estimatedFare,
        distanceText: ride.distanceText,
        durationText: ride.durationText,
        paymentProvider: selectedProvider,
        transactionId: transactionData.transactionId,
      });

      dispatch(addTripToHistory(completedTrip));

      return completedTrip;
    },
    [
      dispatch,
      ride.origin,
      ride.destination,
      ride.selectedVehicleCategory,
      ride.estimatedFare,
      ride.distanceText,
      ride.durationText,
      selectedProvider,
    ],
  );

  /**
   * Processes payment depending on the selected provider.
   */
  const handlePay = useCallback(async () => {
    if (!ride.destination || !ride.estimatedFare) {
      Alert.alert(
        'Payment unavailable',
        'Ride destination and estimated fare are required.',
      );
      return;
    }

    if (!selectedProvider) {
      Alert.alert(
        'Payment provider required',
        'Please select Stripe or Mercado Pago.',
      );
      return;
    }

    try {
      dispatch(startPayment());

      let paymentResponse = null;

      if (selectedProvider === 'stripe') {
        paymentResponse = await createStripePaymentIntent(paymentPayload);
      }

      if (selectedProvider === 'mercado_pago') {
        paymentResponse = await createMercadoPagoPreference(paymentPayload);
      }

      /**
       * Academic fallback:
       *
       * If there is no real backend yet, this creates a simulated transaction ID.
       * Once your backend is ready, replace this fallback with the real response.
       */
      const transactionData = {
        transactionId:
          paymentResponse?.transactionId ||
          paymentResponse?.id ||
          `demo-${selectedProvider}-${Date.now()}`,
      };

      dispatch(paymentSuccess(transactionData));

      await saveTripAfterPayment(transactionData);

      Alert.alert(
        'Payment successful',
        'Your trip was paid and saved successfully.',
        [
          {
            text: 'View history',
            onPress: () => navigation.navigate('MainTabs', {
              screen: 'TripHistory',
            }),
          },
        ],
      );
    } catch (error) {
      dispatch(paymentFailure(error.message || 'Payment failed.'));

      Alert.alert(
        'Payment error',
        error.message || 'Payment could not be processed.',
      );
    }
  }, [
    dispatch,
    navigation,
    paymentPayload,
    ride.destination,
    ride.estimatedFare,
    saveTripAfterPayment,
    selectedProvider,
  ]);

  /**
   * Clears the current payment state.
   */
  const handleClearPayment = useCallback(() => {
    dispatch(clearPayment());
    setSelectedProvider('');
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>
          Select a payment provider and confirm your ride payment.
        </Text>
      </View>

      <View style={styles.content}>
        <RideInfoCard
          distanceText={ride.distanceText}
          durationText={ride.durationText}
          vehicleCategoryId={ride.selectedVehicleCategory}
          estimatedFare={ride.estimatedFare}
        />

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to pay</Text>
          <Text style={styles.amountValue}>
            {formatFare(ride.estimatedFare)}
          </Text>

          {user.email ? (
            <Text style={styles.userText}>
              Receipt email: {user.email}
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Payment provider</Text>

        {PAYMENT_PROVIDERS.map((provider) => {
          const isSelected = selectedProvider === provider.id;

          return (
            <Pressable
              key={provider.id}
              style={[
                styles.providerCard,
                isSelected && styles.selectedProviderCard,
              ]}
              onPress={() => handleSelectProvider(provider.id)}
            >
              <View>
                <Text style={styles.providerTitle}>{provider.label}</Text>
                <Text style={styles.providerDescription}>
                  {provider.description}
                </Text>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  isSelected && styles.radioCircleSelected,
                ]}
              >
                {isSelected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}

        {payment.paymentStatus !== 'idle' ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Payment status</Text>
            <Text style={styles.statusValue}>
              {payment.paymentStatus}
            </Text>

            {payment.transactionId ? (
              <Text style={styles.transactionText}>
                Transaction: {payment.transactionId}
              </Text>
            ) : null}

            {payment.error ? (
              <Text style={styles.errorText}>{payment.error}</Text>
            ) : null}
          </View>
        ) : null}

        <AppButton
          title="Confirm payment"
          onPress={handlePay}
          isLoading={payment.isLoading}
          disabled={!selectedProvider || !ride.estimatedFare}
        />

        <AppButton
          title="Clear payment"
          onPress={handleClearPayment}
          variant="secondary"
        />
      </View>

      <LoadingOverlay
        visible={payment.isLoading}
        message="Processing payment..."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  amountCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  amountLabel: {
    color: COLORS.mutedText,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  amountValue: {
    color: COLORS.secondary,
    fontSize: 30,
    fontWeight: '900',
  },
  userText: {
    color: COLORS.mutedText,
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  providerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedProviderCard: {
    borderColor: COLORS.secondary,
    backgroundColor: '#EEF6FF',
  },
  providerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  providerDescription: {
    color: COLORS.mutedText,
    fontSize: 13,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.md,
  },
  radioCircleSelected: {
    borderColor: COLORS.secondary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  statusLabel: {
    color: COLORS.mutedText,
    fontSize: 13,
    marginBottom: SPACING.xs,
  },
  statusValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  transactionText: {
    color: COLORS.mutedText,
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
});

export default PaymentScreen;