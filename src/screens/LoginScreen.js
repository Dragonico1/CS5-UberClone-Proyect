// src/screens/LoginScreen.js

import React, { useState, useCallback } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';

import { COLORS, RADIUS, SPACING } from '../utils/constants';

import { getUserByPhone } from '../services/userService';

import { loginSuccess, authStart, authFailure } from '../redux/slices/authSlice';
import { setUserProfile } from '../redux/slices/userSlice';

/**
 * Login screen.
 *
 * The user enters the phone number they registered with.
 * If found in Firestore, their full profile is loaded into Redux
 * and the app switches to the main navigator automatically via
 * the isAuthenticated flag in authSlice.
 *
 * @param {Object} props
 * @param {Object} props.navigation - React Navigation object.
 */
const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Accepts only digits.
   */
  const handlePhoneChange = useCallback((value) => {
    setPhoneNumber(value.replace(/[^0-9]/g, ''));
    setPhoneError('');
  }, []);

  /**
   * Looks up the phone number in Firestore.
   * On success: loads the profile into Redux and marks the user as authenticated.
   * On failure: shows a clear error message.
   */
  const handleLogin = useCallback(async () => {
    if (!phoneNumber || phoneNumber.trim().length < 7) {
      setPhoneError('Ingresa un número de teléfono válido.');
      return;
    }

    try {
      setIsLoading(true);
      dispatch(authStart());

      const userProfile = await getUserByPhone(phoneNumber.trim());

      if (!userProfile) {
        dispatch(authFailure('Usuario no encontrado.'));
        setPhoneError('No encontramos una cuenta con este número. ¿Quieres registrarte?');
        setIsLoading(false);
        return;
      }

      // Load full profile into user slice
      dispatch(setUserProfile({
        profileImage: userProfile.profileImage || null,
        fullName:     userProfile.fullName     || '',
        phoneNumber:  userProfile.phoneNumber  || '',
        gender:       userProfile.gender       || '',
        email:        userProfile.email        || '',
        language:     userProfile.language     || 'es',
      }));

      // Mark session as active — AppNavigator will switch to MainTabs
      dispatch(loginSuccess({ userId: userProfile.id }));

    } catch (error) {
      dispatch(authFailure(error.message));
      Alert.alert('Error al iniciar sesión', error.message || 'Intenta de nuevo.');
      setIsLoading(false);
    }
  }, [dispatch, phoneNumber]);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.emoji}>📱</Text>
            <Text style={styles.title}>Ingresar</Text>
            <Text style={styles.subtitle}>
              Ingresa el número de teléfono con el que te registraste.
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            <AppInput
              label="Número de teléfono"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              placeholder="Ej: 3001234567"
              keyboardType="numeric"
              error={phoneError}
            />

            <AppButton
              title="Ingresar"
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={!phoneNumber}
            />

            <AppButton
              title="Crear cuenta nueva"
              onPress={() => navigation.navigate('Register')}
              variant="secondary"
            />
          </View>

          {/* ── Info card ── */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              🔒 Solo necesitas tu número de teléfono. No usamos contraseñas.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emoji: {
    fontSize: 52,
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginTop: SPACING.lg,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xl,
  },
  infoText: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default LoginScreen;