const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Razorpay = require('razorpay');

// Razorpay keys should be configured in Firebase env
// Use functions:config:set razorpay.id="YOUR_ID" razorpay.secret="YOUR_SECRET"
const key_id = process.env.RAZORPAY_KEY_ID || 'dummy_test_key_id'; // Note: update via config for prod
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_test_key_secret';

exports.createPaymentOrder = onCall(async (request) => {
  const { eventId, teamData } = request.data;
  
  if (!eventId || !teamData) {
    throw new HttpsError('invalid-argument', 'Missing eventId or teamData');
  }

  // To prevent spam, check authentication or implement app check
  // if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in'); // if you want to gate it
  
  const razorpay = new Razorpay({ key_id, key_secret });
  
  // Calculate expiry (5 minutes from now)
  const expiresAt = Date.now() + 5 * 60 * 1000;

  // In a real app, map eventId to the exact amount via your event config data securely on the backend
  // For hackathon scale, assuming a fixed entry fee mapped here or fetched from a secure collection
  const entryFeeMap = {
    'bgmi-lec': 199,
  };
  const amountINR = entryFeeMap[eventId] || 199; 

  try {
    const order = await razorpay.orders.create({
      amount: amountINR * 100, // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${eventId}`,
      notes: { eventId, teamName: teamData.teamName }
    });

    const db = getFirestore();
    
    await db.collection('pendingPayments').doc(order.id).set({
      orderId: order.id,
      eventId,
      teamData,
      status: 'pending',
      amountINR,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
    });

    // Razorpay allows creating a UPI QR or we can generate a UPI intent link natively
    const upiIntentLink = `upi://pay?pa=successsquad@upi&pn=SuccessSquad&tr=${order.id}&am=${amountINR}&cu=INR`;
    
    // We can use an external QR generator or return the upi intent string to generate QR on client
    // For simplicity, returning upiIntentLink so client can render it using a QR library.
    // Or we could return Razorpay's generated QR if we used their QR api.

    return {
      orderId: order.id,
      upiIntentLink,
      expiresAt,
      amountINR
    };

  } catch (error) {
    console.error('Razorpay Error:', error);
    throw new HttpsError('internal', 'Failed to create payment order');
  }
});
