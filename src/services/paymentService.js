// src/services/paymentService.js

/**
 * Payment service.
 *
 * Centralizes payment operations for Stripe and Mercado Pago.
 *
 * SECURITY NOTE:
 * Secret keys must NEVER be stored in the React Native app.
 * The mobile app calls a secure backend, and the backend communicates
 * with Stripe or Mercado Pago using server-side secrets.
 *
 * MERCADO PAGO — fully integrated (mock ↔ real switch via USE_MOCK_PAYMENTS).
 * STRIPE        — placeholder ready; add your backend URL and uncomment.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Set to `false` once your backend is deployed.
 * When `true` all payments are simulated locally (no network calls).
 */
const USE_MOCK_PAYMENTS = false;

const PAYMENT_BACKEND_BASE_URL = 'http://10.0.2.2:3000/api/payments';

// ─── Mercado Pago — public SDK config (non-secret) ────────────────────────────

/**
 * Your Mercado Pago PUBLIC key (safe to bundle — it is not a secret).
 * Obtain it from: https://www.mercadopago.com/developers/panel/app
 *
 * The ACCESS TOKEN (secret) lives exclusively on your backend.
 */
const MERCADO_PAGO_PUBLIC_KEY = 'APP_USR-05ccc06a-9a22-41fb-9db2-5da45f1af810';

// ─── Stripe — public key placeholder ─────────────────────────────────────────

/**
 * Your Stripe PUBLISHABLE key (safe to bundle — it is not a secret).
 * Obtain it from: https://dashboard.stripe.com/apikeys
 *
 * The SECRET KEY lives exclusively on your backend.
 *
 * TODO: replace with your real key and install the SDK:
 *   npm install @stripe/stripe-react-native
 *   Then initialise <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
 *   wrapping your app root.
 */
// const STRIPE_PUBLISHABLE_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';


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
 * @param {string} provider   - Provider name ('stripe' | 'mercado_pago').
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
 *   4. App opens `initPoint` in a WebView / browser so the user can pay.
 *
 * MP Preference API reference:
 *   https://www.mercadopago.com.co/developers/en/reference/preferences/_checkout_preferences/post
 *
 * @param {Object} paymentData
 * @param {number} paymentData.amount       - Amount in the smallest currency unit (COP cents → pesos for MP).
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


// ─── Stripe ───────────────────────────────────────────────────────────────────

/**
 * Creates a Stripe PaymentIntent via your secure backend.
 *
 * ─── HOW TO ACTIVATE ────────────────────────────────────────────────────────
 * 1. Install the Stripe SDK:
 *      npm install @stripe/stripe-react-native
 *
 * 2. Wrap your app root with StripeProvider:
 *      import { StripeProvider } from '@stripe/stripe-react-native';
 *      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
 *        <App />
 *      </StripeProvider>
 *
 * 3. Set USE_MOCK_PAYMENTS = false and fill in PAYMENT_BACKEND_BASE_URL.
 *
 * 4. Use the returned `clientSecret` with the Stripe SDK to confirm payment:
 *      const { confirmPayment } = useStripe();
 *      await confirmPayment(clientSecret, { paymentMethodType: 'Card', ... });
 *
 * Stripe PaymentIntents reference:
 *   https://stripe.com/docs/api/payment_intents/create
 * ────────────────────────────────────────────────────────────────────────────
 *
 * @param {Object} paymentData
 * @param {number} paymentData.amount       - Amount in the smallest currency unit (e.g. cents).
 * @param {string} paymentData.currency     - ISO 4217 code, e.g. 'usd', 'cop'.
 * @param {string} paymentData.userId       - Internal user identifier.
 * @param {string} [paymentData.description] - Payment description.
 * @returns {Promise<Object>} PaymentIntent response: { clientSecret, transactionId, ... }
 */
export const createStripePaymentIntent = async (paymentData) => {
  try {
    validatePaymentData(paymentData);

    // ── Mock mode ────────────────────────────────────────────────────────────
    if (USE_MOCK_PAYMENTS) {
      return createMockPaymentResponse('stripe', paymentData);
    }

    // ── Real mode  (TODO: uncomment when backend is ready) ───────────────────
    const { amount, currency, userId, description } = paymentData;

    const response = await fetch(
      `${PAYMENT_BACKEND_BASE_URL}/stripe/intent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, userId, description }),
      },
    );

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Stripe PaymentIntent.');
    }

    /**
     * Expected backend response shape:
     * {
     *   clientSecret:  string,  // used by the Stripe SDK to confirm on-device
     *   transactionId: string,  // your internal transaction ID (= PaymentIntent id)
     * }
     */
    return data;
  } catch (error) {
    throw new Error(error.message || 'Stripe payment failed.');
  }
};

/**
 * Confirms a Stripe payment via your secure backend.
 *
 * In a real integration you would normally confirm the payment directly
 * on the device using the Stripe React Native SDK (`confirmPayment`).
 * This endpoint is useful for server-side confirmation or status polling.
 *
 * @param {Object} confirmationData
 * @param {string} confirmationData.transactionId - Stripe PaymentIntent ID.
 * @param {string} confirmationData.userId        - Internal user identifier.
 * @returns {Promise<Object>} Confirmation result: { transactionId, status, ... }
 */
export const confirmStripePayment = async (confirmationData) => {
  try {
    if (!confirmationData)                throw new Error('Confirmation data is required.');
    if (!confirmationData.transactionId)  throw new Error('Transaction ID is required.');
    if (!confirmationData.userId)         throw new Error('User ID is required.');

    // ── Mock mode ────────────────────────────────────────────────────────────
    if (USE_MOCK_PAYMENTS) {
      return {
        transactionId: confirmationData.transactionId,
        userId:        confirmationData.userId,
        status:        'succeeded',
        message:       'Mock Stripe payment confirmed.',
      };
    }

    // ── Real mode  (TODO: uncomment when backend is ready) ───────────────────
    const { transactionId, userId } = confirmationData;

    const response = await fetch(
      `${PAYMENT_BACKEND_BASE_URL}/stripe/confirm`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, userId }),
      },
    );

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to confirm Stripe payment.');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Stripe confirmation failed.');
  }
};