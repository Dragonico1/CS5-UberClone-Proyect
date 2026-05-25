/**
 * Simple i18n dictionary.
 *
 * This file stores translated text values for Spanish and English.
 * It keeps UI text centralized and makes the app easier to translate.
 */

export const translations = {
  es: {
    appName: 'UberClone',

    profileTitle: 'Perfil',
    selectProfileImage: 'Seleccionar foto',
    fullName: 'Nombre completo',
    phoneNumber: 'Número de celular',
    gender: 'Género',
    email: 'Correo electrónico',
    language: 'Idioma',
    saveProfile: 'Guardar perfil',
    profileSaved: 'Perfil guardado correctamente',

    rideRequestTitle: 'Solicitar viaje',
    searchDestination: 'Buscar destino',
    vehicleCategory: 'Categoría de vehículo',
    economy: 'Económico',
    xl: 'XL',
    premium: 'Premium',
    estimatedFare: 'Tarifa estimada',
    requestRide: 'Solicitar viaje',

    trackingTitle: 'Seguimiento',
    driverOnTheWay: 'Tu conductor va en camino',
    tripInProgress: 'Viaje en curso',
    finishTrip: 'Finalizar viaje',

    paymentTitle: 'Pago',
    selectPaymentMethod: 'Seleccionar método de pago',
    payWithStripe: 'Pagar con Stripe',
    payWithMercadoPago: 'Pagar con Mercado Pago',
    paymentSuccessful: 'Pago exitoso',
    paymentFailed: 'El pago falló',

    tripHistoryTitle: 'Historial',
    noTripsFound: 'No hay viajes registrados',
    tripDetails: 'Detalles del viaje',
    cost: 'Costo',
    date: 'Fecha',
    distance: 'Distancia',
    duration: 'Duración',

    requiredField: 'Este campo es obligatorio',
    loading: 'Cargando...',
    error: 'Ocurrió un error',
  },

  en: {
    appName: 'UberClone',

    profileTitle: 'Profile',
    selectProfileImage: 'Select photo',
    fullName: 'Full name',
    phoneNumber: 'Phone number',
    gender: 'Gender',
    email: 'Email',
    language: 'Language',
    saveProfile: 'Save profile',
    profileSaved: 'Profile saved successfully',

    rideRequestTitle: 'Request ride',
    searchDestination: 'Search destination',
    vehicleCategory: 'Vehicle category',
    economy: 'Economy',
    xl: 'XL',
    premium: 'Premium',
    estimatedFare: 'Estimated fare',
    requestRide: 'Request ride',

    trackingTitle: 'Tracking',
    driverOnTheWay: 'Your driver is on the way',
    tripInProgress: 'Trip in progress',
    finishTrip: 'Finish trip',

    paymentTitle: 'Payment',
    selectPaymentMethod: 'Select payment method',
    payWithStripe: 'Pay with Stripe',
    payWithMercadoPago: 'Pay with Mercado Pago',
    paymentSuccessful: 'Payment successful',
    paymentFailed: 'Payment failed',

    tripHistoryTitle: 'Trip history',
    noTripsFound: 'No trips found',
    tripDetails: 'Trip details',
    cost: 'Cost',
    date: 'Date',
    distance: 'Distance',
    duration: 'Duration',

    requiredField: 'This field is required',
    loading: 'Loading...',
    error: 'An error occurred',
  },
};

/**
 * Gets a translated text value by language and key.
 *
 * @param {string} language - Current language code. Example: "es" or "en".
 * @param {string} key - Translation key.
 * @returns {string} Translated text or the key itself if not found.
 */
export const translate = (language, key) => {
  const selectedLanguage = translations[language] ? language : 'en';

  return translations[selectedLanguage][key] || key;
};

/**
 * Creates a translation helper for a specific language.
 *
 * This makes screens cleaner because they can use:
 * const t = createTranslator(language);
 * t('profileTitle');
 *
 * @param {string} language - Current language code.
 * @returns {Function} Translation function.
 */
export const createTranslator = (language) => {
  return (key) => translate(language, key);
};