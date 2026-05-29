const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
  MercadoPagoConfig,
  Preference,
} = require('mercadopago');

const app = express();

app.use(cors());
app.use(express.json());

// Cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// API crear preferencia
app.post('/api/payments/mercado-pago/preference', async (req, res) => {
  try {
    const { amount, description } = req.body;

    console.log('BODY RECIBIDO:', req.body);
    console.log('TOKEN:', process.env.MP_ACCESS_TOKEN);

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: description,
            quantity: 1,
            currency_id: 'COP',
            unit_price: Number(amount),
          },
        ],

        // NOTA: se eliminó purpose: 'wallet_purchase' para permitir
        // pago con tarjeta, efectivo y todos los métodos disponibles.

        back_urls: {
          success: 'https://www.google.com/payment/success',
          failure: 'https://www.google.com/payment/failure',
          pending: 'https://www.google.com/payment/pending',
        },

        auto_return: 'approved',
      },
    });

    console.log('RESPUESTA MP:', JSON.stringify(response, null, 2));

    res.json({
      id: response.id,
      initPoint: response.sandbox_init_point,
    });

  } catch (error) {
    console.log('ERROR COMPLETO MP:');
    console.log(error);

    if (error.cause) {
      console.log('CAUSE:', JSON.stringify(error.cause, null, 2));
    }

    if (error.response) {
      console.log('RESPONSE:', JSON.stringify(error.response.data, null, 2));
    }

    res.status(500).json({
      message: 'Error creando preferencia',
      error: error.message,
    });
  }
});

// CONFIRMAR PAGO
app.post('/api/payments/mercado-pago/confirm', async (req, res) => {
  try {
    const { paymentId, userId } = req.body;

    console.log('CONFIRMANDO PAGO:', paymentId);

    res.json({
      paymentId,
      userId,
      status: 'approved',
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: 'Error confirmando pago',
    });
  }
});


app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});