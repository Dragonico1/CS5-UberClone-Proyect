import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS, RADIUS, SPACING } from '../utils/constants';

/**
 * Reusable vehicle category card.
 *
 * This component displays one vehicle category and allows the user
 * to select it during the ride request flow.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.category - Vehicle category data.
 * @param {string} props.category.id - Category identifier.
 * @param {string} props.category.label - Category label.
 * @param {string} props.category.description - Category description.
 * @param {number} props.category.baseFare - Base fare value.
 * @param {boolean} props.isSelected - Indicates whether this category is selected.
 * @param {Function} props.onPress - Function executed when the card is pressed.
 * @returns {React.ReactElement} Vehicle category card.
 */
const VehicleCategoryCard = ({
  category,
  isSelected = false,
  onPress,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.selectedCard,
        pressed && styles.pressedCard,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>
          {category.id === 'economy' ? '🚗' : category.id === 'xl' ? '🚙' : '🚘'}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{category.label}</Text>
        <Text style={styles.description}>{category.description}</Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>
          ${category.baseFare.toLocaleString('es-CO')}
        </Text>
        <Text style={styles.priceLabel}>base</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: COLORS.secondary,
    backgroundColor: '#EEF6FF',
  },
  pressedCard: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  description: {
    color: COLORS.mutedText,
    fontSize: 13,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: SPACING.sm,
  },
  priceText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  priceLabel: {
    color: COLORS.mutedText,
    fontSize: 11,
    marginTop: 2,
  },
});

export default VehicleCategoryCard;