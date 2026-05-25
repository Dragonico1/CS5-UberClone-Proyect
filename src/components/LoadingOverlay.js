// src/components/LoadingOverlay.js

import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS, RADIUS, SPACING } from '../utils/constants';

/**
 * Reusable loading overlay component.
 *
 * This component displays a modal loading state over the current screen.
 *
 * @param {Object} props - Component props.
 * @param {boolean} props.visible - Controls whether the overlay is visible.
 * @param {string} props.message - Loading message.
 * @returns {React.ReactElement} Loading overlay.
 */
const LoadingOverlay = ({
  visible = false,
  message = 'Loading...',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});

export default LoadingOverlay;