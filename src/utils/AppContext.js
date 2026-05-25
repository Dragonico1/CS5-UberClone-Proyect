import React, { createContext, useMemo, useReducer } from 'react';

/**
 * Initial state for the application context.
 *
 * This context is used for lightweight UI state.
 * Redux is still used for core business state such as user, ride, payment and trip history.
 */
const initialAppState = {
  isDarkMode: false,
  globalMessage: '',
};

/**
 * Action types used by the app reducer.
 */
const APP_ACTIONS = {
  toggleDarkMode: 'TOGGLE_DARK_MODE',
  setGlobalMessage: 'SET_GLOBAL_MESSAGE',
  clearGlobalMessage: 'CLEAR_GLOBAL_MESSAGE',
};

/**
 * Reducer for lightweight app UI state.
 *
 * This reducer is intentionally small because complex app state is handled by Redux Toolkit.
 *
 * @param {Object} state - Current context state.
 * @param {Object} action - Reducer action.
 * @returns {Object} New context state.
 */
const appReducer = (state, action) => {
  switch (action.type) {
    case APP_ACTIONS.toggleDarkMode:
      return {
        ...state,
        isDarkMode: !state.isDarkMode,
      };

    case APP_ACTIONS.setGlobalMessage:
      return {
        ...state,
        globalMessage: action.payload,
      };

    case APP_ACTIONS.clearGlobalMessage:
      return {
        ...state,
        globalMessage: '',
      };

    default:
      return state;
  }
};

/**
 * App context.
 *
 * Components can use this context through React's useContext hook.
 */
export const AppContext = createContext({
  isDarkMode: false,
  globalMessage: '',
  toggleDarkMode: () => {},
  setGlobalMessage: () => {},
  clearGlobalMessage: () => {},
});

/**
 * App context provider.
 *
 * This component wraps the app and exposes lightweight UI actions.
 *
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {React.ReactElement} Context provider.
 */
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  /**
   * Toggles the dark mode flag.
   */
  const toggleDarkMode = () => {
    dispatch({
      type: APP_ACTIONS.toggleDarkMode,
    });
  };

  /**
   * Sets a global message.
   *
   * @param {string} message - Message to show globally.
   */
  const setGlobalMessage = (message) => {
    dispatch({
      type: APP_ACTIONS.setGlobalMessage,
      payload: message,
    });
  };

  /**
   * Clears the current global message.
   */
  const clearGlobalMessage = () => {
    dispatch({
      type: APP_ACTIONS.clearGlobalMessage,
    });
  };

  /**
   * Memoized context value.
   *
   * useMemo prevents unnecessary re-renders when the context value does not change.
   */
  const contextValue = useMemo(
    () => ({
      isDarkMode: state.isDarkMode,
      globalMessage: state.globalMessage,
      toggleDarkMode,
      setGlobalMessage,
      clearGlobalMessage,
    }),
    [state.isDarkMode, state.globalMessage],
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};