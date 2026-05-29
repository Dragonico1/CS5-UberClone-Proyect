// src/utils/useImagePicker.js

import { useCallback, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

/**
 * Custom hook for selecting an image from the device gallery.
 * Compatible with react-native-image-picker v8+ and Android 13+
 */
export const useImagePicker = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [imagePickerError, setImagePickerError] = useState(null);

  /**
   * Solicita permisos de galería según la versión de Android.
   * Android 13+ (API 33+) usa READ_MEDIA_IMAGES.
   * Android 12 y menor usa READ_EXTERNAL_STORAGE.
   */
  const requestGalleryPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;

    try {
      // Android 13+ (API level 33)
      const permission = Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

      const already = await PermissionsAndroid.check(permission);
      if (already) return true;

      const result = await PermissionsAndroid.request(permission, {
        title:         'Permiso de galería',
        message:       'La app necesita acceso a tu galería para seleccionar una foto de perfil.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Cancelar',
      });

      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }, []);

  const pickImage = useCallback(async () => {
    try {
      setIsPickingImage(true);
      setImagePickerError(null);

      const hasPermission = await requestGalleryPermission();

      if (!hasPermission) {
        Alert.alert(
          'Permiso denegado',
          'Necesitas permitir el acceso a la galería en los ajustes del dispositivo.',
        );
        return null;
      }

      const result = await launchImageLibrary({
        mediaType:     'photo',
        selectionLimit: 1,
        quality:        0.8,
        includeBase64:  false,
      });

      if (result.didCancel) return null;

      if (result.errorCode) {
        throw new Error(result.errorMessage || 'Error al abrir la galería.');
      }

      const asset = result.assets?.[0];

      if (!asset?.uri) {
        throw new Error('No se seleccionó ninguna imagen.');
      }

      const imageData = {
        uri:      asset.uri,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        type:     asset.type     || 'image/jpeg',
        fileSize: asset.fileSize || 0,
        width:    asset.width,
        height:   asset.height,
      };

      setSelectedImage(imageData);
      return imageData;

    } catch (error) {
      setImagePickerError(error.message || 'Error al seleccionar imagen.');
      return null;
    } finally {
      setIsPickingImage(false);
    }
  }, [requestGalleryPermission]);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setImagePickerError(null);
  }, []);

  return {
    selectedImage,
    isPickingImage,
    imagePickerError,
    pickImage,
    clearImage,
  };
};

export default useImagePicker;