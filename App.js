// App.js

import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import store from './src/redux/store';
import { AppProvider } from './src/utils/AppContext';

const App = () => {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AppProvider>
          <StatusBar barStyle="dark-content" />
          <AppNavigator />
        </AppProvider>
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;