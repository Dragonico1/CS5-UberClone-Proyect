// src/screens/AuthScreen.js

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import { COLORS, RADIUS, SPACING } from '../utils/constants';

/**
 * Auth screen — the first screen the user sees.
 *
 * Shows two options:
 *  • Register  → goes to RegisterProfileScreen (creates a new account)
 *  • Log in    → goes to LoginScreen (returns with phone number)
 *
 * @param {Object} props
 * @param {Object} props.navigation - React Navigation object.
 */
const AuthScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Hero section ── */}
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🚗</Text>
        </View>

        <Text style={styles.appName}>UberClone</Text>
        <Text style={styles.tagline}>
          Tu viaje, a un toque de distancia.
        </Text>
      </View>

      {/* ── Auth buttons ── */}
      <View style={styles.actions}>
        <Text style={styles.welcomeText}>¿Cómo quieres continuar?</Text>

        <AppButton
          title="Crear cuenta"
          onPress={() => navigation.navigate('Register')}
        />

        <AppButton
          title="Ya tengo cuenta"
          onPress={() => navigation.navigate('Login')}
          variant="secondary"
        />
      </View>

      <Text style={styles.footer}>
        Al continuar aceptas nuestros términos y condiciones.
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 52,
  },
  appName: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '900',
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  tagline: {
    color: COLORS.mutedText,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    paddingBottom: SPACING.xl,
  },
  welcomeText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  footer: {
    color: COLORS.mutedText,
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: SPACING.lg,
  },
});

export default AuthScreen;