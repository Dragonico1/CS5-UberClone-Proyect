// src/utils/useDriverSimulation.js

import { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_DRIVER_LOCATION } from './constants';

/**
 * Custom hook for simulating driver movement along a route.
 *
 * This hook does not call Google APIs.
 * It only moves the driver marker through coordinates already stored in the app.
 *
 * @param {Object|null} initialLocation - Initial driver location.
 * @returns {Object} Driver simulation state and controls.
 */
export const useDriverSimulation = (initialLocation = DEFAULT_DRIVER_LOCATION) => {
  const [driverLocation, setDriverLocation] = useState(
    initialLocation || DEFAULT_DRIVER_LOCATION,
  );
  const [isDriverMoving, setIsDriverMoving] = useState(false);
  const [simulationError, setSimulationError] = useState(null);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

  const intervalReference = useRef(null);

  /**
   * Stops the active simulation interval.
   */
  const stopSimulation = useCallback(() => {
    if (intervalReference.current) {
      clearInterval(intervalReference.current);
      intervalReference.current = null;
    }

    setIsDriverMoving(false);
  }, []);

  /**
   * Resets the driver marker to a specific location.
   *
   * @param {Object|null} location - New driver location.
   */
  const resetDriverLocation = useCallback((location = null) => {
    stopSimulation();
    setDriverLocation(location || initialLocation || DEFAULT_DRIVER_LOCATION);
    setCurrentRouteIndex(0);
    setSimulationError(null);
  }, [initialLocation, stopSimulation]);

  /**
   * Moves the driver through a route coordinate array.
   *
   * @param {Array} routeCoordinates - Array of coordinates from Google Directions.
   * @param {Function|null} onFinish - Callback executed when route ends.
   */
  const moveAlongRoute = useCallback((routeCoordinates = [], onFinish = null) => {
    try {
      if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) {
        throw new Error('Route coordinates are required to start simulation.');
      }

      stopSimulation();
      setSimulationError(null);
      setIsDriverMoving(true);
      setCurrentRouteIndex(0);
      setDriverLocation(routeCoordinates[0]);

      let index = 0;

      intervalReference.current = setInterval(() => {
        index += 1;

        if (index >= routeCoordinates.length) {
          clearInterval(intervalReference.current);
          intervalReference.current = null;
          setIsDriverMoving(false);

          if (onFinish) {
            setTimeout(onFinish, 500);
          }

          return;
        }

        setCurrentRouteIndex(index);
        setDriverLocation(routeCoordinates[index]);
      }, 450);
    } catch (error) {
      setSimulationError(error.message || 'Failed to move along route.');
      setIsDriverMoving(false);
    }
  }, [stopSimulation]);

  /**
   * Cleans the interval when the component using this hook is unmounted.
   */
  useEffect(() => {
    return () => {
      stopSimulation();
    };
  }, [stopSimulation]);

  return {
    driverLocation,
    isDriverMoving,
    simulationError,
    currentRouteIndex,
    moveAlongRoute,
    stopSimulation,
    resetDriverLocation,
  };
};

export default useDriverSimulation;