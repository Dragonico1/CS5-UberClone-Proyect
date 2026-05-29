// src/services/paymentService.js

/**
 * Payment service.
 *
 * Centralizes payment operations for Mercado Pago.
 *
 * SECURITY NOTE:
 * Secret keys must NEVER be stored in the React Native app.
 * The mobile app calls a secure backend, and the backend communicates
 * with Mercado Pago using server-side secrets.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Set to `false` once your backend is deployed.
 * When `true` all payments are simulated locally (no network calls).
 */
const USE_MOCK_PAYMENTS = false;

import { PAYMENT_BACKEND_BASE_URL } from '@env';


// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Safely parses a fetch response as JSON.
 * Prevents the app from crashing when the backend returns HTML on errors.
 *
 * @param {Response} response - Fetch response object.
 * @returns {Promise<Object>} Parsed JSON body.
 * @throws {Error} When the body is not valid JSON.
 */
const parseJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Server did not return valid JSON. Response starts with: ${text.slice(0, 60)}`,
    );
  }
};

/**
 * Validates the common fields required by every payment call.
 *
 * @param {Object} paymentData - Payment payload to validate.
 * @throws {Error} On missing or invalid fields.
 */
const validatePaymentData = (paymentData) => {
  if (!paymentData) throw new Error('Payment data is required.');

  const { amount, currency, userId } = paymentData;

  if (!amount || amount <= 0) throw new Error('A valid payment amount is required.');
  if (!currency)              throw new Error('Currency is required.');
  if (!userId)                throw new Error('User ID is required.');
};

/**
 * Simulates a successful payment response (used when USE_MOCK_PAYMENTS = true).
 *
 * @param {string} provider   - Provider name ('mercado_pago').
 * @param {Object} paymentData - Payment payload.
 * @returns {Promise<Object>} Simulated payment response.
 */
const createMockPaymentResponse = (provider, paymentData) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const id = `mock-${provider}-${Date.now()}`;
      resolve({
        id,
        transactionId: id,
        provider,
        amount:   paymentData.amount,
        currency: paymentData.currency,
        status:   'approved',
        message:  'Mock payment approved successfully.',
      });
    }, 1200);
  });


// ─── Mercado Pago ─────────────────────────────────────────────────────────────

/**
 * Creates a Mercado Pago preference via your secure backend.
 *
 * Real flow:
 *   1. App calls  POST /api/payments/mercado-pago/preference  (your backend).
 *   2. Backend uses the MP Access Token to create the preference with the MP API.
 *   3. Backend returns { preferenceId, initPoint, transactionId }.
 *   4. App opens `initPoint` in a WebView so the user can pay.
 *
 * MP Preference API reference:
 *   https://www.mercadopago.com.co/developers/en/reference/preferences/_checkout_preferences/post
 *
 * @param {Object} paymentData
 * @param {number} paymentData.amount       - Amount in the smallest currency unit.
 * @param {string} paymentData.currency     - ISO 4217 code, e.g. 'COP'.
 * @param {string} paymentData.userId       - Internal user identifier.
 * @param {string} [paymentData.description] - Item description shown to the payer.
 * @returns {Promise<Object>} Preference response: { id, transactionId, initPoint, ... }
 */
export const createMercadoPagoPreference = async (paymentData) => {
  try {
    validatePaymentData(paymentData);

    // ── Mock mode ────────────────────────────────────────────────────────────
    if (USE_MOCK_PAYMENTS) {
      return createMockPaymentResponse('mercado_pago', paymentData);
    }

    // ── Real mode ────────────────────────────────────────────────────────────
    const { amount, currency, userId, description } = paymentData;

    const response = await fetch(
      `${PAYMENT_BACKEND_BASE_URL}/mercado-pago/preference`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, userId, description }),
      },
    );

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Mercado Pago preference.');
    }

    /**
     * Expected backend response shape:
     * {
     *   id:            string,   // MP preference ID
     *   transactionId: string,   // your internal transaction ID
     *   initPoint:     string,   // URL to redirect the user for payment
     *   sandboxInitPoint: string // same but for sandbox
     * }
     */
    return data;
  } catch (error) {
    throw new Error(error.message || 'Mercado Pago payment failed.');
  }
};

/**
 * Confirms / validates a Mercado Pago payment via your secure backend.
 *
 * Call this after the user returns from the MP checkout to verify the
 * payment status using the backend (never trust client-side status alone).
 *
 * MP Payment status reference:
 *   https://www.mercadopago.com.co/developers/en/docs/checkout-pro/integration-test/test-payment-flow
 *
 * @param {Object} confirmationData
 * @param {string} confirmationData.paymentId    - MP payment_id returned by the checkout redirect.
 * @param {string} confirmationData.userId       - Internal user identifier.
 * @param {string} [confirmationData.preferenceId] - Optional MP preference ID for extra validation.
 * @returns {Promise<Object>} Confirmation result: { paymentId, status, ... }
 */
export const confirmMercadoPagoPayment = async (confirmationData) => {
  try {
    if (!confirmationData)            throw new Error('Confirmation data is required.');
    if (!confirmationData.paymentId)  throw new Error('Payment ID is required.');
    if (!confirmationData.userId)     throw new Error('User ID is required.');

    // ── Mock mode ────────────────────────────────────────────────────────────
    if (USE_MOCK_PAYMENTS) {
      return {
        paymentId: confirmationData.paymentId,
        userId:    confirmationData.userId,
        status:    'approved',
        message:   'Mock Mercado Pago payment confirmed.',
      };
    }

    // ── Real mode ────────────────────────────────────────────────────────────
    const { paymentId, userId, preferenceId } = confirmationData;

    const response = await fetch(
      `${PAYMENT_BACKEND_BASE_URL}/mercado-pago/confirm`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, userId, preferenceId }),
      },
    );

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to confirm Mercado Pago payment.');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Mercado Pago confirmation failed.');
  }
};