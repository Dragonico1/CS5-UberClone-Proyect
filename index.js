/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Unsupported top level event type "topUserLocationChange"',
]);

AppRegistry.registerComponent(appName, () => App);
