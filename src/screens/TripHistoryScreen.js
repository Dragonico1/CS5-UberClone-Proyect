// src/screens/TripHistoryScreen.js

import React, {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import AppButton     from '../components/AppButton';
import LoadingOverlay from '../components/LoadingOverlay';

import {
  COLORS,
  RADIUS,
  SPACING,
} from '../utils/constants';

import { formatFare, getVehicleCategoryById } from '../utils/fareCalculator';

import { getTripsByUser } from '../services/tripService';

import {
  fetchTripsFailure,
  fetchTripsStart,
  fetchTripsSuccess,
  setSelectedTrip,
} from '../redux/slices/tripHistorySlice';

import { clearRide } from '../redux/slices/rideSlice';
import { clearPayment } from '../redux/slices/paymentSlice';

/**
 * Trip history screen.
 *
 * Loads trips from Firestore using the authenticated userId from authSlice.
 */
const TripHistoryScreen = () => {
  const dispatch = useDispatch();

  // Read the real userId from auth slice — no more hardcoded ID
  const userId = useSelector((state) => state.auth.userId);

  const {
    trips,
    selectedTrip,
    isLoading,
    error,
  } = useSelector((state) => state.tripHistory);

  const totalSpent = useMemo(
    () => trips.reduce((sum, trip) => sum + Number(trip.fare || 0), 0),
    [trips],
  );

  /**
   * Al entrar al historial el viaje ya fue completado y pagado,
   * así que limpiamos ride y payment para que la próxima solicitud
   * empiece desde cero.
   */
  useEffect(() => {
    dispatch(clearRide());
    dispatch(clearPayment());
  }, [dispatch]);

  const loadTripHistory = useCallback(async () => {
    if (!userId) return;

    try {
      dispatch(fetchTripsStart());
      const userTrips = await getTripsByUser(userId);
      dispatch(fetchTripsSuccess(userTrips));
    } catch (err) {
      dispatch(fetchTripsFailure(err.message || 'Error cargando historial.'));
    }
  }, [dispatch, userId]);

  useEffect(() => { loadTripHistory(); }, [loadTripHistory]);

  useEffect(() => {
    if (error) Alert.alert('Error en historial', error);
  }, [error]);

  const handleSelectTrip = useCallback((trip) => {
    dispatch(setSelectedTrip(trip));
    Alert.alert(
      'Detalles del viaje',
      `Destino: ${trip.destination?.name || 'N/A'}\nTarifa: ${formatFare(trip.fare)}\nDistancia: ${trip.distanceText || 'N/A'}\nDuración: ${trip.durationText || 'N/A'}`,
    );
  }, [dispatch]);

  const formatTripDate = (dateValue) => {
    if (!dateValue) return 'Fecha no disponible';
    return new Date(dateValue).toLocaleString('es-CO', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const renderTripItem = ({ item }) => {
    const vehicleCategory = getVehicleCategoryById(item.vehicleCategory);
    const isSelected = selectedTrip?.id === item.id;

    return (
      <View style={[styles.tripCard, isSelected && styles.selectedTripCard]}>
        <Text style={styles.tripDestination}>
          {item.destination?.name || 'Destino desconocido'}
        </Text>
        <Text style={styles.tripAddress}>
          {item.destination?.address || 'Dirección no disponible'}
        </Text>

        <View style={styles.tripInfoGrid}>
          {[
            { label: 'Costo',     value: formatFare(item.fare) },
            { label: 'Fecha',     value: formatTripDate(item.createdAt) },
            { label: 'Distancia', value: item.distanceText || 'N/A' },
            { label: 'Duración',  value: item.durationText || 'N/A' },
            { label: 'Vehículo',  value: vehicleCategory.label },
            { label: 'Pago',      value: item.paymentProvider || 'N/A' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.tripInfoItem}>
              <Text style={styles.tripInfoLabel}>{label}</Text>
              <Text style={styles.tripInfoValue}>{value}</Text>
            </View>
          ))}
        </View>

        <AppButton
          title="Ver detalles"
          onPress={() => handleSelectTrip(item)}
          variant="secondary"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Tus viajes completados.</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total viajes</Text>
          <Text style={styles.summaryValue}>{trips.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total gastado</Text>
          <Text style={styles.summaryValue}>{formatFare(totalSpent)}</Text>
        </View>
      </View>

      {trips.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sin viajes</Text>
          <Text style={styles.emptyText}>
            Los viajes completados aparecerán aquí después del pago.
          </Text>
          <AppButton
            title="Recargar historial"
            onPress={loadTripHistory}
            variant="secondary"
          />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadTripHistory} />
          }
        />
      )}

      <LoadingOverlay visible={isLoading} message="Cargando historial..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen:            { flex: 1, backgroundColor: COLORS.background },
  header:            { padding: SPACING.lg, paddingBottom: SPACING.md },
  title:             { color: COLORS.text, fontSize: 28, fontWeight: '900', marginBottom: SPACING.xs },
  subtitle:          { color: COLORS.mutedText, fontSize: 15 },
  summaryContainer:  { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  summaryCard:       { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm },
  summaryLabel:      { color: COLORS.mutedText, fontSize: 13, marginBottom: SPACING.xs },
  summaryValue:      { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  listContent:       { padding: SPACING.lg, paddingTop: 0, paddingBottom: SPACING.xxl },
  tripCard:          { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  selectedTripCard:  { borderColor: COLORS.secondary, backgroundColor: '#EEF6FF' },
  tripDestination:   { color: COLORS.text, fontSize: 18, fontWeight: '900', marginBottom: SPACING.xs },
  tripAddress:       { color: COLORS.mutedText, fontSize: 13, marginBottom: SPACING.md },
  tripInfoGrid:      { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.md },
  tripInfoItem:      { width: '50%', marginBottom: SPACING.md },
  tripInfoLabel:     { color: COLORS.mutedText, fontSize: 12, marginBottom: 2 },
  tripInfoValue:     { color: COLORS.text, fontSize: 14, fontWeight: '700', paddingRight: SPACING.sm },
  emptyContainer:    { flex: 1, padding: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:        { color: COLORS.text, fontSize: 22, fontWeight: '900', marginBottom: SPACING.sm },
  emptyText:         { color: COLORS.mutedText, fontSize: 15, textAlign: 'center', marginBottom: SPACING.lg },
});

export default TripHistoryScreen;