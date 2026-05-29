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

import { loginSuccess, authStart, authFailure } from '../redux/slices/authSlice';

import { saveUserProfile } from '../services/userService';

/**
 * Register/Profile screen.
 *
 * Dual purpose:
 *  1. NEW USER  (coming from AuthScreen → Register):
 *     Generates a unique Firestore document ID, saves the profile,
 *     and dispatches loginSuccess so the app switches to MainTabs.
 *
 *  2. EDIT PROFILE (coming from MainTabs → Profile tab):
 *     Updates the existing Firestore document using the userId already
 *     stored in authSlice. Does NOT dispatch loginSuccess again.
 *
 * @param {Object} props
 * @param {Object} props.navigation - React Navigation object.
 * @param {Object} props.route     - Route params: { isEditing?: boolean }
 */
const RegisterProfileScreen = ({ navigation, route }) => {
  // When opened from the Profile tab the user is already authenticated.
  const isEditing = route?.params?.isEditing ?? false;

  const dispatch = useDispatch();

  const user   = useSelector((state) => state.user);
  const auth   = useSelector((state) => state.auth);

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

  const [profileImage,  setLocalProfileImage] = useState(user.profileImage);
  const [fullName,      setFullName]           = useState(user.fullName);
  const [phoneNumber,   setPhoneNumber]        = useState(user.phoneNumber);
  const [gender,        setGender]             = useState(user.gender);
  const [email,         setEmail]              = useState(user.email);
  const [language,      setLanguage]           = useState(user.language || 'es');
  const [errors,        setErrors]             = useState({});
  const [isSaving,      setIsSaving]           = useState(false);

  const t = createTranslator(language);

  useEffect(() => {
    if (selectedImage?.uri) {
      setLocalProfileImage(selectedImage.uri);
      dispatch(setProfileImage(selectedImage.uri));
    }
  }, [selectedImage, dispatch]);

  useEffect(() => {
    if (imagePickerError) {
      Alert.alert('Error de imagen', imagePickerError);
    }
  }, [imagePickerError]);

  useEffect(() => {
    if (globalMessage) {
      const id = setTimeout(clearGlobalMessage, 3000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [globalMessage, clearGlobalMessage]);

  const handlePhoneChange = (value) => {
    setPhoneNumber(value.replace(/[^0-9]/g, ''));
  };

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    dispatch(setReduxLanguage(lang));
  };

  /**
   * Validates and saves the profile.
   *
   * - New user: creates a Firestore document with a generated ID and logs in.
   * - Editing:  updates the existing document, stays on the screen.
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
      setIsSaving(true);
      dispatch(authStart());

      // Determine the userId: reuse existing one when editing, generate new for registration.
      const userId = isEditing && auth.userId
        ? auth.userId
        : `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Persist to Redux
      dispatch(setUserProfile(profileData));

      // Persist to Firestore
      await saveUserProfile(userId, profileData);

      if (isEditing) {
        // Already authenticated — just show success message
        setGlobalMessage(t('profileSaved'));
        Alert.alert(t('profileTitle'), t('profileSaved'));
        dispatch(authFailure(null)); // clear loading flag
      } else {
        // New registration — start session
        dispatch(loginSuccess({ userId }));
        // AppNavigator will automatically switch to MainTabs
      }
    } catch (error) {
      dispatch(authFailure(error.message));
      Alert.alert('Error', error.message || 'No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <Text style={styles.title}>
          {isEditing ? t('profileTitle') : 'Crear cuenta'}
        </Text>
        <Text style={styles.subtitle}>
          {isEditing
            ? 'Actualiza tu información de perfil.'
            : 'Completa tu perfil para empezar a solicitar viajes.'}
        </Text>

        {globalMessage ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{globalMessage}</Text>
          </View>
        ) : null}

        {/* ── Profile image ── */}
        <View style={styles.imageSection}>
          <Pressable
            style={[
              styles.imageContainer,
              errors.profileImage ? styles.imageContainerError : null,
            ]}
            onPress={pickImage}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Text style={styles.imagePlaceholder}>+</Text>
            )}
          </Pressable>

          <AppButton
            title={t('selectProfileImage')}
            onPress={pickImage}
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
          placeholder="Tu nombre completo"
          maxLength={MAX_FULL_NAME_LENGTH}
          error={errors.fullName}
        />

        <AppInput
          label={t('phoneNumber')}
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          placeholder="Ej: 3001234567"
          keyboardType="numeric"
          error={errors.phoneNumber}
        />

        <Dropdown
          label={t('gender')}
          value={gender}
          options={GENDER_OPTIONS}
          onSelect={setGender}
          placeholder="Selecciona tu género"
          error={errors.gender}
        />

        <AppInput
          label={t('email')}
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          error={errors.email}
        />

        <Dropdown
          label={t('language')}
          value={language}
          options={LANGUAGE_OPTIONS}
          onSelect={handleLanguageSelect}
          placeholder="Selecciona tu idioma"
          error={errors.language}
        />

        <AppButton
          title={isEditing ? t('saveProfile') : 'Crear cuenta'}
          onPress={handleSaveProfile}
          isLoading={isSaving}
        />

        {!isEditing ? (
          <AppButton
            title="Ya tengo cuenta"
            onPress={() => navigation.navigate('Login')}
            variant="secondary"
          />
        ) : null}
      </ScrollView>

      <LoadingOverlay
        visible={isSaving}
        message={isEditing ? 'Guardando perfil...' : 'Creando cuenta...'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen:               { flex: 1, backgroundColor: COLORS.background },
  scrollContent:        { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  title:                { color: COLORS.text, fontSize: 28, fontWeight: '900', marginBottom: SPACING.xs },
  subtitle:             { color: COLORS.mutedText, fontSize: 15, marginBottom: SPACING.lg },
  messageBox:           { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: COLORS.success, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  messageText:          { color: COLORS.success, fontSize: 14, fontWeight: '600' },
  imageSection:         { alignItems: 'center', marginBottom: SPACING.lg },
  imageContainer:       { width: 130, height: 130, borderRadius: 65, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: SPACING.md },
  imageContainerError:  { borderColor: COLORS.error },
  profileImage:         { width: '100%', height: '100%' },
  imagePlaceholder:     { color: COLORS.secondary, fontSize: 42, fontWeight: '300' },
  errorText:            { color: COLORS.error, fontSize: 12, marginTop: SPACING.xs, textAlign: 'center' },
});

export default RegisterProfileScreen;