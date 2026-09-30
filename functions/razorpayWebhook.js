const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_test_webhook_secret';

exports.razorpayWebhook = onRequest(async (req, res) => {
  // 1. Verify signature
  const signature = req.headers['x-razorpay-signature'];
  const bodyString = JSON.stringify(req.body); // Make sure this perfectly matches the raw body

  // A safer way is to use rawBody if available: const bodyString = req.rawBody.toString();
  const rawBody = req.rawBody ? req.rawBody.toString() : bodyString;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Invalid signature');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body.event;
  const payment = req.body.payload.payment.entity;
  const orderId = payment.order_id;
  
  if (!orderId) return res.status(400).send('No order ID');

  const db = getFirestore();
  const orderRef = db.collection('pendingPayments').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    console.error(`Order ${orderId} not found`);
    return res.status(404).send('Order not found');
  }

  // Only transition if it's currently pending
  if (orderSnap.data().status !== 'pending') {
    return res.status(200).send('Already processed');
  }

  if (event === 'payment.captured' || event === 'payment.authorized') {
    await orderRef.update({
      status: 'paid',
      paymentId: payment.id,
      paidAt: FieldValue.serverTimestamp(),
    });
  } else if (event === 'payment.failed') {
    await orderRef.update({
      status: 'failed',
      failedAt: FieldValue.serverTimestamp(),
    });
  }

  res.status(200).send('OK');
});
