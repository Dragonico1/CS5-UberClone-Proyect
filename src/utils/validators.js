import { MAX_FULL_NAME_LENGTH } from './constants';

/**
 * Checks if a value is empty, null or undefined.
 *
 * @param {*} value - Value to validate.
 * @returns {boolean} True if the value is empty.
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return true;
  }

  return false;
};

/**
 * Validates the user's full name.
 *
 * Rules:
 * - It cannot be empty.
 * - It cannot exceed 50 characters.
 *
 * @param {string} fullName - User full name.
 * @returns {string|null} Error message or null if valid.
 */
export const validateFullName = (fullName) => {
  if (isEmpty(fullName)) {
    return 'Full name is required.';
  }

  if (fullName.trim().length > MAX_FULL_NAME_LENGTH) {
    return `Full name cannot exceed ${MAX_FULL_NAME_LENGTH} characters.`;
  }

  return null;
};

/**
 * Validates the user's phone number.
 *
 * Rules:
 * - It cannot be empty.
 * - It must contain only numbers.
 *
 * @param {string} phoneNumber - User phone number.
 * @returns {string|null} Error message or null if valid.
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (isEmpty(phoneNumber)) {
    return 'Phone number is required.';
  }

  const numericRegex = /^[0-9]+$/;

  if (!numericRegex.test(phoneNumber)) {
    return 'Phone number must contain only numbers.';
  }

  return null;
};

/**
 * Validates the user's email.
 *
 * Rules:
 * - It cannot be empty.
 * - It must contain "@".
 * - It must contain a valid domain.
 *
 * @param {string} email - User email.
 * @returns {string|null} Error message or null if valid.
 */
export const validateEmail = (email) => {
  if (isEmpty(email)) {
    return 'Email is required.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailRegex.test(email.trim())) {
    return 'Email must include @ and a valid domain.';
  }

  return null;
};

/**
 * Validates a dropdown value.
 *
 * @param {string} value - Selected value.
 * @param {string} fieldName - Field name used in the error message.
 * @returns {string|null} Error message or null if valid.
 */
export const validateDropdownValue = (value, fieldName) => {
  if (isEmpty(value)) {
    return `${fieldName} is required.`;
  }

  return null;
};

/**
 * Validates the complete user profile form.
 *
 * @param {Object} profile - Profile form data.
 * @param {string|null} profile.profileImage - Selected image URI.
 * @param {string} profile.fullName - User full name.
 * @param {string} profile.phoneNumber - User phone number.
 * @param {string} profile.gender - Selected gender.
 * @param {string} profile.email - User email.
 * @param {string} profile.language - Selected language.
 * @returns {Object} Validation result.
 */
export const validateUserProfile = (profile) => {
  const errors = {};

  if (!profile) {
    return {
      isValid: false,
      errors: {
        form: 'Profile data is required.',
      },
    };
  }

  if (isEmpty(profile.profileImage)) {
    errors.profileImage = 'Profile image is required.';
  }

  const fullNameError = validateFullName(profile.fullName);
  if (fullNameError) {
    errors.fullName = fullNameError;
  }

  const phoneNumberError = validatePhoneNumber(profile.phoneNumber);
  if (phoneNumberError) {
    errors.phoneNumber = phoneNumberError;
  }

  const genderError = validateDropdownValue(profile.gender, 'Gender');
  if (genderError) {
    errors.gender = genderError;
  }

  const emailError = validateEmail(profile.email);
  if (emailError) {
    errors.email = emailError;
  }

  const languageError = validateDropdownValue(profile.language, 'Language');
  if (languageError) {
    errors.language = languageError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};