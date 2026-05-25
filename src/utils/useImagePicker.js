import { useCallback, useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';

/**
 * Custom hook for selecting an image from the device gallery.
 *
 * This hook is used by the Register/Profile screen to choose a profile photo.
 *
 * @returns {Object} Image picker state and actions.
 */
export const useImagePicker = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [imagePickerError, setImagePickerError] = useState(null);

  /**
   * Opens the image library and lets the user select one image.
   */
  const pickImage = useCallback(async () => {
    try {
      setIsPickingImage(true);
      setImagePickerError(null);

      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel) {
        return null;
      }

      if (result.errorCode) {
        throw new Error(result.errorMessage || 'Image picker failed.');
      }

      const asset = result.assets && result.assets.length > 0
        ? result.assets[0]
        : null;

      if (!asset || !asset.uri) {
        throw new Error('No image was selected.');
      }

      const imageData = {
        uri: asset.uri,
        fileName: asset.fileName || 'profile-image.jpg',
        type: asset.type || 'image/jpeg',
      };

      setSelectedImage(imageData);

      return imageData;
    } catch (error) {
      setImagePickerError(error.message || 'Failed to pick image.');
      return null;
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  /**
   * Clears the selected image.
   */
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