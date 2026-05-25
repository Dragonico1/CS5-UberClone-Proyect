import { createSlice } from '@reduxjs/toolkit';

/**
 * Initial state for the user profile.
 *
 * This state stores the profile information required by the Register/Profile screen.
 */
const initialState = {
  profileImage: null,
  fullName: '',
  phoneNumber: '',
  gender: '',
  email: '',
  language: 'es',
  isProfileCompleted: false,
};

/**
 * User slice.
 *
 * This slice manages all user profile data.
 */
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /**
     * Updates the complete user profile.
     */
    setUserProfile: (state, action) => {
      const {
        profileImage,
        fullName,
        phoneNumber,
        gender,
        email,
        language,
      } = action.payload;

      state.profileImage = profileImage;
      state.fullName = fullName;
      state.phoneNumber = phoneNumber;
      state.gender = gender;
      state.email = email;
      state.language = language;
      state.isProfileCompleted = true;
    },

    /**
     * Updates only the profile image.
     */
    setProfileImage: (state, action) => {
      state.profileImage = action.payload;
    },

    /**
     * Updates the selected app language.
     */
    setLanguage: (state, action) => {
      state.language = action.payload;
    },

    /**
     * Clears the user profile and returns the state to its initial values.
     */
    clearUserProfile: () => initialState,
  },
});

export const {
  setUserProfile,
  setProfileImage,
  setLanguage,
  clearUserProfile,
} = userSlice.actions;

export default userSlice.reducer;