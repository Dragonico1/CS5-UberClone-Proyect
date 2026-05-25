// src/services/paymentService.js

/**
 * Payment service.
 *
 * This file centralizes payment operations for Stripe and Mercado Pago.
 *
 * IMPORTANT:
 * In a real production app, secret keys must never be stored in React Native.
 * The mobile app should call a secure backend, and the backend should talk
 * to Stripe or Mercado Pago.
 *
 * This academic version uses mock payments until a real backend is available.
 */

const USE_MOCK_PAYMENTS = true;

const PAYMENT_BACKEND_BASE_URL = 'https://your-backend-url.com/api/payments';

/**
 * Simulates a successful payment response.
 *
 * @param {string} provider - Payment provider name.
 * @param {Object} paymentData - Payment information.
 * @returns {Promise<Object>} Simulated payment response.
 */
const createMockPaymentResponse = async (provider, paymentData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `mock-${provider}-${Date.now()}`,
        transactionId: `mock-${provider}-${Date.now()}`,
        provider,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: 'approved',
        message: 'Mock payment approved successfully.',
      });
    }, 1200);
  });
};

/**
 * Safely parses a fetch response as JSON.
 *
 * This prevents the app from crashing when the backend returns HTML instead of JSON.
 *
 * @param {Response} response - Fetch response.
 * @returns {Promise<Object>} Parsed response data.
 */
const parseJsonResponse = async (response) => {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Server did not return valid JSON. Response starts with: ${text.slice(0, 40)}`,
    );
  }
};

/**
 * Creates a Stripe payment intent through a secure backend.
 *
 * @param {Object} paymentData - Payment information.
 * @returns {Promise<Object>} Stripe payment intent response.
 */
export const createStripePaymentIntent = async (paymentData) => {
  try {
    if (!paymentData) {
      throw new Error('Payment data is required.');
    }

    const { amount, currency, userId, description } = paymentData;

    if (!amount || amount <= 0) {
      throw new Error('A valid payment amount is required.');
    }

    if (!currency) {
      throw new Error('Currency is required.');
    }

    if (!userId) {
      throw new Error('User ID is required.');
    }

    if (USE_MOCK_PAYMENTS) {
      return createMockPaymentResponse('stripe', paymentData);
    }

    const response = await fetch(`${PAYMENT_BACKEND_BASE_URL}/stripe/intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        userId,
        description,
      }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Stripe payment intent.');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Stripe payment failed.');
  }
};

/**
 * Confirms a Stripe payment.
 *
 * @param {Object} confirmationData - Confirmation information.
 * @returns {Promise<Object>} Payment confirmation response.
 */
export const confirmStripePayment = async (confirmationData) => {
  try {
    if (!confirmationData) {
      throw new Error('Confirmation data is required.');
    }

    const { transactionId, userId } = confirmationData;

    if (!transactionId) {
      throw new Error('Transaction ID is required.');
    }

    if (!userId) {
      throw new Error('User ID is required.');
    }

    if (USE_MOCK_PAYMENTS) {
      return {
        transactionId,
        userId,
        status: 'confirmed',
        message: 'Mock Stripe payment confirmed.',
      };
    }

    const response = await fetch(`${PAYMENT_BACKEND_BASE_URL}/stripe/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId,
        userId,
      }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to confirm Stripe payment.');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Stripe confirmation failed.');
  }
};

/**
 * Creates a Mercado Pago preference through a secure backend.
 *
 * @param {Object} paymentData - Payment information.
 * @returns {Promise<Object>} Mercado Pago preference response.
 */
export const createMercadoPagoPreference = async (paymentData) => {
  try {
    if (!paymentData) {
      throw new Error('Payment data is required.');
    }

    const { amount, currency, userId, description } = paymentData;

    if (!amount || amount <= 0) {
      throw new Error('A valid payment amount is required.');
    }

    if (!currency) {
      throw new Error('Currency is required.');
    }

    if (!userId) {
      throw new Error('User ID is required.');
    }

    if (USE_MOCK_PAYMENTS) {
      return createMockPaymentResponse('mercado_pago', paymentData);
    }

    const response = await fetch(`${PAYMENT_BACKEND_BASE_URL}/mercado-pago/preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        userId,
        description,
      }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Mercado Pago preference.');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Mercado Pago payment failed.');
  }
};

/**
 * Confirms a Mercado Pago payment through the backend.
 *
 * @param {Object} confirmationData - Confirmation information.
 * @returns {Promise<Object>} Payment confirmation response.
 */
export const confirmMercadoPagoPayment = async (confirmationData) => {
  try {
    if (!confirmationData) {
      throw new Error('Confirmation data is required.');
    }

    const { paymentId, userId } = confirmationData;

    if (!paymentId) {
      throw new Error('Payment ID is required.');
    }

    if (!userId) {
      throw new Error('User ID is required.');
    }

    if (USE_MOCK_PAYMENTS) {
      return {
        paymentId,
        userId,
        status: 'confirmed',
        message: 'Mock Mercado Pago payment confirmed.',
      };
    }

    const response = await fetch(`${PAYMENT_BACKEND_BASE_URL}/mercado-pago/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId,
        userId,
      }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to confirm Mercado Pago payment.');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Mercado Pago confirmation failed.');
  }
};