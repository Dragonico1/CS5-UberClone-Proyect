// src/screens/PaymentScreen.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
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
  PAYMENT_PROVIDERS,
  RADIUS,
  SPACING,
} from '../utils/constants';

import { formatFare } from '../utils/fareCalculator';

import {
  confirmMercadoPagoPayment,
  createMercadoPagoPreference,
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

import { clearRide } from '../redux/slices/rideSlice';
import { addTripToHistory } from '../redux/slices/tripHistorySlice';

import { MP_REDIRECT_DOMAIN } from '@env';


const PaymentScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const ride    = useSelector((state) => state.ride);
  const payment = useSelector((state) => state.payment);
  const user    = useSelector((state) => state.user);
  const auth    = useSelector((state) => state.auth);
  const userId  = auth?.userId;

  const [selectedProvider, setSelectedProvider] = useState('');
  const [mpCheckoutUrl,    setMpCheckoutUrl]    = useState(null);
  const [mpWebViewVisible, setMpWebViewVisible] = useState(false);

  /**
   * Al montar la pantalla siempre limpiamos el estado de pago anterior
   * para que no queden residuos de una transacción previa.
   */
  useEffect(() => {
    dispatch(clearPayment());
    setSelectedProvider('');
  }, [dispatch]);

  // ─── Memoised values ───────────────────────────────────────────────────────

  const paymentDescription = useMemo(() => {
    const destinationName = ride.destination?.name || 'selected destination';
    return `UberClone ride to ${destinationName}`;
  }, [ride.destination]);

  const paymentPayload = useMemo(() => ({
    amount:      ride.estimatedFare,
    currency:    'cop',
    userId,
    description: paymentDescription,
  }), [ride.estimatedFare, paymentDescription, userId]);

  // ─── Reset completo tras pago exitoso ──────────────────────────────────────

  const handlePaymentSuccess = useCallback(async (transactionData) => {
    dispatch(paymentSuccess(transactionData));

    const completedTrip = await saveCompletedTrip({
      userId,
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

    dispatch(clearRide());
    dispatch(clearPayment());
    setSelectedProvider('');

    Alert.alert(
      'Pago exitoso',
      'Tu viaje fue pagado y guardado correctamente.',
      [{
        text: 'Ver historial',
        onPress: () => navigation.navigate('MainTabs', { screen: 'TripHistory' }),
      }],
    );
  }, [
    dispatch, navigation, userId, selectedProvider,
    ride.origin, ride.destination, ride.selectedVehicleCategory,
    ride.estimatedFare, ride.distanceText, ride.durationText,
  ]);

  // ─── Reset tras error ──────────────────────────────────────────────────────

  const handlePaymentError = useCallback((errorMessage) => {
    dispatch(paymentFailure(errorMessage));
    Alert.alert('Error de pago', errorMessage || 'No se pudo procesar el pago.');
  }, [dispatch]);

  // ─── Provider selection ────────────────────────────────────────────────────

  const handleSelectProvider = useCallback((providerId) => {
    setSelectedProvider(providerId);
    dispatch(setPaymentProvider(providerId));
    dispatch(setSelectedPaymentMethod('mercado_pago_wallet'));
  }, [dispatch]);

  // ─── Mercado Pago ───────────────────────────────────────────────────────────

  const processMpRedirectUrl = useCallback(async (url) => {
    if (!url || !url.includes(MP_REDIRECT_DOMAIN)) return false;

    setMpWebViewVisible(false);
    setMpCheckoutUrl(null);

    try {
      const parsedUrl  = new URL(url);
      const collStatus = parsedUrl.searchParams.get('collection_status');
      const paymentId  = parsedUrl.searchParams.get('payment_id');

      if (collStatus === 'rejected' || collStatus === 'cancelled') {
        handlePaymentError('El pago fue rechazado o cancelado. Intenta de nuevo.');
        return true;
      }

      if (collStatus === 'pending' || collStatus === 'in_process') {
        Alert.alert('Pago pendiente', 'Tu pago está siendo procesado.');
        return true;
      }

      if (collStatus !== 'approved' || !paymentId) {
        throw new Error('El pago no fue aprobado.');
      }

      const confirmation = await confirmMercadoPagoPayment({ paymentId, userId });

      await handlePaymentSuccess({
        transactionId: confirmation.paymentId || paymentId,
      });
    } catch (error) {
      handlePaymentError(error.message || 'Error al confirmar el pago.');
    }

    return true;
  }, [handlePaymentError, handlePaymentSuccess, userId]);

  const handleMpNavigationChange = useCallback(async (navState) => {
    await processMpRedirectUrl(navState.url);
  }, [processMpRedirectUrl]);

  const handleMercadoPago = useCallback(async () => {
    try {
      dispatch(startPayment());

      const preferenceResponse = await createMercadoPagoPreference(paymentPayload);

      if (!preferenceResponse.initPoint) {
        await handlePaymentSuccess({
          transactionId: preferenceResponse.transactionId || preferenceResponse.id,
        });
        return;
      }

      setMpCheckoutUrl(preferenceResponse.initPoint);
      setMpWebViewVisible(true);
    } catch (error) {
      handlePaymentError(error.message || 'No se pudo procesar el pago.');
    }
  }, [dispatch, paymentPayload, handlePaymentSuccess, handlePaymentError]);

  const handleCloseMpWebView = useCallback(() => {
    setMpWebViewVisible(false);
    setMpCheckoutUrl(null);
    dispatch(clearPayment());
  }, [dispatch]);

  // ─── Pay dispatcher ────────────────────────────────────────────────────────

  const handlePay = useCallback(async () => {
    if (!ride.destination || !ride.estimatedFare) {
      Alert.alert('Pago no disponible', 'Se requiere destino y tarifa estimada.');
      return;
    }
    if (!selectedProvider) {
      Alert.alert('Selecciona un método', 'Por favor selecciona Mercado Pago.');
      return;
    }

    await handleMercadoPago();
  }, [
    ride.destination, ride.estimatedFare, selectedProvider,
    handleMercadoPago,
  ]);

  const handleClearPayment = useCallback(() => {
    dispatch(clearPayment());
    setSelectedProvider('');
  }, [dispatch]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen}>

      {/* ── Mercado Pago WebView modal ── */}
      <Modal
        visible={mpWebViewVisible}
        animationType="slide"
        onRequestClose={handleCloseMpWebView}
      >
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>Mercado Pago</Text>
            <TouchableOpacity onPress={handleCloseMpWebView}>
              <Text style={styles.webViewClose}>✕ Cancelar</Text>
            </TouchableOpacity>
          </View>

          {mpCheckoutUrl ? (
            <WebView
              source={{ uri: mpCheckoutUrl }}
              onShouldStartLoadWithRequest={(request) => {
                if (request.url.includes(MP_REDIRECT_DOMAIN)) {
                  processMpRedirectUrl(request.url);
                  return false;
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

      {/* ── Contenido principal ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Pago</Text>
        <Text style={styles.subtitle}>
          Selecciona un método de pago y confirma tu viaje.
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <RideInfoCard
          distanceText={ride.distanceText}
          durationText={ride.durationText}
          vehicleCategoryId={ride.selectedVehicleCategory}
          estimatedFare={ride.estimatedFare}
        />

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total a pagar</Text>
          <Text style={styles.amountValue}>
            {formatFare(ride.estimatedFare)}
          </Text>
          {user.email ? (
            <Text style={styles.userText}>Recibo: {user.email}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Método de pago</Text>

        {PAYMENT_PROVIDERS.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          return (
            <Pressable
              key={provider.id}
              style={[styles.providerCard, isSelected && styles.selectedProviderCard]}
              onPress={() => handleSelectProvider(provider.id)}
            >
              <View style={styles.providerInfo}>
                <Text style={styles.providerTitle}>{provider.label}</Text>
                <Text style={styles.providerDescription}>{provider.description}</Text>
              </View>
              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                {isSelected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}

        {payment.paymentStatus !== 'idle' ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Estado del pago</Text>
            <Text style={[
              styles.statusValue,
              payment.paymentStatus === 'success' && styles.statusSuccess,
              payment.paymentStatus === 'failed'  && styles.statusFailed,
            ]}>
              {payment.paymentStatus}
            </Text>
            {payment.transactionId ? (
              <Text style={styles.transactionText}>
                Transacción: {payment.transactionId}
              </Text>
            ) : null}
            {payment.error ? (
              <Text style={styles.errorText}>{payment.error}</Text>
            ) : null}
          </View>
        ) : null}

        <AppButton
          title="Confirmar pago"
          onPress={handlePay}
          isLoading={payment.isLoading}
          disabled={!selectedProvider || !ride.estimatedFare || payment.isLoading}
        />

        <AppButton
          title="Limpiar selección"
          onPress={handleClearPayment}
          variant="secondary"
        />
      </ScrollView>

      <LoadingOverlay
        visible={payment.isLoading}
        message="Procesando pago..."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen:               { flex: 1, backgroundColor: COLORS.background },
  webViewContainer:     { flex: 1, backgroundColor: COLORS.background },
  webViewHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  webViewTitle:         { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  webViewClose:         { color: COLORS.error, fontSize: 15, fontWeight: '600' },
  header:               { padding: SPACING.lg, paddingBottom: SPACING.md },
  title:                { color: COLORS.text, fontSize: 28, fontWeight: '900', marginBottom: SPACING.xs },
  subtitle:             { color: COLORS.mutedText, fontSize: 15 },
  content:              { flex: 1 },
  contentContainer:     { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  amountCard:           { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  amountLabel:          { color: COLORS.mutedText, fontSize: 14, marginBottom: SPACING.xs },
  amountValue:          { color: COLORS.secondary, fontSize: 30, fontWeight: '900' },
  userText:             { color: COLORS.mutedText, fontSize: 13, marginTop: SPACING.sm },
  sectionTitle:         { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: SPACING.md },
  providerCard:         { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedProviderCard: { borderColor: COLORS.secondary, backgroundColor: '#EEF6FF' },
  providerInfo:         { flex: 1 },
  providerTitle:        { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: SPACING.xs },
  providerDescription:  { color: COLORS.mutedText, fontSize: 13 },
  radioCircle:          { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.md },
  radioCircleSelected:  { borderColor: COLORS.secondary },
  radioDot:             { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.secondary },
  statusCard:           { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginVertical: SPACING.md },
  statusLabel:          { color: COLORS.mutedText, fontSize: 13, marginBottom: SPACING.xs },
  statusValue:          { color: COLORS.text, fontSize: 18, fontWeight: '800', textTransform: 'capitalize' },
  statusSuccess:        { color: COLORS.success },
  statusFailed:         { color: COLORS.error },
  transactionText:      { color: COLORS.mutedText, fontSize: 13, marginTop: SPACING.sm },
  errorText:            { color: COLORS.error, fontSize: 13, fontWeight: '600', marginTop: SPACING.sm },
});

export default PaymentScreen;