import { createSlice } from '@reduxjs/toolkit';

/**
 * Initial state for payment management.
 *
 * This state stores the selected payment method,
 * the payment status and transaction information.
 */
const initialState = {
  selectedPaymentMethod: '',
  paymentProvider: '',
  transactionId: null,
  paymentStatus: 'idle',
  isLoading: false,
  error: null,
};

/**
 * Payment slice.
 *
 * This slice manages payment state for Stripe and Mercado Pago flows.
 */
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    /**
     * Sets the selected payment method.
     *
     * Example values:
     * credit_card, debit_card, mercado_pago_wallet
     */
    setSelectedPaymentMethod: (state, action) => {
      state.selectedPaymentMethod = action.payload;
    },

    /**
     * Sets the selected payment provider.
     *
     * Example values:
     * stripe, mercado_pago
     */
    setPaymentProvider: (state, action) => {
      state.paymentProvider = action.payload;
    },

    /**
     * Starts the payment process.
     */
    startPayment: (state) => {
      state.isLoading = true;
      state.paymentStatus = 'processing';
      state.error = null;
    },

    /**
     * Stores a successful payment response.
     */
    paymentSuccess: (state, action) => {
      state.isLoading = false;
      state.paymentStatus = 'success';
      state.transactionId = action.payload.transactionId;
      state.error = null;
    },

    /**
     * Stores a failed payment response.
     */
    paymentFailure: (state, action) => {
      state.isLoading = false;
      state.paymentStatus = 'failed';
      state.error = action.payload;
    },

    /**
     * Clears payment state.
     */
    clearPayment: () => initialState,
  },
});

export const {
  setSelectedPaymentMethod,
  setPaymentProvider,
  startPayment,
  paymentSuccess,
  paymentFailure,
  clearPayment,
} = paymentSlice.actions;

export default paymentSlice.reducer;