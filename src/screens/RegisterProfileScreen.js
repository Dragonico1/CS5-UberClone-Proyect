// src/screens/RegisterProfileScreen.js

import React, {
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Dropdown from '../components/Dropdown';
import LoadingOverlay from '../components/LoadingOverlay';

import {
  COLORS,
  DEFAULT_USER_ID,
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
  MAX_FULL_NAME_LENGTH,
  RADIUS,
  SPACING,
} from '../utils/constants';

import { AppContext } from '../utils/AppContext';
import { createTranslator } from '../utils/i18n';
import { useImagePicker } from '../utils/useImagePicker';
import { validateUserProfile } from '../utils/validators';

import {
  setLanguage as setReduxLanguage,
  setProfileImage,
  setUserProfile,
} from '../redux/slices/userSlice';

import { saveUserProfile } from '../services/userService';

/**
 * Register/Profile screen.
 *
 * This screen allows the user to create or update their profile.
 * It includes image picker, form validation, Redux state and Firestore saving.
 *
 * @returns {React.ReactElement} Register/Profile screen.
 */
const RegisterProfileScreen = () => {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user);

  const {
    globalMessage,
    setGlobalMessage,
    clearGlobalMessage,
  } = useContext(AppContext);

  const {
    selectedImage,
    isPickingImage,
    imagePickerError,
    pickImage,
  } = useImagePicker();

  const [profileImage, setLocalProfileImage] = useState(user.profileImage);
  const [fullName, setFullName] = useState(user.fullName);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
  const [gender, setGender] = useState(user.gender);
  const [email, setEmail] = useState(user.email);
  const [language, setLanguage] = useState(user.language || 'es');
  const [errors, setErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const t = createTranslator(language);

  /**
   * Updates local and Redux image state when a new image is selected.
   */
  useEffect(() => {
    if (selectedImage?.uri) {
      setLocalProfileImage(selectedImage.uri);
      dispatch(setProfileImage(selectedImage.uri));
    }
  }, [selectedImage, dispatch]);

  /**
   * Shows image picker errors when they happen.
   */
  useEffect(() => {
    if (imagePickerError) {
      Alert.alert('Image error', imagePickerError);
    }
  }, [imagePickerError]);

  /**
   * Clears global messages after they are shown.
   */
  useEffect(() => {
    if (globalMessage) {
      const timeoutId = setTimeout(() => {
        clearGlobalMessage();
      }, 3000);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [globalMessage, clearGlobalMessage]);

  /**
   * Handles numeric-only phone input.
   *
   * @param {string} value - Input value.
   */
  const handlePhoneChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setPhoneNumber(numericValue);
  };

  /**
   * Handles language selection.
   *
   * @param {string} selectedLanguage - Selected language code.
   */
  const handleLanguageSelect = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    dispatch(setReduxLanguage(selectedLanguage));
  };

  /**
   * Opens the device image picker.
   */
  const handlePickImage = async () => {
    await pickImage();
  };

  /**
   * Validates and saves the user profile.
   */
  const handleSaveProfile = async () => {
    const profileData = {
      profileImage,
      fullName,
      phoneNumber,
      gender,
      email,
      language,
    };

    const validation = validateUserProfile(profileData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setErrors({});
      setIsSavingProfile(true);

      dispatch(setUserProfile(profileData));

      await saveUserProfile(DEFAULT_USER_ID, profileData);

      setGlobalMessage(t('profileSaved'));
      Alert.alert(t('profileTitle'), t('profileSaved'));
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t('profileTitle')}</Text>
        <Text style={styles.subtitle}>
          Complete your profile before requesting a ride.
        </Text>

        {globalMessage ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{globalMessage}</Text>
          </View>
        ) : null}

        <View style={styles.imageSection}>
          <Pressable
            style={[
              styles.imageContainer,
              errors.profileImage ? styles.imageContainerError : null,
            ]}
            onPress={handlePickImage}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.imagePlaceholder}>+</Text>
            )}
          </Pressable>

          <AppButton
            title={t('selectProfileImage')}
            onPress={handlePickImage}
            isLoading={isPickingImage}
            variant="secondary"
          />

          {errors.profileImage ? (
            <Text style={styles.errorText}>{errors.profileImage}</Text>
          ) : null}
        </View>

        <AppInput
          label={t('fullName')}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          maxLength={MAX_FULL_NAME_LENGTH}
          error={errors.fullName}
        />

        <AppInput
          label={t('phoneNumber')}
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          placeholder="Enter your phone number"
          keyboardType="numeric"
          error={errors.phoneNumber}
        />

        <Dropdown
          label={t('gender')}
          value={gender}
          options={GENDER_OPTIONS}
          onSelect={setGender}
          placeholder="Select your gender"
          error={errors.gender}
        />

        <AppInput
          label={t('email')}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          error={errors.email}
        />

        <Dropdown
          label={t('language')}
          value={language}
          options={LANGUAGE_OPTIONS}
          onSelect={handleLanguageSelect}
          placeholder="Select your language"
          error={errors.language}
        />

        <AppButton
          title={t('saveProfile')}
          onPress={handleSaveProfile}
          isLoading={isSavingProfile}
        />
      </ScrollView>

      <LoadingOverlay
        visible={isSavingProfile}
        message="Saving profile..."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    marginBottom: SPACING.lg,
  },
  messageBox: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  messageText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  imageContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  imageContainerError: {
    borderColor: COLORS.error,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    color: COLORS.secondary,
    fontSize: 42,
    fontWeight: '300',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default RegisterProfileScreen;