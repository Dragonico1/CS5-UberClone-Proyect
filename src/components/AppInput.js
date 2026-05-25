import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS, RADIUS, SPACING } from '../utils/constants';

/**
 * Reusable text input component.
 *
 * This component is used for profile fields and other text-based forms.
 *
 * @param {Object} props - Component props.
 * @param {string} props.label - Input label.
 * @param {string} props.value - Current input value.
 * @param {Function} props.onChangeText - Function executed when text changes.
 * @param {string} props.placeholder - Input placeholder.
 * @param {string} props.error - Validation error message.
 * @param {string} props.keyboardType - Keyboard type.
 * @param {number} props.maxLength - Maximum allowed characters.
 * @param {boolean} props.secureTextEntry - Hides text when true.
 * @returns {React.ReactElement} Reusable input.
 */
const AppInput = ({
  label,
  value,
  onChangeText,
  placeholder = '',
  error = '',
  keyboardType = 'default',
  maxLength,
  secureTextEntry = false,
}) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.mutedText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    minHeight: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
    fontSize: 15,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});

export default AppInput;