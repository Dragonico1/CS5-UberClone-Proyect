// src/components/Dropdown.js

import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS, RADIUS, SPACING } from '../utils/constants';

/**
 * Reusable dropdown component.
 *
 * This component allows the user to select one option from a list.
 *
 * @param {Object} props - Component props.
 * @param {string} props.label - Dropdown label.
 * @param {string} props.value - Selected value.
 * @param {Array} props.options - Available options.
 * @param {Function} props.onSelect - Function executed when an option is selected.
 * @param {string} props.placeholder - Placeholder text.
 * @param {string} props.error - Validation error message.
 * @returns {React.ReactElement} Reusable dropdown.
 */
const Dropdown = ({
  label,
  value,
  options = [],
  onSelect,
  placeholder = 'Select an option',
  error = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  /**
   * Handles selecting one dropdown option.
   *
   * @param {Object} option - Selected option object.
   */
  const handleSelectOption = (option) => {
    onSelect(option.value);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        style={[
          styles.dropdownButton,
          error ? styles.dropdownButtonError : null,
        ]}
        onPress={() => setIsOpen((previousValue) => !previousValue)}
      >
        <Text
          style={[
            styles.dropdownText,
            !selectedOption && styles.placeholderText,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>

        <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.optionsContainer}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                style={styles.optionItem}
                onPress={() => handleSelectOption(item)}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    zIndex: 10,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  dropdownButton: {
    minHeight: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonError: {
    borderColor: COLORS.error,
  },
  dropdownText: {
    color: COLORS.text,
    fontSize: 15,
  },
  placeholderText: {
    color: COLORS.mutedText,
  },
  arrow: {
    color: COLORS.mutedText,
    fontSize: 12,
    marginLeft: SPACING.sm,
  },
  optionsContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  optionItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 15,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});

export default Dropdown;