// src/screens/PaymentScreen.js

import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
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
  confirmMercadoPagoPayment,
  createMercadoPagoPreference,
  createStripePaymentIntent,
  // TODO (Stripe): import confirmStripePayment when your backend is ready
  // confirmStripePayment,
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

import { addTripToHistory } from '../redux/slices/tripHistorySlice';

// ─── Mercado Pago redirect URLs ────────────────────────────────────────────────
// These must match the "back_urls" you configure in your MP application dashboard
// and in your backend when creating the preference.
// Docs: https://www.mercadopago.com.co/developers/en/docs/checkout-pro/checkout-customization/user-interface/redirection

// Dominio que MP usa como back_url (debe coincidir con server.js)
const MP_REDIRECT_DOMAIN = 'uberclon.app';

/**
 * Payment screen.
 *
 * Lets the user select a payment provider, process the payment,
 * and save the completed trip in Firestore.
 *
 * Supported providers
 *  • Mercado Pago — full Checkout Pro WebView flow integrated.
 *  • Stripe       — placeholder ready; activate following the TODO comments.
 *
 * @param {Object} props
 * @param {Object} props.navigation - React Navigation object.
 */
const PaymentScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const ride    = useSelector((state) => state.ride);
  const payment = useSelector((state) => state.payment);
  const user    = useSelector((state) => state.user);

  const [selectedProvider, setSelectedProvider] = useState(
    payment.paymentProvider || '',
  );

  // Mercado Pago Checkout Pro WebView state
  const [mpCheckoutUrl, setMpCheckoutUrl] = useState(null);
  const [mpWebViewVisible, setMpWebViewVisible] = useState(false);

  // ─── Memoised values ─────────────────────────────────────────────────────

  const paymentDescription = useMemo(() => {
    const destinationName = ride.destination?.name || 'selected destination';
    return `UberClone ride to ${destinationName}`;
  }, [ride.destination]);

  const paymentPayload = useMemo(() => ({
    amount:      ride.estimatedFare,
    currency:    'cop',
    userId:      DEFAULT_USER_ID,
    description: paymentDescription,
  }), [ride.estimatedFare, paymentDescription]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectProvider = useCallback((providerId) => {
    setSelectedProvider(providerId);
    dispatch(setPaymentProvider(providerId));

    const method = providerId === 'stripe'
      ? 'credit_card'
      : 'mercado_pago_wallet';

    dispatch(setSelectedPaymentMethod(method));
  }, [dispatch]);

  /**
   * Saves the completed trip after a successful payment.
   */
  const saveTripAfterPayment = useCallback(async (transactionData) => {
    const completedTrip = await saveCompletedTrip({
      userId:          DEFAULT_USER_ID,
      origin:          ride.origin,
      destination:     ride.destination,
      vehicleCategory: ride.selectedVehicleCategory,
      fare:            ride.estimatedFare,
      distanceText:    ride.distanceText,
      durationText:    ride.durationText,
      paymentProvider: selectedProvider,
      transactionId:   transactionData.transactionId,
    });

    dispatch(addTripToHistory(completedTrip));
    return completedTrip;
  }, [
    dispatch,
    ride.origin, ride.destination, ride.selectedVehicleCategory,
    ride.estimatedFare, ride.distanceText, ride.durationText,
    selectedProvider,
  ]);

  /**
   * Called after every successful payment (any provider).
   */
  const handlePaymentSuccess = useCallback(async (transactionData) => {
    dispatch(paymentSuccess(transactionData));
    await saveTripAfterPayment(transactionData);

    Alert.alert(
      'Payment successful',
      'Your trip was paid and saved successfully.',
      [{
        text: 'View history',
        onPress: () => navigation.navigate('MainTabs', { screen: 'TripHistory' }),
      }],
    );
  }, [dispatch, navigation, saveTripAfterPayment]);

  // ─── Mercado Pago flow ────────────────────────────────────────────────────

  /**
   * Initiates the Mercado Pago Checkout Pro flow.
   *
   * 1. Creates a preference on the backend  → gets `initPoint` URL.
   * 2. Opens a WebView pointing at `initPoint`.
   * 3. The WebView intercepts the success / failure redirect and closes itself.
   */
  const handleMercadoPago = useCallback(async () => {
    try {
      dispatch(startPayment());

      const preferenceResponse = await createMercadoPagoPreference(paymentPayload);

      /**
       * Mock mode returns a simulated `id` but no real `initPoint`.
       * We fall back to a demo transaction so the UI flow can be tested
       * without a real backend.
       *
       * In production `preferenceResponse.initPoint` will be a real MP URL.
       */
      const isMockResponse = !preferenceResponse.initPoint;

      if (isMockResponse) {
        // Skip WebView in mock mode — go straight to success.
        const transactionData = {
          transactionId: preferenceResponse.transactionId || preferenceResponse.id,
        };
        await handlePaymentSuccess(transactionData);
        return;
      }

      // Real mode: open Checkout Pro in a WebView.
      setMpCheckoutUrl(preferenceResponse.initPoint);
      setMpWebViewVisible(true);
    } catch (error) {
      dispatch(paymentFailure(error.message || 'Payment failed.'));
      Alert.alert('Payment error', error.message || 'Payment could not be processed.');
    }
  }, [dispatch, paymentPayload, handlePaymentSuccess]);

  /**
   * Handles URL changes inside the Mercado Pago WebView.
   *
   * MP redirects the user to one of the `back_urls` configured in the preference.
   * We intercept those redirects here to close the WebView and react accordingly.
   *
   * URL params injected by MP:
   *   ?collection_id=...&collection_status=approved&payment_id=...&preference_id=...
   *
   * Docs: https://www.mercadopago.com.co/developers/en/docs/checkout-pro/integration-configuration/configure-back-urls
   */
  /**
   * Extrae y procesa el resultado del pago desde la URL de redirección de MP.
   *
   * MP inyecta siempre estos query params en la back_url:
   *   ?collection_id=...&collection_status=approved|rejected|pending
   *   &payment_id=...&preference_id=...
   *
   * La detección se basa en esos params, no en el dominio exacto,
   * porque el WebView puede recibir la URL antes de navegar a ella.
   *
   * @param {string} url - URL completa de la redirección.
   * @returns {boolean} true si la URL es una redirección de MP y fue procesada.
   */
  const processMpRedirectUrl = useCallback(async (url) => {
    if (!url) return false;

    // Solo interceptar si es la back_url de uberclon.app
    if (!url.includes(MP_REDIRECT_DOMAIN)) return false;

    // Cerrar el WebView inmediatamente
    setMpWebViewVisible(false);
    setMpCheckoutUrl(null);

    try {
      const parsedUrl  = new URL(url);
      const collStatus = parsedUrl.searchParams.get('collection_status');
      const paymentId  = parsedUrl.searchParams.get('payment_id');

      console.log('MP redirect — status:', collStatus, 'paymentId:', paymentId);

      if (collStatus === 'rejected' || collStatus === 'cancelled') {
        dispatch(paymentFailure('El pago fue rechazado por Mercado Pago.'));
        Alert.alert('Pago rechazado', 'El pago no fue aprobado. Intenta de nuevo.');
        return true;
      }

      if (collStatus === 'pending' || collStatus === 'in_process') {
        Alert.alert(
          'Pago pendiente',
          'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
        );
        return true;
      }

      if (collStatus !== 'approved' || !paymentId) {
        throw new Error('El pago no fue aprobado.');
      }

      // Confirmar con el backend
      const confirmation = await confirmMercadoPagoPayment({
        paymentId,
        userId: DEFAULT_USER_ID,
      });

      const transactionData = {
        transactionId: confirmation.paymentId || paymentId,
      };

      await handlePaymentSuccess(transactionData);
    } catch (error) {
      dispatch(paymentFailure(error.message || 'Error al confirmar el pago.'));
      Alert.alert('Error de confirmación', error.message || 'No se pudo confirmar el pago.');
    }

    return true;
  }, [dispatch, handlePaymentSuccess]);

  /**
   * onNavigationStateChange — disparado cuando el WebView navega a una nueva URL.
   * Actúa como respaldo por si onShouldStartLoadWithRequest no intercepta.
   */
  const handleMpNavigationChange = useCallback(async (navState) => {
    await processMpRedirectUrl(navState.url);
  }, [processMpRedirectUrl]);

  const handleCloseMpWebView = useCallback(() => {
    setMpWebViewVisible(false);
    setMpCheckoutUrl(null);
    dispatch(clearPayment());
  }, [dispatch]);

  // ─── Stripe flow ──────────────────────────────────────────────────────────

  /**
   * TODO (Stripe): Implement the Stripe payment flow.
   *
   * Steps:
   *  1. Call `createStripePaymentIntent(paymentPayload)` to get `clientSecret`.
   *  2. Use the Stripe React Native SDK to confirm the payment on-device:
   *
   *     import { useStripe } from '@stripe/stripe-react-native';
   *     const { confirmPayment } = useStripe();
   *
   *     const { error, paymentIntent } = await confirmPayment(clientSecret, {
   *       paymentMethodType: 'Card',
   *       paymentMethodData: { billingDetails },
   *     });
   *
   *  3. On success call `handlePaymentSuccess({ transactionId: paymentIntent.id })`.
   *
   * Prerequisites:
   *   npm install @stripe/stripe-react-native
   *   Wrap app root in <StripeProvider publishableKey="pk_test_…">
   *   Fill in STRIPE_PUBLISHABLE_KEY in paymentService.js
   *   Deploy backend endpoint POST /api/payments/stripe/intent
   *
   * Docs: https://stripe.com/docs/payments/accept-a-payment?platform=react-native
   */
  const handleStripe = useCallback(async () => {
    try {
      dispatch(startPayment());

      const intentResponse = await createStripePaymentIntent(paymentPayload);

      /**
       * Mock mode: no real clientSecret — fall back to demo transaction.
       * In production replace this block with the real Stripe SDK confirm call.
       */
      const isMockResponse = !intentResponse.clientSecret;

      if (isMockResponse) {
        const transactionData = {
          transactionId: intentResponse.transactionId || intentResponse.id,
        };
        await handlePaymentSuccess(transactionData);
        return;
      }

      // TODO: replace this comment with the real Stripe SDK confirm call.
      // const { error, paymentIntent } = await confirmPayment(intentResponse.clientSecret, { … });
      // if (error) throw new Error(error.message);
      // await handlePaymentSuccess({ transactionId: paymentIntent.id });

      throw new Error('Stripe SDK confirm not yet implemented. See TODO in PaymentScreen.');
    } catch (error) {
      dispatch(paymentFailure(error.message || 'Stripe payment failed.'));
      Alert.alert('Payment error', error.message || 'Payment could not be processed.');
    }
  }, [dispatch, paymentPayload, handlePaymentSuccess]);

  // ─── Pay button dispatcher ────────────────────────────────────────────────

  const handlePay = useCallback(async () => {
    if (!ride.destination || !ride.estimatedFare) {
      Alert.alert('Payment unavailable', 'Ride destination and fare are required.');
      return;
    }
    if (!selectedProvider) {
      Alert.alert('Provider required', 'Please select Stripe or Mercado Pago.');
      return;
    }

    if (selectedProvider === 'mercado_pago') {
      await handleMercadoPago();
      return;
    }

    if (selectedProvider === 'stripe') {
      await handleStripe();
    }
  }, [ride.destination, ride.estimatedFare, selectedProvider, handleMercadoPago, handleStripe]);

  const handleClearPayment = useCallback(() => {
    dispatch(clearPayment());
    setSelectedProvider('');
  }, [dispatch]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen}>

      {/* ── Mercado Pago Checkout Pro WebView ── */}
      <Modal
        visible={mpWebViewVisible}
        animationType="slide"
        onRequestClose={handleCloseMpWebView}
      >
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>Mercado Pago</Text>
            <TouchableOpacity onPress={handleCloseMpWebView}>
              <Text style={styles.webViewClose}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>

          {mpCheckoutUrl ? (
            <WebView
              source={{ uri: mpCheckoutUrl }}
              onShouldStartLoadWithRequest={(request) => {
                // Interceptar ANTES de navegar para evitar que Android
                // rechace la URL por dominio desconocido
                if (request.url.includes(MP_REDIRECT_DOMAIN)) {
                  processMpRedirectUrl(request.url);
                  return false; // Bloquea la navegación en el WebView
                }
                return true;
              }}
              onNavigationStateChange={handleMpNavigationChange}
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="compatibility"
            />
          ) : null}
        </SafeAreaView>
      </Modal>

      {/* ── Screen content ── */}
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
            <Text style={styles.userText}>Receipt email: {user.email}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Payment provider</Text>

        {PAYMENT_PROVIDERS.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          return (
            <Pressable
              key={provider.id}
              style={[styles.providerCard, isSelected && styles.selectedProviderCard]}
              onPress={() => handleSelectProvider(provider.id)}
            >
              <View>
                <Text style={styles.providerTitle}>{provider.label}</Text>
                <Text style={styles.providerDescription}>
                  {provider.description}
                </Text>
              </View>

              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                {isSelected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}

        {payment.paymentStatus !== 'idle' ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Payment status</Text>
            <Text style={styles.statusValue}>{payment.paymentStatus}</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // WebView modal
  webViewContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webViewHeader: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  webViewTitle: {
    color:      COLORS.text,
    fontSize:   18,
    fontWeight: '800',
  },
  webViewClose: {
    color:      COLORS.error,
    fontSize:   15,
    fontWeight: '600',
  },
  // Screen layout
  header: {
    padding:       SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    color:        COLORS.text,
    fontSize:     28,
    fontWeight:   '900',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color:    COLORS.mutedText,
    fontSize: 15,
  },
  content: {
    flex:             1,
    paddingHorizontal: SPACING.lg,
  },
  amountCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.lg,
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginBottom:    SPACING.lg,
  },
  amountLabel: {
    color:        COLORS.mutedText,
    fontSize:     14,
    marginBottom: SPACING.xs,
  },
  amountValue: {
    color:      COLORS.secondary,
    fontSize:   30,
    fontWeight: '900',
  },
  userText: {
    color:     COLORS.mutedText,
    fontSize:  13,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    color:        COLORS.text,
    fontSize:     18,
    fontWeight:   '800',
    marginBottom: SPACING.md,
  },
  providerCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.lg,
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginBottom:    SPACING.md,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
  },
  selectedProviderCard: {
    borderColor:     COLORS.secondary,
    backgroundColor: '#EEF6FF',
  },
  providerTitle: {
    color:        COLORS.text,
    fontSize:     16,
    fontWeight:   '800',
    marginBottom: SPACING.xs,
  },
  providerDescription: {
    color:    COLORS.mutedText,
    fontSize: 13,
  },
  radioCircle: {
    width:          24,
    height:         24,
    borderRadius:   12,
    borderWidth:    2,
    borderColor:    COLORS.border,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     SPACING.md,
  },
  radioCircleSelected: {
    borderColor: COLORS.secondary,
  },
  radioDot: {
    width:           12,
    height:          12,
    borderRadius:    6,
    backgroundColor: COLORS.secondary,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.lg,
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginVertical:  SPACING.md,
  },
  statusLabel: {
    color:        COLORS.mutedText,
    fontSize:     13,
    marginBottom: SPACING.xs,
  },
  statusValue: {
    color:         COLORS.text,
    fontSize:      18,
    fontWeight:    '800',
    textTransform: 'capitalize',
  },
  transactionText: {
    color:     COLORS.mutedText,
    fontSize:  13,
    marginTop: SPACING.sm,
  },
  errorText: {
    color:      COLORS.error,
    fontSize:   13,
    fontWeight: '600',
    marginTop:  SPACING.sm,
  },
});

export default PaymentScreen;