import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { COLORS, RADIUS, SPACING } from '../utils/constants';

/**
 * Reusable button component.
 *
 * This component is used across the app for main actions.
 *
 * @param {Object} props - Component props.
 * @param {string} props.title - Button text.
 * @param {Function} props.onPress - Function executed when the button is pressed.
 * @param {boolean} props.isLoading - Shows a loading indicator when true.
 * @param {boolean} props.disabled - Disables the button when true.
 * @param {string} props.variant - Button style variant: "primary", "secondary", "danger".
 * @returns {React.ReactElement} Reusable button.
 */
const AppButton = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
}) => {
  const isButtonDisabled = disabled || isLoading;

  const buttonStyle = [
    styles.button,
    styles[variant],
    isButtonDisabled && styles.disabledButton,
  ];

  const textStyle = [
    styles.buttonText,
    variant === 'secondary' && styles.secondaryText,
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyle,
        pressed && !isButtonDisabled && styles.pressedButton,
      ]}
      onPress={onPress}
      disabled={isButtonDisabled}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'secondary' ? COLORS.secondary : COLORS.surface} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  danger: {
    backgroundColor: COLORS.error,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressedButton: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryText: {
    color: COLORS.secondary,
  },
});

export default AppButton;